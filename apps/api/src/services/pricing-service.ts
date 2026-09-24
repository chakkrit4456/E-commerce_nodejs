import Decimal from 'decimal.js';

type Num = Decimal.Value;

export interface PricedProduct {
  unitPrice: Num;
  discount: Num;
  discountType: 'amount' | 'percent';
  discountStartDate?: Date | null;
  discountEndDate?: Date | null;
  tax: Num;
  taxType: 'amount' | 'percent';
}

export interface FlashDiscount {
  discount: Num;
  discountType: 'amount' | 'percent';
}

/** ที่เดียวที่คำนวณราคา (05-Coding-Style §3): ส่วนลด → flash deal → ภาษี */
export function discountActive(p: PricedProduct, now = new Date()): boolean {
  if (new Decimal(p.discount).lte(0)) return false;
  if (p.discountStartDate && p.discountStartDate > now) return false;
  if (p.discountEndDate && p.discountEndDate < now) return false;
  return true;
}

function applyDiscount(price: Decimal, d: Num, type: 'amount' | 'percent'): Decimal {
  const off = type === 'percent' ? price.mul(d).div(100) : new Decimal(d);
  return Decimal.max(price.minus(off), 0);
}

export function unitPriceAfterDiscount(p: PricedProduct, flash?: FlashDiscount | null, now = new Date()): Decimal {
  let price = new Decimal(p.unitPrice);
  if (flash) return applyDiscount(price, flash.discount, flash.discountType).toDecimalPlaces(2);
  if (discountActive(p, now)) price = applyDiscount(price, p.discount, p.discountType);
  return price.toDecimalPlaces(2);
}

export function taxFor(p: PricedProduct, price: Decimal, quantity = 1): Decimal {
  const t = p.taxType === 'percent' ? price.mul(p.tax).div(100) : new Decimal(p.tax);
  return t.mul(quantity).toDecimalPlaces(2);
}

export function discountPercent(original: Num, final: Num): number {
  const o = new Decimal(original);
  if (o.lte(0)) return 0;
  return o.minus(final).div(o).mul(100).round().toNumber();
}
