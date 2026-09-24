import { describe, expect, it } from 'vitest';
import { discountPercent, taxFor, unitPriceAfterDiscount, type PricedProduct } from '../src/services/pricing-service';
import { formatPrice } from '../src/services/currency-service';

const base: PricedProduct = { unitPrice: '100', discount: '0', discountType: 'amount', tax: '7', taxType: 'percent' };

describe('PricingService', () => {
  it('returns unit price when no discount', () => {
    expect(unitPriceAfterDiscount(base).toString()).toBe('100');
  });
  it('applies percent and amount discounts', () => {
    expect(unitPriceAfterDiscount({ ...base, discount: '20', discountType: 'percent' }).toString()).toBe('80');
    expect(unitPriceAfterDiscount({ ...base, discount: '15', discountType: 'amount' }).toString()).toBe('85');
  });
  it('never goes below zero', () => {
    expect(unitPriceAfterDiscount({ ...base, discount: '500', discountType: 'amount' }).toString()).toBe('0');
  });
  it('ignores discount outside its date window', () => {
    const past = { ...base, discount: '50', discountType: 'percent' as const, discountEndDate: new Date(Date.now() - 1000) };
    expect(unitPriceAfterDiscount(past).toString()).toBe('100');
  });
  it('flash deal overrides product discount', () => {
    expect(
      unitPriceAfterDiscount({ ...base, discount: '10', discountType: 'percent' }, { discount: '30', discountType: 'percent' }).toString(),
    ).toBe('70');
  });
  it('avoids float error on money', () => {
    expect(unitPriceAfterDiscount({ ...base, unitPrice: '0.3', discount: '0.1', discountType: 'amount' }).toString()).toBe('0.2');
    expect(taxFor(base, unitPriceAfterDiscount(base), 3).toString()).toBe('21');
  });
  it('computes discount percent', () => {
    expect(discountPercent('100', '75')).toBe(25);
  });
});

describe('formatPrice', () => {
  const usd = { symbol: '$', exchangeRate: 1, symbolPosition: 'before', decimalPlaces: 3, decimalSeparator: '.', thousandSeparator: ',' };
  it('matches the reference format $1,200.000', () => {
    expect(formatPrice(1200, usd)).toBe('$1,200.000');
    expect(formatPrice('52', usd)).toBe('$52.000');
  });
  it('converts by exchange rate and supports symbol after', () => {
    expect(formatPrice(10, { ...usd, symbol: '฿', exchangeRate: '36.5', decimalPlaces: 2, symbolPosition: 'after' })).toBe('365.00฿');
  });
});
