'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ImageManager from '@/components/ImageManager';
import { api, ApiError } from '@/lib/api';
import { imgSrc } from '@/lib/format-price';
import { usePrice } from '@/lib/hooks';
import type { Paged } from '@/lib/types';

interface Row {
  id: number;
  name: string;
  description: string;
  unitPrice: number;
  discount: number;
  discountType: 'amount' | 'percent';
  currentStock: number;
  categoryId: number;
  published: boolean;
  featured: boolean;
  todaysDeal: boolean;
  thumbnail: string | null;
  photos: string[] | null;
  category: { name: string };
}

interface Form {
  id?: number;
  name: string;
  categoryId: number;
  unitPrice: number;
  discount: number;
  discountType: 'amount' | 'percent';
  currentStock: number;
  description: string;
  todaysDeal: boolean;
  featured: boolean;
  photos: string[];
}

const blank: Form = { name: '', categoryId: 0, unitPrice: 0, discount: 0, discountType: 'percent', currentStock: 0, description: '', todaysDeal: false, featured: false, photos: [] };

const toForm = (p: Row): Form => ({
  id: p.id,
  name: p.name,
  categoryId: p.categoryId,
  unitPrice: Number(p.unitPrice),
  discount: Number(p.discount),
  discountType: p.discountType,
  currentStock: p.currentStock,
  description: p.description,
  todaysDeal: p.todaysDeal,
  featured: p.featured,
  photos: p.photos?.length ? p.photos : p.thumbnail ? [p.thumbnail] : [],
});

function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-line'}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function AdminProducts() {
  const fmt = usePrice();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Form | null>(null);
  const { data } = useQuery({ queryKey: ['a-products', q, page], queryFn: () => api<Paged<Row>>(`/admin/products?q=${encodeURIComponent(q)}&page=${page}`) });
  const { data: cats } = useQuery({ queryKey: ['cats'], queryFn: () => api<{ id: number; name: string }[]>('/categories') });

  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'ไม่สำเร็จ');
  const refresh = () => qc.invalidateQueries({ queryKey: ['a-products'] });

  const patch = useMutation({ mutationFn: ({ id, ...b }: { id: number } & Partial<Row>) => api(`/admin/products/${id}`, { method: 'PUT', body: b }), onSuccess: refresh, onError: fail });
  const del = useMutation({ mutationFn: (id: number) => api(`/admin/products/${id}`, { method: 'DELETE' }), onSuccess: () => { toast.success('ลบแล้ว'); refresh(); }, onError: fail });
  const save = useMutation({
    mutationFn: ({ id, ...b }: Form) => {
      const body = { ...b, categoryId: Number(b.categoryId), unitPrice: Number(b.unitPrice), discount: Number(b.discount), currentStock: Number(b.currentStock) };
      return id ? api(`/admin/products/${id}`, { method: 'PUT', body }) : api('/admin/products', { body });
    },
    onSuccess: () => { toast.success('บันทึกสินค้าแล้ว'); setForm(null); refresh(); },
    onError: fail,
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="ae-h">สินค้า</h1>
        <div className="flex gap-2">
          <input className="ae-input w-56" placeholder="ค้นหาสินค้า" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="ค้นหาสินค้า" />
          <button className="ae-btn" onClick={() => setForm({ ...blank, categoryId: cats?.[0]?.id ?? 0 })}>+ เพิ่มสินค้าใหม่</button>
        </div>
      </div>

      {form && (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="ae-card grid gap-3 p-4 md:grid-cols-2">
          <h2 className="ae-h md:col-span-2">{form.id ? `แก้ไขสินค้า #${form.id}` : 'เพิ่มสินค้าใหม่'}</h2>
          <div className="md:col-span-2"><ImageManager photos={form.photos} onChange={(photos) => setForm({ ...form, photos })} /></div>
          <div><label className="ae-label" htmlFor="pn">ชื่อสินค้า *</label><input id="pn" required className="ae-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="ae-label" htmlFor="pc">หมวดหมู่ *</label>
            <select id="pc" className="ae-input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>{cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="ae-label" htmlFor="pp">ราคาต่อหน่วย (บาท) *</label><input id="pp" type="number" min="0" step="0.01" required className="ae-input" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} /></div>
          <div><label className="ae-label" htmlFor="ps">สต็อก *</label><input id="ps" type="number" min="0" required className="ae-input" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })} /></div>
          <div className="flex gap-2">
            <div className="flex-1"><label className="ae-label" htmlFor="pdv">ส่วนลด</label><input id="pdv" type="number" min="0" step="0.01" className="ae-input" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} /></div>
            <div><label className="ae-label" htmlFor="pdt">ประเภท</label><select id="pdt" className="ae-input" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as Form['discountType'] })}><option value="percent">%</option><option value="amount">จำนวนเงิน</option></select></div>
          </div>
          <div className="flex items-end gap-4 pb-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.todaysDeal} onChange={(e) => setForm({ ...form, todaysDeal: e.target.checked })} /> ดีลวันนี้</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> สินค้าแนะนำ</label>
          </div>
          <div className="md:col-span-2"><label className="ae-label" htmlFor="pd">รายละเอียด</label><textarea id="pd" className="ae-input h-24 py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex gap-2 md:col-span-2"><button className="ae-btn" disabled={save.isPending}>{save.isPending ? 'กำลังบันทึก…' : 'บันทึก'}</button><button type="button" className="ae-btn-outline" onClick={() => setForm(null)}>ยกเลิก</button></div>
        </form>
      )}

      <div className="ae-card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead className="border-b border-line text-ink"><tr><th className="p-3">สินค้า</th><th>หมวดหมู่</th><th>ราคา</th><th>สต็อก</th><th>ดีลวันนี้</th><th>สินค้าแนะนำ</th><th>เผยแพร่</th><th /></tr></thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgSrc(p.thumbnail)} alt="" width={44} height={44} className="h-11 w-11 rounded object-cover" />
                    <span className="font-semibold text-ink">{p.name}</span>
                  </div>
                </td>
                <td>{p.category.name}</td>
                <td>{fmt(Number(p.unitPrice))}</td>
                <td className={p.currentStock <= 5 ? 'font-bold text-danger' : ''}>{p.currentStock}</td>
                <td><Toggle on={p.todaysDeal} label={`ดีลวันนี้: ${p.name}`} onChange={(v) => patch.mutate({ id: p.id, todaysDeal: v })} /></td>
                <td><Toggle on={p.featured} label={`สินค้าแนะนำ: ${p.name}`} onChange={(v) => patch.mutate({ id: p.id, featured: v })} /></td>
                <td><Toggle on={p.published} label={`เผยแพร่: ${p.name}`} onChange={(v) => patch.mutate({ id: p.id, published: v })} /></td>
                <td className="whitespace-nowrap">
                  <button className="mr-3 text-primary" aria-label={`แก้ไข ${p.name}`} onClick={() => { setForm(toForm(p)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Pencil size={16} /></button>
                  <button className="text-danger" aria-label={`ลบ ${p.name}`} onClick={() => window.confirm(`ลบ “${p.name}”?`) && del.mutate(p.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items.length === 0 && <p className="p-6 text-center text-ink-muted">ยังไม่มีสินค้า</p>}
      </div>
      {data && data.total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button className="ae-btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>ก่อนหน้า</button>
          <span>หน้า {page} / {Math.ceil(data.total / 20)}</span>
          <button className="ae-btn-outline" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(page + 1)}>ถัดไป</button>
        </div>
      )}
    </div>
  );
}
