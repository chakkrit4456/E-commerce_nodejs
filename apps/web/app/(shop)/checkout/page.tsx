'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, ApiError } from '@/lib/api';
import { usePrice } from '@/lib/hooks';
import { useSession } from '@/lib/store';
import type { CartData } from '@/lib/types';

const empty = { name: '', phone: '', address: '', city: '', state: '', country: 'TH', postalCode: '' };
type Errors = Partial<Record<keyof typeof empty, string>>;

export default function CheckoutPage() {
  const router = useRouter();
  const fmt = usePrice();
  const { user, currency, setCart } = useSession();
  const [cart, setLocal] = useState<CartData | null>(null);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [coupon, setCoupon] = useState('');

  useEffect(() => {
    const c = sessionStorage.getItem('ae-coupon') ?? '';
    setCoupon(c);
    api<CartData>(`/cart${c ? `?coupon=${encodeURIComponent(c)}` : ''}`).then(setLocal).catch(() => undefined);
    if (user) {
      api<(typeof empty)[]>('/me/addresses').then((a) => a[0] && setForm({ ...empty, ...a[0] })).catch(() => undefined);
      setForm((f) => (f.name ? f : { ...f, name: user.name }));
    }
  }, [user]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.phone.trim().length < 5) e.phone = 'Enter a valid phone number';
    if (form.address.trim().length < 3) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (form.postalCode.trim().length < 3) e.postalCode = 'Postal code is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const place = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const { state, ...rest } = form;
      const order = await api<{ code: string }>('/checkout', {
        body: { shippingAddress: { ...rest, ...(state ? { state } : {}) }, paymentType: 'cod', couponCode: coupon || undefined, currencyCode: currency, notes: notes || undefined },
      });
      sessionStorage.removeItem('ae-coupon');
      setCart({ count: 0 });
      router.push(`/order-success/${order.code}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not place order');
      setBusy(false);
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

  const field = (k: keyof typeof empty, label: string, type = 'text', required = true) => (
    <div>
      <label className="ae-label" htmlFor={k}>{label}{required && ' *'}</label>
      <input id={k} type={type} className={`ae-input ${errors[k] ? '!border-danger' : ''}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} aria-invalid={!!errors[k]} />
      {errors[k] && <p className="mt-1 text-[12px] text-danger">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={place} className="grid gap-4 lg:grid-cols-[1fr_340px]" noValidate>
      <div className="space-y-4">
        <section className="ae-card space-y-3 p-4">
          <h2 className="ae-h">1. Shipping address</h2>
          {!user && <p className="text-ink-muted">Checking out as guest. <Link href="/login" className="text-primary">Login</Link> to save your details.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {field('name', 'Full name')}
            {field('phone', 'Phone', 'tel')}
          </div>
          {field('address', 'Address')}
          <div className="grid gap-3 sm:grid-cols-3">
            {field('city', 'City')}
            {field('state', 'State / Province', 'text', false)}
            {field('postalCode', 'Postal code')}
          </div>
        </section>
        <section className="ae-card space-y-2 p-4">
          <h2 className="ae-h">2. Delivery</h2>
          <p>Standard delivery — shipping calculated per product ({fmt(cart.shippingCost)}).</p>
        </section>
        <section className="ae-card space-y-2 p-4">
          <h2 className="ae-h">3. Payment</h2>
          <label className="flex items-center gap-2"><input type="radio" checked readOnly /> Cash on delivery</label>
          <label className="ae-label mt-2" htmlFor="notes">Order notes</label>
          <textarea id="notes" className="ae-input h-20 py-2" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </section>
      </div>

      <aside className="ae-card h-fit space-y-2 p-4">
        <h2 className="ae-h">Order summary</h2>
        <ul className="divide-y divide-line">
          {cart.items.map((i) => <li key={i.id} className="flex justify-between py-1.5"><span className="truncate pr-2">{i.name} × {i.quantity}</span><span>{fmt(i.lineTotal)}</span></li>)}
        </ul>
        <div className="flex justify-between"><span>Tax</span><span>{fmt(cart.tax)}</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>{fmt(cart.shippingCost)}</span></div>
        {cart.couponDiscount > 0 && <div className="flex justify-between"><span>Coupon {coupon}</span><span>-{fmt(cart.couponDiscount)}</span></div>}
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink"><span>Total</span><span className="text-primary">{fmt(cart.grandTotal)}</span></div>
        <button className="ae-btn w-full" disabled={busy}>
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {busy ? 'Placing order…' : 'Place order'}
        </button>
      </aside>
    </form>
  );
}
