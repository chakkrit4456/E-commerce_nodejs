'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CategoryIcon } from './Icons';
import { useT } from '@/lib/hooks';
import type { HomeData } from '@/lib/types';

export default function CategorySidebar({ categories }: { categories: HomeData['categories'] }) {
  const t = useT();
  const [active, setActive] = useState<number | null>(null);
  const current = categories.find((c) => c.id === active);

  return (
    <aside className="ae-card relative hidden lg:block" onMouseLeave={() => setActive(null)} aria-label="หมวดหมู่สินค้า">
      <div className="flex h-11 items-center justify-between rounded-t-card bg-primary-soft px-3">
        <h2 className="ae-h">{t('categories', 'หมวดหมู่')}</h2>
        <Link href="/categories" className="text-[12px] text-ink-secondary hover:text-primary">{t('see_all', 'ดูทั้งหมด')} &gt;</Link>
      </div>
      <ul className="py-1">
        {categories.map((c) => (
          <li key={c.id} onMouseEnter={() => setActive(c.id)} onFocus={() => setActive(c.id)}>
            <Link href={`/products?category=${c.slug}`} className={`flex h-[30px] items-center gap-2 px-3 text-[13px] ${active === c.id ? 'text-primary' : ''}`}>
              <CategoryIcon name={c.icon} className="w-4 shrink-0 text-ink-muted" />
              <span className="truncate">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      {current && current.children.length > 0 && (
        <div className="absolute left-full top-0 z-30 ml-px h-full min-w-[420px] rounded-card border border-line bg-white p-4 shadow-hover">
          <h3 className="mb-2 font-bold text-ink">{current.name}</h3>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
            {current.children.map((k) => (
              <li key={k.id}><Link href={`/products?category=${k.slug}`} className="hover:text-primary">{k.name}</Link></li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
