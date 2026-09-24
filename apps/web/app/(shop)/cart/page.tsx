'use client';

import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, ApiError } from '@/lib/api';
import { imgSrc } from '@/lib/format-price';
import { usePrice } from '@/lib/hooks';
import { useSession } from '@/lib/store';
import type { CartData } from '@/lib/types';

export default function CartPage() {
  const fmt = usePrice();
  const setCart = useSession((s) => s.setCart);
  const [cart, setLocal] = useState<CartData | null>(null);
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState('');

  const load = async (code = applied) => {
    const c = await api<CartData>(`/cart${code ? `?coupon=${encodeURIComponent(code)}` : ''}`);
    setLocal(c);
    setCart(c);
    return c;
  };

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (path: string, body: object) => {
    try {
      await api(path, { body });
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed');
    }
  };

  const applyCoupon = async () => {
    const c = await load(coupon.trim().toUpperCase());
    if (c.couponError) toast.error(c.couponError);
    else {
      setApplied(coupon.trim().toUpperCase());
      toast.success('Coupon applied');
      sessionStorage.setItem('ae-coupon', coupon.trim().toUpperCase());
    }
  };

  if (!cart) return <div className="ae-card h-40 animate-pulse" />;

  if (!cart.items.length) {
    return (
      <div className="ae-card p-12 text-center">
        <p className="text-lg font-bold text-ink">Your cart is empty</p>
        <Link href="/products" className="ae-btn mt-4">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="ae-card divide-y divide-line">
        {cart.items.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc(i.thumbnail)} alt="" width={64} height={64} className="h-16 w-16 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <Link href={`/product/${i.slug}`} className="font-semibold text-ink hover:text-primary">{i.name}</Link>
              {i.variation && <p className="text-ink-muted">{i.variation}</p>}
              <p className="text-primary">{fmt(i.price)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="ae-btn-outline h-8 w-8 !p-0" aria-label="Decrease" disabled={i.quantity <= 1} onClick={() => act('/cart/update', { id: i.id, quantity: i.quantity - 1 })}><Minus size={14} /></button>
              <span className="w-8 text-center" aria-live="polite">{i.quantity}</span>
              <button className="ae-btn-outline h-8 w-8 !p-0" aria-label="Increase" disabled={i.quantity >= i.stock} onClick={() => act('/cart/update', { id: i.id, quantity: i.quantity + 1 })}><Plus size={14} /></button>
            </div>
            <p className="w-24 text-right font-bold text-ink">{fmt(i.lineTotal)}</p>
            <button className="text-danger hover:underline" onClick={() => act('/cart/remove', { id: i.id })}>Remove</button>
          </div>
        ))}
      </section>

      <aside className="ae-card h-fit space-y-3 p-4">
        <h2 className="ae-h">Order summary</h2>
        <div className="flex gap-2">
          <input className="ae-input" placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} aria-label="Coupon code" />
          <button className="ae-btn-outline" onClick={applyCoupon} disabled={!coupon.trim()}>Apply</button>
        </div>
        <dl className="space-y-1">
          <Row label="Subtotal" v={fmt(cart.subtotal)} />
          <Row label="Tax" v={fmt(cart.tax)} />
          <Row label="Shipping" v={fmt(cart.shippingCost)} />
          {cart.couponDiscount > 0 && <Row label="Coupon" v={`-${fmt(cart.couponDiscount)}`} />}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink"><dt>Total</dt><dd className="text-primary">{fmt(cart.grandTotal)}</dd></div>
        </dl>
        <Link href="/checkout" className="ae-btn w-full">Proceed to checkout</Link>
      </aside>
    </div>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return <div className="flex justify-between"><dt>{label}</dt><dd>{v}</dd></div>;
}
