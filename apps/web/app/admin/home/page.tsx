'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, ApiError } from '@/lib/api';

interface Settings {
  sliders: { id: number; image: string; link: string; sortOrder: number }[];
  banners: { id: number; position: string; image: string; link: string }[];
  featuredCategories: { categoryId: number; category: { id: number; name: string } }[];
  settings: Record<string, string>;
}
interface Cat { id: number; name: string; level: number }

const BANNER_TH: Record<string, string> = { banner_1: 'แบนเนอร์ 1', banner_2: 'แบนเนอร์ 2', banner_3: 'แบนเนอร์ 3' };

/** ตั้งค่าหน้าแรก (03-User-Flow §4.3): สไลเดอร์, หมวดหมู่แนะนำ (สูงสุด 8), แบนเนอร์โปรโมชัน, รูปลักษณ์เว็บ */
export default function HomeSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['home-settings'], queryFn: () => api<Settings>('/admin/home-settings') });
  const { data: cats } = useQuery({ queryKey: ['cats'], queryFn: () => api<Cat[]>('/categories') });
  const [featured, setFeatured] = useState<number[]>([]);
  const [color, setColor] = useState('#E62E04');
  const [deal, setDeal] = useState(true);
  const [siteName, setSiteName] = useState('');
  const [slider, setSlider] = useState({ image: '', link: '/products' });

  useEffect(() => {
    if (!data) return;
    setFeatured(data.featuredCategories.map((f) => f.categoryId));
    setColor(data.settings.base_color ?? '#E62E04');
    setDeal(data.settings.todays_deal_enabled !== '0');
    setSiteName(data.settings.site_name ?? '');
  }, [data]);

  const ok = (msg: string) => () => { toast.success(msg); qc.invalidateQueries({ queryKey: ['home-settings'] }); };
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'ไม่สำเร็จ');

  const saveFeatured = useMutation({ mutationFn: () => api('/admin/featured-categories', { method: 'PUT', body: { categoryIds: featured } }), onSuccess: ok('บันทึกหมวดหมู่แนะนำแล้ว'), onError: fail });
  const saveSettings = useMutation({
    mutationFn: () => api('/admin/settings', { method: 'PUT', body: { base_color: color, todays_deal_enabled: deal ? '1' : '0', site_name: siteName } }),
    onSuccess: ok('บันทึกการตั้งค่าแล้ว'), onError: fail,
  });
  const addSlider = useMutation({ mutationFn: () => api('/admin/sliders', { body: { ...slider, sortOrder: data?.sliders.length ?? 0 } }), onSuccess: () => { ok('เพิ่มสไลด์แล้ว')(); setSlider({ image: '', link: '/products' }); }, onError: fail });
  const delSlider = useMutation({ mutationFn: (id: number) => api(`/admin/sliders/${id}`, { method: 'DELETE' }), onSuccess: ok('ลบสไลด์แล้ว'), onError: fail });
  const setBanner = useMutation({ mutationFn: ({ id, image, link }: { id: number; image: string; link: string }) => api(`/admin/banners/${id}`, { method: 'PUT', body: { image, link } }), onSuccess: ok('บันทึกแบนเนอร์แล้ว'), onError: fail });

  const toggle = (id: number) => setFeatured((f) => (f.includes(id) ? f.filter((x) => x !== id) : f.length >= 8 ? (toast.error('เลือกได้สูงสุด 8 หมวดหมู่'), f) : [...f, id]));
  const move = (i: number, d: number) => setFeatured((f) => { const n = [...f]; const j = i + d; if (j < 0 || j >= n.length) return f; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const name = (id: number) => cats?.find((c) => c.id === id)?.name ?? id;

  if (!data) return <div className="ae-card h-40 animate-pulse" />;

  return (
    <div className="space-y-4">
      <h1 className="ae-h">ตั้งค่าหน้าแรก</h1>

      <section className="ae-card space-y-3 p-4">
        <h2 className="ae-h">รูปลักษณ์เว็บ</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="ae-label" htmlFor="sn">ชื่อเว็บไซต์</label><input id="sn" className="ae-input" value={siteName} onChange={(e) => setSiteName(e.target.value)} /></div>
          <div><label className="ae-label" htmlFor="bc">สีหลักของเว็บ</label><input id="bc" type="color" className="h-10 w-full rounded-card border border-line" value={color} onChange={(e) => setColor(e.target.value)} /></div>
          <label className="flex items-end gap-2 pb-2"><input type="checkbox" checked={deal} onChange={(e) => setDeal(e.target.checked)} /> แสดงส่วน &quot;ดีลวันนี้&quot;</label>
        </div>
        <button className="ae-btn" onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>บันทึก</button>
        <p className="text-[12px] text-ink-muted">การเปลี่ยนแปลงจะแสดงบนหน้าร้านทันที (แคชหน้าแรกจะถูกล้างให้อัตโนมัติ)</p>
      </section>

      <section className="ae-card space-y-3 p-4">
        <h2 className="ae-h">สไลเดอร์หน้าแรก</h2>
        <ul className="divide-y divide-line">
          {data.sliders.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt="" className="h-12 w-28 rounded object-cover" />
              <span className="flex-1 truncate text-ink-muted">{s.link}</span>
              <button className="text-danger" onClick={() => delSlider.mutate(s.id)}>ลบ</button>
            </li>
          ))}
        </ul>
        <form onSubmit={(e) => { e.preventDefault(); addSlider.mutate(); }} className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
          <input className="ae-input" required placeholder="ลิงก์รูปภาพ (1100×440)" value={slider.image} onChange={(e) => setSlider({ ...slider, image: e.target.value })} aria-label="ลิงก์รูปภาพสไลด์" />
          <input className="ae-input" placeholder="ลิงก์ปลายทาง" value={slider.link} onChange={(e) => setSlider({ ...slider, link: e.target.value })} aria-label="ลิงก์ปลายทางของสไลด์" />
          <button className="ae-btn">เพิ่มสไลด์</button>
        </form>
      </section>

      <section className="ae-card space-y-3 p-4">
        <h2 className="ae-h">หมวดหมู่แนะนำ ({featured.length}/8)</h2>
        <ol className="space-y-1">
          {featured.map((id, i) => (
            <li key={id} className="flex items-center gap-2">
              <span className="w-6 text-ink-muted">{i + 1}.</span><span className="flex-1">{name(id)}</span>
              <button className="ae-btn-outline !px-2 !py-0.5" onClick={() => move(i, -1)} aria-label="เลื่อนขึ้น"><ArrowUp size={14} /></button>
              <button className="ae-btn-outline !px-2 !py-0.5" onClick={() => move(i, 1)} aria-label="เลื่อนลง"><ArrowDown size={14} /></button>
              <button className="text-danger" onClick={() => toggle(id)}>ลบ</button>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {cats?.filter((c) => !featured.includes(c.id)).map((c) => <button key={c.id} className="rounded-full border border-line px-2 py-0.5 hover:border-primary hover:text-primary" onClick={() => toggle(c.id)}>+ {c.name}</button>)}
        </div>
        <button className="ae-btn" onClick={() => saveFeatured.mutate()} disabled={saveFeatured.isPending}>บันทึกลำดับ</button>
      </section>

      <section className="ae-card space-y-3 p-4">
        <h2 className="ae-h">แบนเนอร์โปรโมชัน (3 ตำแหน่ง)</h2>
        {data.banners.map((b) => <BannerRow key={b.id} b={b} onSave={(image, link) => setBanner.mutate({ id: b.id, image, link })} />)}
      </section>
    </div>
  );
}

function BannerRow({ b, onSave }: { b: { position: string; image: string; link: string }; onSave: (image: string, link: string) => void }) {
  const [image, setImage] = useState(b.image);
  const [link, setLink] = useState(b.link);
  const label = BANNER_TH[b.position] ?? b.position.replace('_', ' ');
  return (
    <div className="grid items-center gap-2 sm:grid-cols-[80px_2fr_1fr_auto]">
      <span className="font-semibold text-ink">{label}</span>
      <input className="ae-input" value={image} onChange={(e) => setImage(e.target.value)} aria-label={`ลิงก์รูปภาพ ${label}`} />
      <input className="ae-input" value={link} onChange={(e) => setLink(e.target.value)} aria-label={`ลิงก์ปลายทาง ${label}`} />
      <button className="ae-btn-outline" onClick={() => onSave(image, link)}>บันทึก</button>
    </div>
  );
}
