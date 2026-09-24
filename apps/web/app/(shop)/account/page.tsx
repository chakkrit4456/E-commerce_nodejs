'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, ApiError } from '@/lib/api';
import { useMounted, usePrice } from '@/lib/hooks';
import { useSession } from '@/lib/store';

interface Order {
  id: number;
  code: string;
  createdAt: string;
  grandTotal: number;
  deliveryStatus: string;
  paymentStatus: string;
  details: { id: number; productName: string; quantity: number }[];
}

const badge: Record<string, string> = {
  pending: 'bg-warning/20 text-warning', confirmed: 'bg-primary-soft text-primary', picked_up: 'bg-primary-soft text-primary',
  on_the_way: 'bg-primary-soft text-primary', delivered: 'bg-success/20 text-success', cancelled: 'bg-danger/20 text-danger',
};

export default function AccountPage() {
  const router = useRouter();
  const mounted = useMounted();
  const fmt = usePrice();
  const { user } = useSession();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!mounted) return;
    if (!user) return void router.replace('/login');
    api<Order[]>('/me/orders').then(setOrders).catch(() => setOrders([]));
  }, [mounted, user, router]);

  const refund = async (orderId: number) => {
    const reason = window.prompt('Reason for refund request?');
    if (!reason || reason.length < 3) return;
    try {
      await api('/me/refunds', { body: { orderId, reason } });
      toast.success('Refund request submitted');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed');
    }
  };

  if (!mounted || !user) return <div className="ae-card h-40 animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="ae-card p-4">
        <h1 className="text-lg font-bold text-ink">Hello, {user.name}</h1>
        <p className="text-ink-muted">{user.email}</p>
      </div>
      <section className="ae-card p-4">
        <h2 className="ae-h mb-3">Purchase history</h2>
        {orders === null && <div className="h-16 animate-pulse rounded bg-body" />}
        {orders?.length === 0 && (
          <p className="py-6 text-center text-ink-muted">No orders yet. <Link href="/products" className="text-primary">Start shopping</Link></p>
        )}
        <ul className="divide-y divide-line">
          {orders?.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{o.code}</p>
                <p className="truncate text-ink-muted">{o.details.map((d) => `${d.productName} × ${d.quantity}`).join(', ')}</p>
                <p className="text-[12px] text-ink-muted">{new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <span className={`rounded px-2 py-0.5 text-[12px] font-semibold ${badge[o.deliveryStatus] ?? ''}`}>{o.deliveryStatus.replace('_', ' ')}</span>
              <span className="w-28 text-right font-bold text-primary">{fmt(Number(o.grandTotal))}</span>
              {o.deliveryStatus === 'delivered' && o.paymentStatus !== 'refunded' && <button className="ae-btn-outline" onClick={() => refund(o.id)}>Request refund</button>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
