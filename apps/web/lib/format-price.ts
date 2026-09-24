import type { Currency } from './types';

/** จัดรูปแบบราคาตามสกุลเงิน เช่น $1,200.000 (สอดคล้องกับ formatPrice ฝั่ง API) */
export function formatPrice(amount: number, c: Currency | undefined): string {
  const cur = c ?? { symbol: '$', exchangeRate: 1, symbolPosition: 'before', decimalPlaces: 3, decimalSeparator: '.', thousandSeparator: ',' };
  const value = (amount * cur.exchangeRate).toFixed(cur.decimalPlaces);
  const [int, frac] = value.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, cur.thousandSeparator);
  const num = frac ? `${grouped}${cur.decimalSeparator}${frac}` : grouped;
  return cur.symbolPosition === 'after' ? `${num}${cur.symbol}` : `${cur.symbol}${num}`;
}

/** URL รูปจาก API (path ขึ้นต้น /api/... ผ่าน rewrite) */
export const imgSrc = (s: string | null | undefined): string => s || '/api/img/400x400?t=No+image&c=8A8A9A';
