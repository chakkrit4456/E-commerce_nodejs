import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { HomeData } from '@/lib/types';

export default function PromoBanners({ banners }: { banners: HomeData['banners'] }) {
  if (!banners.length) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {banners.map((b, i) => (
        <Link
          key={b.id}
          href={b.link}
          style={{ animationDelay: `${i * 120}ms` }}
          className="promo-banner promo-shine group relative block aspect-[2.9/1] overflow-hidden rounded-card shadow-sm ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.image}
            alt={`โปรโมชัน ${i + 1}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <Sparkles size={16} className="promo-glow absolute right-2 top-2 text-white drop-shadow" aria-hidden />
          <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
        </Link>
      ))}
    </div>
  );
}
