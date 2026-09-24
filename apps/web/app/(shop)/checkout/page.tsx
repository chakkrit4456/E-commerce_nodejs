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

type PaymentType = 'cod' | 'promptpay' | 'bank_transfer';

const PAYMENT_OPTIONS: { value: PaymentType | 'card' | 'truemoney' | 'mobile_banking'; label: string; enabled: boolean; hint?: string }[] = [
  { value: 'promptpay', label: 'พร้อมเพย์ (QR Code)', enabled: true, hint: 'สแกนจ่ายผ่านแอปธนาคาร' },
  { value: 'bank_transfer', label: 'โอนผ่านบัญชีธนาคาร', enabled: true, hint: 'แนบสลิปหลังโอน' },
  { value: 'cod', label: 'เก็บเงินปลายทาง (COD)', enabled: true },
  { value: 'card', label: 'บัตรเครดิต/เดบิต', enabled: false, hint: 'เร็วๆ นี้' },
  { value: 'truemoney', label: 'TrueMoney Wallet', enabled: false, hint: 'เร็วๆ นี้' },
  { value: 'mobile_banking', label: 'Mobile Banking (K PLUS, SCB Easy ฯลฯ)', enabled: false, hint: 'เร็วๆ นี้' },
];

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
  const [paymentType, setPaymentType] = useState<PaymentType>('promptpay');

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
    if (!form.name.trim()) e.name = 'กรุณากรอกชื่อ';
    if (form.phone.trim().length < 5) e.phone = 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง';
    if (form.address.trim().length < 3) e.address = 'กรุณากรอกที่อยู่';
    if (!form.city.trim()) e.city = 'กรุณากรอกเขต/อำเภอ';
    if (form.postalCode.trim().length < 3) e.postalCode = 'กรุณากรอกรหัสไปรษณีย์';
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
        body: { shippingAddress: { ...rest, ...(state ? { state } : {}) }, paymentType, couponCode: coupon || undefined, currencyCode: currency, notes: notes || undefined },
      });
      sessionStorage.removeItem('ae-coupon');
      setCart({ count: 0 });
      router.push(`/order-success/${order.code}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'สั่งซื้อไม่สำเร็จ');
      setBusy(false);
    }
  };

  if (!cart) return <div className="ae-card h-40 animate-pulse" />;
  if (!cart.items.length) {
    return (
      <div className="ae-card p-12 text-center">
        <p className="text-lg font-bold text-ink">ตะกร้าของคุณว่างเปล่า</p>
        <Link href="/products" className="ae-btn mt-4">เลือกซื้อสินค้าต่อ</Link>
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
          <h2 className="ae-h">1. ที่อยู่จัดส่ง</h2>
          {!user && <p className="text-ink-muted">สั่งซื้อแบบไม่สมัครสมาชิก <Link href="/login" className="text-primary">เข้าสู่ระบบ</Link> เพื่อบันทึกข้อมูลของคุณ</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {field('name', 'ชื่อ-นามสกุล')}
            {field('phone', 'เบอร์โทรศัพท์', 'tel')}
          </div>
          {field('address', 'ที่อยู่')}
          <div className="grid gap-3 sm:grid-cols-3">
            {field('city', 'เขต/อำเภอ')}
            {field('state', 'จังหวัด', 'text', false)}
            {field('postalCode', 'รหัสไปรษณีย์')}
          </div>
        </section>
        <section className="ae-card space-y-2 p-4">
          <h2 className="ae-h">2. การจัดส่ง</h2>
          <p>จัดส่งแบบมาตรฐาน — คิดค่าจัดส่งตามสินค้าแต่ละชิ้น ({fmt(cart.shippingCost)})</p>
        </section>
        <section className="ae-card space-y-2 p-4">
          <h2 className="ae-h">3. ช่องทางชำระเงิน</h2>
          <p className="rounded bg-warning/10 px-2 py-1 text-[12px] text-warning">โหมดทดสอบ — ทุกช่องทางยังไม่มีการเรียกเก็บเงินจริงผ่านระบบอัตโนมัติ</p>
          <div className="space-y-1.5">
            {PAYMENT_OPTIONS.map((opt) => (
              <label key={opt.value} className={`flex items-center gap-2 rounded-card border p-2.5 ${opt.enabled ? 'border-line cursor-pointer' : 'border-line/60 cursor-not-allowed opacity-60'} ${paymentType === opt.value ? 'border-primary bg-primary-soft' : ''}`}>
                <input
                  type="radio"
                  name="paymentType"
                  disabled={!opt.enabled}
                  checked={opt.enabled && paymentType === opt.value}
                  onChange={() => opt.enabled && setPaymentType(opt.value as PaymentType)}
                />
                <span className="flex-1">{opt.label}</span>
                {opt.hint && <span className="text-[11px] text-ink-muted">{opt.hint}</span>}
              </label>
            ))}
          </div>
          <label className="ae-label mt-2" htmlFor="notes">หมายเหตุคำสั่งซื้อ</label>
          <textarea id="notes" className="ae-input h-20 py-2" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </section>
      </div>

      <aside className="ae-card h-fit space-y-2 p-4">
        <h2 className="ae-h">สรุปคำสั่งซื้อ</h2>
        <ul className="divide-y divide-line">
          {cart.items.map((i) => <li key={i.id} className="flex justify-between py-1.5"><span className="truncate pr-2">{i.name} × {i.quantity}</span><span>{fmt(i.lineTotal)}</span></li>)}
        </ul>
        <div className="flex justify-between"><span>ภาษี</span><span>{fmt(cart.tax)}</span></div>
        <div className="flex justify-between"><span>ค่าจัดส่ง</span><span>{fmt(cart.shippingCost)}</span></div>
        {cart.couponDiscount > 0 && <div className="flex justify-between"><span>คูปอง {coupon}</span><span>-{fmt(cart.couponDiscount)}</span></div>}
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink"><span>ยอดรวมทั้งหมด</span><span className="text-primary">{fmt(cart.grandTotal)}</span></div>
        <button className="ae-btn w-full" disabled={busy}>
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {busy ? 'กำลังสั่งซื้อ…' : 'ยืนยันสั่งซื้อ'}
        </button>
      </aside>
    </form>
  );
}
