'use client';

import Link from 'next/link';
import { imgSrc } from '@/lib/format-price';
import { useT } from '@/lib/hooks';
import type { ProductDTO } from '@/lib/types';
import { Price } from './Price';

export default function TodaysDeal({ products }: { products: ProductDTO[] }) {
  const t = useT();
  return (
    <section className="ae-card flex h-full max-h-[560px] flex-col overflow-hidden" aria-label="Todays Deal">
      <div className="flex h-11 shrink-0 items-center gap-2 bg-primary-soft px-3">
        <h2 className="ae-h">Todays Deal</h2>
        <span className="rounded-[3px] bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">{t('hot', 'Hot')}</span>
      </div>
      <ul className="thin-scroll flex flex-1 flex-col gap-1.5 overflow-y-auto bg-primary p-1.5">
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/product/${p.slug}`} className="flex items-center gap-2 rounded-card bg-white p-1.5 transition hover:shadow-hover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc(p.thumbnail)} alt={p.name} width={56} height={56} loading="lazy" className="h-14 w-14 shrink-0 rounded object-cover" />
              <span className="min-w-0 flex-1 text-right text-[15px]">
                <Price value={p.price} original={p.originalPrice} />
              </span>
            </Link>
          </li>
        ))}
        {!products.length && <li className="p-4 text-center text-white">No deals today</li>}
      </ul>
    </section>
  );
}
