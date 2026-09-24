'use client';

import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { imgSrc } from '@/lib/format-price';
import { useCartActions, useMounted, useT } from '@/lib/hooks';
import { useSession } from '@/lib/store';
import type { ProductDTO } from '@/lib/types';
import { Heart, ArrowLeftRight, ShoppingCart } from 'lucide-react';
import { Stars } from './Icons';
import { Price } from './Price';

export default function ProductCard({ p }: { p: ProductDTO }) {
  const t = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { add } = useCartActions();
  const { toggleCompare, compare, token, setWishlistCount } = useSession();
  const inCompare = mounted && compare.includes(p.id);

  const wish = async () => {
    if (!token) {
      toast('กรุณาเข้าสู่ระบบเพื่อใช้รายการโปรด');
      return router.push('/login');
    }
    try {
      const r = await api<{ wishlisted: boolean; count: number }>('/me/wishlist/toggle', { body: { productId: p.id } });
      setWishlistCount(r.count);
      toast.success(r.wishlisted ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'ไม่สำเร็จ');
    }
  };

  const btn = 'flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-card hover:bg-primary hover:text-white';

  return (
    <article className="ae-card group relative overflow-hidden transition hover:shadow-hover">
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/product/${p.slug}`} aria-label={p.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc(p.thumbnail)} alt={p.name} loading="lazy" width={400} height={400} className="h-full w-full object-cover" />
        </Link>
        {p.discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-[3px] bg-primary px-1.5 py-0.5 text-[11px] font-bold text-white">-{p.discountPercent}%</span>
        )}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button className={btn} onClick={wish} aria-label="เพิ่มในรายการโปรด">
            <Heart size={16} />
          </button>
          <button
            className={`${btn} ${inCompare ? '!bg-primary !text-white' : ''}`}
            aria-label="เพิ่มในการเปรียบเทียบ"
            onClick={() => toast.success(toggleCompare(p.id) === 'added' ? 'เพิ่มในการเปรียบเทียบแล้ว' : 'นำออกจากการเปรียบเทียบแล้ว')}
          >
            <ArrowLeftRight size={16} />
          </button>
          <button className={btn} onClick={() => add(p.id)} aria-label={t('add_to_cart', 'ใส่ตะกร้า')} disabled={p.currentStock < 1}>
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
      <div className="p-3">
        <Link href={`/product/${p.slug}`} className="line-clamp-2 min-h-[2.6em] text-[13px] text-ink hover:text-primary">{p.name}</Link>
        <div className="mt-1"><Stars rating={p.rating} /></div>
        <div className="mt-1 text-[15px]">
          <Price value={p.price} original={p.originalPrice} />
        </div>
        {p.currentStock < 1 && <p className="mt-1 text-[12px] text-danger">สินค้าหมด</p>}
      </div>
    </article>
  );
}
