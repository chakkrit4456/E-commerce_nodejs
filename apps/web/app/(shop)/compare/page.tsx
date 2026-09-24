'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Stars } from '@/components/Icons';
import { Price } from '@/components/Price';
import { api } from '@/lib/api';
import { imgSrc } from '@/lib/format-price';
import { useCartActions, useMounted } from '@/lib/hooks';
import { useSession } from '@/lib/store';

interface Detail {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  rating: number;
  thumbnail: string | null;
  currentStock: number;
  brand: { name: string } | null;
  category: { name: string };
}

export default function ComparePage() {
  const mounted = useMounted();
  const { compare, toggleCompare } = useSession();
  const { add } = useCartActions();
  const [rows, setRows] = useState<Detail[]>([]);

  useEffect(() => {
    if (!mounted) return;
    Promise.all(compare.map((id) => api<Detail>(`/products/by-id/${id}`).catch(() => null))).then((r) => setRows(r.filter((x): x is Detail => !!x)));
  }, [mounted, compare]);

  if (!mounted) return null;
  if (!compare.length) return <div className="ae-card p-10 text-center text-ink-muted">ยังไม่มีสินค้าให้เปรียบเทียบ <Link href="/products" className="text-primary">เลือกดูสินค้า</Link></div>;

  const line = (label: string, cell: (d: Detail) => React.ReactNode) => (
    <tr className="border-t border-line"><th scope="row" className="w-32 p-3 text-left text-ink">{label}</th>{rows.map((d) => <td key={d.id} className="p-3 align-top">{cell(d)}</td>)}</tr>
  );

  return (
    <div className="ae-card overflow-x-auto">
      <table className="w-full min-w-[560px]">
        <thead>
          <tr><th />{rows.map((d) => (
            <th key={d.id} className="p-3 text-left align-top">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc(d.thumbnail)} alt="" className="mb-2 h-28 w-28 rounded object-cover" />
              <Link href={`/product/${d.slug}`} className="text-ink hover:text-primary">{d.name}</Link>
              <button className="mt-1 block text-[12px] font-normal text-danger" onClick={() => toggleCompare(d.id)}>ลบ</button>
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {line('ราคา', (d) => <Price value={d.price} original={d.originalPrice} />)}
          {line('แบรนด์', (d) => d.brand?.name ?? '—')}
          {line('หมวดหมู่', (d) => d.category.name)}
          {line('คะแนน', (d) => <Stars rating={d.rating} />)}
          {line('สต็อก', (d) => (d.currentStock > 0 ? 'มีสินค้า' : 'สินค้าหมด'))}
          {line('', (d) => <button className="ae-btn" disabled={d.currentStock < 1} onClick={() => add(d.id)}>ใส่ตะกร้า</button>)}
        </tbody>
      </table>
    </div>
  );
}
