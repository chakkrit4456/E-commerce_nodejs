import Decimal from 'decimal.js';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http';
import { forget } from '../lib/cache';
import { activeFlashMap } from '../services/product-service';
import { taxFor, unitPriceAfterDiscount } from '../services/pricing-service';
import { evaluateCoupon } from '../services/coupon-service';
import type { CartOwner } from '../services/cart-service';

export interface PlaceOrderInput {
  owner: CartOwner;
  shippingAddress: Record<string, unknown>;
  paymentType: string;
  couponCode?: string;
  currencyCode: string;
  notes?: string;
}

const orderCode = (): string => {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${d}-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')}`;
};

/** ราคา/ส่วนลด/สต็อก คำนวณฝั่ง server ทั้งหมด และอยู่ใน transaction เดียว */
export async function placeOrderAction(input: PlaceOrderInput) {
  const { owner } = input;
  const where = owner.userId ? { userId: owner.userId } : { tempUserId: owner.tempUserId, userId: null };
  const cart = await prisma.cart.findMany({ where, include: { product: true } });
  if (!cart.length) throw new HttpError(400, 'Cart is empty');

  const currency = await prisma.currency.findUnique({ where: { code: input.currencyCode } });
  const flash = await activeFlashMap();

  const lines = cart.map((c) => {
    if (!c.product.published || c.product.deletedAt) throw new HttpError(400, `${c.product.name} is no longer available`);
    const price = unitPriceAfterDiscount(c.product, flash.get(c.productId));
    const ship =
      c.product.shippingType === 'free' ? new Decimal(0) : new Decimal(c.product.shippingCost.toString()).mul(c.quantity);
    return { c, price, tax: taxFor(c.product, price, c.quantity), ship };
  });
  const subtotal = lines.reduce((s, l) => s.plus(l.price.mul(l.c.quantity)), new Decimal(0));
  const tax = lines.reduce((s, l) => s.plus(l.tax), new Decimal(0));
  const shipping = lines.reduce((s, l) => s.plus(l.ship), new Decimal(0));
  const coupon = input.couponCode
    ? await evaluateCoupon(
        input.couponCode,
        lines.map((l) => ({ productId: l.c.productId, price: l.price, quantity: l.c.quantity })),
        owner.userId,
      )
    : new Decimal(0);
  const grandTotal = subtotal.plus(tax).plus(shipping).minus(coupon);

  const order = await prisma.$transaction(async (tx) => {
    // ตัดสต็อกแบบ atomic: เงื่อนไข stock >= qty อยู่ใน UPDATE เดียว
    for (const l of lines) {
      const r = await tx.product.updateMany({
        where: { id: l.c.productId, currentStock: { gte: l.c.quantity } },
        data: { currentStock: { decrement: l.c.quantity }, numOfSale: { increment: l.c.quantity } },
      });
      if (r.count === 0) throw new HttpError(409, `Not enough stock for ${l.c.product.name}`);
    }
    const created = await tx.order.create({
      data: {
        code: orderCode(),
        userId: owner.userId ?? null,
        guestId: owner.userId ? null : owner.tempUserId,
        shippingAddress: input.shippingAddress as object,
        paymentType: input.paymentType,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        shippingCost: shipping.toString(),
        couponDiscount: coupon.toString(),
        grandTotal: grandTotal.toString(),
        currencyCode: input.currencyCode,
        exchangeRate: currency?.exchangeRate.toString() ?? '1',
        notes: input.notes,
        details: {
          create: lines.map((l) => ({
            productId: l.c.productId,
            productName: l.c.product.name,
            variation: l.c.variation,
            price: l.price.toString(),
            tax: l.tax.toString(),
            shippingCost: l.ship.toString(),
            quantity: l.c.quantity,
          })),
        },
        history: { create: { status: 'pending', note: 'Order placed' } },
      },
    });
    if (input.couponCode) {
      const cp = await tx.coupon.findUnique({ where: { code: input.couponCode } });
      if (cp) await tx.couponUsage.create({ data: { couponId: cp.id, userId: owner.userId ?? null, orderId: created.id } });
    }
    await tx.cart.deleteMany({ where });
    return created;
  });
  forget('home');
  return order;
}
