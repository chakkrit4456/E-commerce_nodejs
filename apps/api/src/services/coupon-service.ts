import Decimal from 'decimal.js';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http';

interface CouponDetails {
  minBuy?: number;
  maxDiscount?: number;
  productIds?: number[];
}

export interface CartLine {
  productId: number;
  price: Decimal;
  quantity: number;
}

/** คืนส่วนลดที่คำนวณจาก server เท่านั้น */
export async function evaluateCoupon(code: string, lines: CartLine[], userId?: number | null): Promise<Decimal> {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!coupon || coupon.startDate > now || coupon.endDate < now) throw new HttpError(400, 'Invalid or expired coupon');

  const used = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
  if (coupon.usageLimit != null && used >= coupon.usageLimit) throw new HttpError(400, 'Coupon usage limit reached');
  if (userId) {
    const mine = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (mine >= coupon.perUserLimit) throw new HttpError(400, 'You have already used this coupon');
  }

  const d = (coupon.details ?? {}) as CouponDetails;
  const eligible =
    coupon.type === 'product_base' ? lines.filter((l) => d.productIds?.includes(l.productId)) : lines;
  const base = eligible.reduce((s, l) => s.plus(l.price.mul(l.quantity)), new Decimal(0));
  if (base.lte(0)) throw new HttpError(400, 'Coupon does not apply to items in cart');
  if (d.minBuy && base.lt(d.minBuy)) throw new HttpError(400, `Minimum spend is ${d.minBuy}`);

  let off =
    coupon.discountType === 'percent' ? base.mul(coupon.discount.toString()).div(100) : new Decimal(coupon.discount.toString());
  if (d.maxDiscount) off = Decimal.min(off, d.maxDiscount);
  return Decimal.min(off, base).toDecimalPlaces(2);
}
