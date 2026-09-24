'use client';

import Link from 'next/link';
import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMounted } from '@/lib/hooks';
import { useSession } from '@/lib/store';

const items = [
  { href: '/', label: 'หน้าแรก', icon: Home },
  { href: '/categories', label: 'หมวดหมู่', icon: LayoutGrid },
  { href: '/cart', label: 'ตะกร้า', icon: ShoppingCart },
  { href: '/account', label: 'บัญชี', icon: User },
];

/** Bottom navigation < 576px (03-User-Flow §2) */
export default function MobileNav() {
  const path = usePathname();
  const mounted = useMounted();
  const cartCount = useSession((s) => s.cartCount);
  if (path.startsWith('/admin')) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white sm:hidden" aria-label="เมนูนำทางมือถือ">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={`relative flex min-h-[48px] flex-1 flex-col items-center justify-center text-[11px] ${path === i.href ? 'text-primary' : 'text-ink-muted'}`}>
          <i.icon size={20} aria-hidden />
          {i.label}
          {i.href === '/cart' && mounted && cartCount > 0 && (
            <span className="absolute right-1/4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{cartCount}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
