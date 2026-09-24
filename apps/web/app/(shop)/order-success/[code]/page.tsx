'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '@/lib/api';
import { usePrice } from '@/lib/hooks';

interface Order {
  code: string;
  grandTotal: number;
  deliveryStatus: string;
  paymentType: string;
  details: { id: number; productName: string; quantity: number; price: number }[];
}

export default function OrderSuccess({ params }: { params: { code: string } }) {
  const fmt = usePrice();
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api<Order>(`/orders/track/${params.code}`).then(setOrder).catch(() => setMissing(true));
  }, [params.code]);

  return (
    <div className="ae-card mx-auto max-w-xl space-y-3 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-white" aria-hidden><Check size={30} strokeWidth={3} /></div>
      <h1 className="text-xl font-bold text-ink">Thank you for your order!</h1>
      <p>Your order code is <strong className="text-primary">{params.code}</strong></p>
      {order && (
        <div className="space-y-1 border-t border-line pt-3 text-left">
          {order.details.map((d) => <div key={d.id} className="flex justify-between"><span>{d.productName} × {d.quantity}</span><span>{fmt(Number(d.price) * d.quantity)}</span></div>)}
          <div className="flex justify-between border-t border-line pt-2 font-bold text-ink"><span>Total ({order.paymentType.toUpperCase()})</span><span>{fmt(Number(order.grandTotal))}</span></div>
        </div>
      )}
      {missing && <p className="text-ink-muted">Order details are only visible on the device that placed the order.</p>}
      <div className="flex justify-center gap-2 pt-2">
        <Link href="/products" className="ae-btn">Continue shopping</Link>
        <Link href="/account" className="ae-btn-outline">My orders</Link>
      </div>
    </div>
  );
}
