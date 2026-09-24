'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';

interface Coupon { id: number; code: string; discount: number; discountType: string; startDate: string; endDate: string; usageLimit: number | null }

const day = (offset: number) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

export default function AdminCoupons() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['coupons'], queryFn: () => api<Coupon[]>('/admin/coupons') });
  const [f, setF] = useState({ code: '', discount: 10, discountType: 'percent', startDate: day(0), endDate: day(30), minBuy: 0 });
  const done = () => qc.invalidateQueries({ queryKey: ['coupons'] });
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'ไม่สำเร็จ');

  const create = useMutation({
    mutationFn: () => api('/admin/coupons', { body: { code: f.code, discount: Number(f.discount), discountType: f.discountType, startDate: f.startDate, endDate: f.endDate, details: f.minBuy ? { minBuy: Number(f.minBuy) } : {} } }),
    onSuccess: () => { toast.success('สร้างคูปองแล้ว'); setF({ ...f, code: '' }); done(); }, onError: fail,
  });
  const del = useMutation({ mutationFn: (id: number) => api(`/admin/coupons/${id}`, { method: 'DELETE' }), onSuccess: done, onError: fail });

  return (
    <div className="space-y-3">
      <h1 className="ae-h">คูปอง</h1>
      <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="ae-card grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
        <div><label className="ae-label" htmlFor="cc">รหัสคูปอง</label><input id="cc" required minLength={3} className="ae-input uppercase" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
        <div><label className="ae-label" htmlFor="cd">ส่วนลด</label><input id="cd" type="number" min="0.01" step="0.01" required className="ae-input" value={f.discount} onChange={(e) => setF({ ...f, discount: Number(e.target.value) })} /></div>
        <div><label className="ae-label" htmlFor="ct">ประเภท</label><select id="ct" className="ae-input" value={f.discountType} onChange={(e) => setF({ ...f, discountType: e.target.value })}><option value="percent">%</option><option value="amount">จำนวนเงิน</option></select></div>
        <div><label className="ae-label" htmlFor="cs">เริ่ม</label><input id="cs" type="date" className="ae-input" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></div>
        <div><label className="ae-label" htmlFor="ce">สิ้นสุด</label><input id="ce" type="date" className="ae-input" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></div>
        <div><label className="ae-label" htmlFor="cm">ยอดซื้อขั้นต่ำ</label><input id="cm" type="number" min="0" className="ae-input" value={f.minBuy} onChange={(e) => setF({ ...f, minBuy: Number(e.target.value) })} /></div>
        <button className="ae-btn sm:col-span-3 lg:col-span-6" disabled={create.isPending}>สร้างคูปอง</button>
      </form>
      <div className="ae-card overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead className="border-b border-line text-ink"><tr><th className="p-3">รหัส</th><th>ส่วนลด</th><th>ระยะเวลา</th><th /></tr></thead>
          <tbody>{data?.map((c) => (
            <tr key={c.id} className="border-b border-line last:border-0">
              <td className="p-3 font-semibold text-ink">{c.code}</td>
              <td>{c.discount}{c.discountType === 'percent' ? '%' : ''}</td>
              <td>{c.startDate.slice(0, 10)} ถึง {c.endDate.slice(0, 10)}</td>
              <td><button className="text-danger" onClick={() => window.confirm(`ลบคูปอง ${c.code}?`) && del.mutate(c.id)}>ลบ</button></td>
            </tr>
          ))}</tbody>
        </table>
        {data?.length === 0 && <p className="p-6 text-center text-ink-muted">ยังไม่มีคูปอง</p>}
      </div>
    </div>
  );
}
