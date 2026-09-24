import type { Request } from 'express';
import Decimal from 'decimal.js';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http';
import { activeFlashMap } from './product-service';
import { taxFor, unitPriceAfterDiscount } from './pricing-service';
import { evaluateCoupon } from './coupon-service';

export interface CartOwner {
  userId?: number;
  tempUserId?: string;
}

export function cartOwner(req: Request): CartOwner {
  const temp = req.header('x-temp-user-id') || undefined;
  if (req.user) return { userId: req.user.id, tempUserId: temp };
  if (!temp) throw new HttpError(400, 'Missing x-temp-user-id header');
  return { tempUserId: temp };
}

const ownerWhere = (o: CartOwner) => (o.userId ? { userId: o.userId } : { tempUserId: o.tempUserId, userId: null });

export async function addToCart(o: CartOwner, productId: number, quantity: number, variation?: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, published: true, deletedAt: null } });
  if (!product) throw new HttpError(404, 'Product not found');
  const existing = await prisma.cart.findFirst({ where: { ...ownerWhere(o), productId, variation: variation ?? null } });
  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty < product.minQty) throw new HttpError(400, `Minimum quantity is ${product.minQty}`);
  if (newQty > product.currentStock) throw new HttpError(400, 'Not enough stock');
  const flash = (await activeFlashMap()).get(productId);
  const price = unitPriceAfterDiscount(product, flash);
  const data = { price: price.toString(), tax: taxFor(product, price).toString(), quantity: newQty };
  if (existing) await prisma.cart.update({ where: { id: existing.id }, data });
  else await prisma.cart.create({ data: { ...ownerWhere(o), productId, variation: variation ?? null, ...data } });
}

export async function updateQuantity(o: CartOwner, id: number, quantity: number) {
  const line = await prisma.cart.findFirst({ where: { id, ...ownerWhere(o) }, include: { product: true } });
  if (!line) throw new HttpError(404, 'Cart item not found');
  if (quantity > line.product.currentStock) throw new HttpError(400, 'Not enough stock');
  await prisma.cart.update({ where: { id }, data: { quantity } });
}

export async function removeLine(o: CartOwner, id: number) {
  await prisma.cart.deleteMany({ where: { id, ...ownerWhere(o) } });
}

/** ราคาคำนวณใหม่ทุกครั้งที่อ่านตะกร้า (ไม่เชื่อ snapshot) */
export async function getCart(o: CartOwner, couponCode?: string | null) {
  const rows = await prisma.cart.findMany({ where: ownerWhere(o), include: { product: true }, orderBy: { id: 'asc' } });
  const flash = await activeFlashMap();
  let subtotal = new Decimal(0);
  let tax = new Decimal(0);
  let shipping = new Decimal(0);
  const items = rows.map((r) => {
    const price = unitPriceAfterDiscount(r.product, flash.get(r.productId));
    const lineTax = taxFor(r.product, price, r.quantity);
    const lineShip =
      r.product.shippingType === 'free' ? new Decimal(0) : new Decimal(r.product.shippingCost.toString()).mul(r.quantity);
    subtotal = subtotal.plus(price.mul(r.quantity));
    tax = tax.plus(lineTax);
    shipping = shipping.plus(lineShip);
    return {
      id: r.id,
      productId: r.productId,
      name: r.product.name,
      slug: r.product.slug,
      thumbnail: r.product.thumbnail,
      variation: r.variation,
      quantity: r.quantity,
      price: price.toNumber(),
      lineTotal: price.mul(r.quantity).toNumber(),
      stock: r.product.currentStock,
    };
  });
  let discount = new Decimal(0);
  let couponError: string | undefined;
  if (couponCode) {
    try {
      discount = await evaluateCoupon(
        couponCode,
        rows.map((r, i) => ({ productId: r.productId, price: new Decimal(items[i].price), quantity: r.quantity })),
        o.userId,
      );
    } catch (e) {
      couponError = e instanceof HttpError ? e.message : 'Coupon error';
    }
  }
  const grandTotal = subtotal.plus(tax).plus(shipping).minus(discount);
  return {
    items,
    count: rows.reduce((s, r) => s + r.quantity, 0),
    subtotal: subtotal.toNumber(),
    tax: tax.toNumber(),
    shippingCost: shipping.toNumber(),
    couponDiscount: discount.toNumber(),
    couponError,
    grandTotal: grandTotal.toNumber(),
  };
}

/** รวมตะกร้า guest เข้าบัญชีหลังล็อกอิน */
export async function mergeGuestCart(tempUserId: string, userId: number) {
  const guest = await prisma.cart.findMany({ where: { tempUserId, userId: null } });
  for (const g of guest) {
    const mine = await prisma.cart.findFirst({ where: { userId, productId: g.productId, variation: g.variation } });
    if (mine) {
      await prisma.cart.update({ where: { id: mine.id }, data: { quantity: mine.quantity + g.quantity } });
      await prisma.cart.delete({ where: { id: g.id } });
    } else {
      await prisma.cart.update({ where: { id: g.id }, data: { userId, tempUserId: null } });
    }
  }
}
