'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/lib/hooks';
import type { HomeData } from '@/lib/types';
import FlashSaleCountdown from './FlashSaleCountdown';
import ProductCard from './ProductCard';

export default function FlashSale({ deal }: { deal: NonNullable<HomeData['flashDeal']> }) {
  const t = useT();
  return (
    <section className="ae-card p-4" aria-label="แฟลชเซล">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="ae-h">{t('flash_sale', 'แฟลชเซล')}: {deal.title}</h2>
          <FlashSaleCountdown end={deal.endDate} />
        </div>
        <Link href={`/flash-sale/${deal.slug}`} className="flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline">
          ดูเพิ่มเติม <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {deal.products.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
