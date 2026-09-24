'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Heart, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useMounted, useT } from '@/lib/hooks';
import { useSession } from '@/lib/store';
import SearchBox from './SearchBox';

function Badge({ n }: { n: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ref.current?.classList.remove('badge-pop');
    void ref.current?.offsetWidth; // restart animation
    ref.current?.classList.add('badge-pop');
  }, [n]);
  return (
    <span ref={ref} className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
      {n}
    </span>
  );
}

function IconLink({ href, label, count, children }: { href: string; label: string; count: number; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={`${label} (${count})`} className="hidden flex-col items-center gap-0.5 text-ink hover:text-primary md:flex">
      <span className="relative">
        {children}
        <Badge n={count} />
      </span>
      <span className="text-[12px] text-ink-muted">{label}</span>
    </Link>
  );
}

export default function Header({ siteName }: { siteName: string }) {
  const t = useT();
  const mounted = useMounted();
  const { cartCount, wishlistCount, compare } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const icon = { size: 22, strokeWidth: 1.8, 'aria-hidden': true };

  return (
    <header className={`sticky top-0 z-30 bg-white transition-all ${scrolled ? 'shadow-hover' : ''}`}>
      <div className={`container flex flex-wrap items-center gap-x-6 gap-y-2 transition-all ${scrolled ? 'py-2' : 'py-4'}`}>
        <Link href="/" className="flex items-center gap-2 text-primary">
          <ShoppingBag size={30} aria-hidden />
          <span className="text-xl font-bold">{siteName}</span>
        </Link>
        <div className="order-3 w-full md:order-none md:w-auto md:flex-1 md:max-w-[45%]"><SearchBox /></div>
        <nav className="ml-auto flex items-center gap-5" aria-label="ทางลัด">
          <IconLink href="/compare" label={t('compare', 'เปรียบเทียบ')} count={mounted ? compare.length : 0}>
            <ArrowLeftRight {...icon} />
          </IconLink>
          <IconLink href="/wishlist" label={t('wishlist', 'รายการโปรด')} count={mounted ? wishlistCount : 0}>
            <Heart {...icon} />
          </IconLink>
          <Link href="/cart" aria-label={`ตะกร้าสินค้า (${cartCount})`} className="flex flex-col items-center gap-0.5 text-ink hover:text-primary">
            <span className="relative">
              <ShoppingCart {...icon} />
              <Badge n={mounted ? cartCount : 0} />
            </span>
            <span className="hidden text-[12px] text-ink-muted md:block">{t('cart', 'ตะกร้า')}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
