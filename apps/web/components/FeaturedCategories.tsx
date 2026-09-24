import Link from 'next/link';
import { imgSrc } from '@/lib/format-price';
import type { HomeData } from '@/lib/types';

export default function FeaturedCategories({ items }: { items: HomeData['featuredCategories'] }) {
  return (
    <ul className="grid grid-cols-4 gap-2 xl:grid-cols-8">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={`/products?category=${c.slug}`} className="ae-card flex h-20 flex-col items-center justify-center gap-1 px-1 transition hover:-translate-y-0.5 hover:shadow-hover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc(c.banner)} alt="" width={48} height={48} loading="lazy" className="h-12 w-12 object-contain" />
            <span className="w-full truncate text-center text-[12px]">{c.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
