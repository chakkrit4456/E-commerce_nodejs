'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/hooks';
import type { HomeData } from '@/lib/types';
import ProductCard from './ProductCard';

function useCountdown(end: string) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(end).getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, new Date(end).getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [end]);
  const s = Math.floor(left / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export default function FlashSale({ deal }: { deal: NonNullable<HomeData['flashDeal']> }) {
  const t = useT();
  const c = useCountdown(deal.endDate);
  const box = 'flex h-8 min-w-8 items-center justify-center rounded bg-primary px-1 font-bold text-white';
  return (
    <section className="ae-card p-4" aria-label="แฟลชเซล">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="ae-h">{t('flash_sale', 'แฟลชเซล')}: {deal.title}</h2>
        <div className="flex items-center gap-1" role="timer" aria-label="เวลาที่เหลือ">
          <span className={box}>{c.d}ว.</span><span className={box}>{String(c.h).padStart(2, '0')}</span>:
          <span className={box}>{String(c.m).padStart(2, '0')}</span>:<span className={box}>{String(c.s).padStart(2, '0')}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {deal.products.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
