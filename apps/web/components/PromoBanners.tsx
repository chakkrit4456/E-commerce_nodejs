import Link from 'next/link';
import type { HomeData } from '@/lib/types';

export default function PromoBanners({ banners }: { banners: HomeData['banners'] }) {
  if (!banners.length) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {banners.map((b, i) => (
        <Link key={b.id} href={b.link} className="group block aspect-[2.9/1] overflow-hidden rounded-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.image} alt={`Promotion ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
        </Link>
      ))}
    </div>
  );
}
