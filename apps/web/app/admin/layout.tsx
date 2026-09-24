'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMounted } from '@/lib/hooks';
import { useSession } from '@/lib/store';

const NAV = [
  ['/admin', 'แดชบอร์ด'],
  ['/admin/products', 'สินค้า'],
  ['/admin/orders', 'คำสั่งซื้อ'],
  ['/admin/customers', 'ลูกค้า'],
  ['/admin/reviews', 'รีวิว'],
  ['/admin/coupons', 'คูปอง'],
  ['/admin/home', 'ตั้งค่าหน้าแรก'],
] as const;

/** Admin shell: sidebar มืด 260px, active = แถบ primary ด้านซ้าย (07-UI-UX §8) */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const path = usePathname();
  const router = useRouter();
  const { user, setAuth } = useSession();
  const allowed = user && (user.userType === 'admin' || user.userType === 'staff');

  useEffect(() => {
    if (mounted && !allowed) router.replace('/login');
  }, [mounted, allowed, router]);

  if (!mounted || !allowed) return <div className="p-10 text-center">กำลังโหลด…</div>;

  return (
    <div className="flex min-h-screen bg-body">
      <aside className="hidden w-[260px] shrink-0 bg-ink text-white/80 md:block">
        <div className="px-5 py-5 text-lg font-bold text-white">แผงควบคุมแอดมิน</div>
        <nav aria-label="เมนูแอดมิน">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className={`block border-l-4 px-5 py-2.5 hover:bg-white/5 ${path === href ? 'border-primary bg-white/10 text-white' : 'border-transparent'}`}>{label}</Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between bg-white px-4 py-3 shadow-card">
          <nav className="flex gap-3 overflow-x-auto md:hidden" aria-label="เมนูแอดมิน (มือถือ)">
            {NAV.map(([href, label]) => <Link key={href} href={href} className={`whitespace-nowrap ${path === href ? 'font-bold text-primary' : ''}`}>{label}</Link>)}
          </nav>
          <span className="ml-auto flex items-center gap-4">
            <Link href="/" className="hover:text-primary" target="_blank">ดูหน้าร้าน <ExternalLink size={13} className="ml-1 inline" aria-hidden /></Link>
            <span className="font-semibold text-ink">{user.name}</span>
            <button className="text-primary" onClick={() => { setAuth(null, null); router.push('/login'); }}>ออกจากระบบ</button>
          </span>
        </header>
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
