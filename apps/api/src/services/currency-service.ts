import Decimal from 'decimal.js';

export interface CurrencyFormat {
  symbol: string;
  exchangeRate: Decimal.Value;
  symbolPosition: string;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandSeparator: string;
}

/** แปลงจาก base currency แล้วจัดรูปแบบ เช่น $1,200.000 (04-Data-Schema §8, 07-UI-UX §5.9) */
export function formatPrice(amount: Decimal.Value, c: CurrencyFormat): string {
  const value = new Decimal(amount).mul(c.exchangeRate).toFixed(c.decimalPlaces);
  const [int, frac] = value.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, c.thousandSeparator);
  const num = frac ? `${grouped}${c.decimalSeparator}${frac}` : grouped;
  return c.symbolPosition === 'after' ? `${num}${c.symbol}` : `${c.symbol}${num}`;
}
