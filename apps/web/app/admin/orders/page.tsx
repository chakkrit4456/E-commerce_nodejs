'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, ApiError } from '@/lib/api';
import { usePrice } from '@/lib/hooks';
import type { Paged } from '@/lib/types';

const STATUSES = ['pending', 'confirmed', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];
const PAYMENTS = ['unpaid', 'paid', 'refunded', 'partially_refunded'];

interface Row {
  id: number;
  code: string;
  createdAt: string;
  grandTotal: number;
  deliveryStatus: string;
  paymentStatus: string;
  viewed: boolean;
  user: { name: string } | null;
  guestId: string | null;
}

interface Detail extends Row {
  shippingAddress: Record<string, string>;
  trackingCode: string | null;
  details: { id: number; productName: string; quantity: number; price: number }[];
  history: { id: number; status: string; note: string | null; createdAt: string }[];
}

export default function AdminOrders() {
  const fmt = usePrice();
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const { data } = useQuery({ queryKey: ['a-orders', status], queryFn: () => api<Paged<Row>>(`/admin/orders?status=${status}`) });
  const detail = useQuery({ queryKey: ['a-order', openId], enabled: openId !== null, queryFn: () => api<Detail>(`/admin/orders/${openId}`) });

  const update = useMutation({
    mutationFn: (b: { deliveryStatus?: string; paymentStatus?: string; trackingCode?: string }) => api(`/admin/orders/${openId}/status`, { method: 'PUT', body: b }),
    onSuccess: () => { toast.success('Order updated'); qc.invalidateQueries({ queryKey: ['a-orders'] }); qc.invalidateQueries({ queryKey: ['a-order'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
  });

  const d = detail.data;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="ae-h">Orders</h1>
          <select className="ae-input w-44" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="ae-card overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead className="border-b border-line text-ink"><tr><th className="p-3">Code</th><th>Customer</th><th>Total</th><th>Delivery</th><th>Payment</th></tr></thead>
            <tbody>
              {data?.items.map((o) => (
                <tr key={o.id} onClick={() => setOpenId(o.id)} className={`cursor-pointer border-b border-line hover:bg-body ${openId === o.id ? 'bg-primary-soft' : ''}`}>
                  <td className={`p-3 ${o.viewed ? '' : 'font-bold text-ink'}`}>{o.code}</td>
                  <td>{o.user?.name ?? 'Guest'}</td>
                  <td>{fmt(Number(o.grandTotal))}</td>
                  <td>{o.deliveryStatus.replace('_', ' ')}</td>
                  <td>{o.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.items.length === 0 && <p className="p-6 text-center text-ink-muted">No orders.</p>}
        </div>
      </section>

      <aside className="ae-card h-fit space-y-3 p-4">
        {!d ? <p className="text-ink-muted">Select an order to see details.</p> : (
          <>
            <h2 className="ae-h">{d.code}</h2>
            <p>{d.shippingAddress.name} · {d.shippingAddress.phone}<br />{d.shippingAddress.address}, {d.shippingAddress.city} {d.shippingAddress.postalCode}</p>
            <ul className="divide-y divide-line">{d.details.map((i) => <li key={i.id} className="flex justify-between py-1"><span>{i.productName} × {i.quantity}</span><span>{fmt(Number(i.price) * i.quantity)}</span></li>)}</ul>
            <p className="text-right font-bold text-primary">{fmt(Number(d.grandTotal))}</p>
            <div>
              <label className="ae-label" htmlFor="ds">Delivery status</label>
              <select id="ds" className="ae-input" value={d.deliveryStatus} disabled={d.deliveryStatus === 'cancelled' || update.isPending} onChange={(e) => update.mutate({ deliveryStatus: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="ae-label" htmlFor="ps">Payment status</label>
              <select id="ps" className="ae-input" value={d.paymentStatus} disabled={update.isPending} onChange={(e) => update.mutate({ paymentStatus: e.target.value })}>
                {PAYMENTS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get('tracking'); if (v) update.mutate({ trackingCode: String(v) }); }} className="flex gap-2">
              <input name="tracking" key={d.id} defaultValue={d.trackingCode ?? ''} className="ae-input" placeholder="Tracking number" aria-label="Tracking number" />
              <button className="ae-btn-outline">Save</button>
            </form>
            <button className="ae-btn-outline w-full" onClick={() => window.print()}>Print invoice</button>
            <h3 className="font-bold text-ink">History</h3>
            <ol className="space-y-1 text-[12px]">{d.history.map((h) => <li key={h.id}>{new Date(h.createdAt).toLocaleString()} — <strong>{h.status.replace('_', ' ')}</strong>{h.note ? ` (${h.note})` : ''}</li>)}</ol>
          </>
        )}
      </aside>
    </div>
  );
}
