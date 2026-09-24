'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useMounted, useT } from '@/lib/hooks';
import { useSession } from '@/lib/store';

export default function TopBar() {
  const mounted = useMounted();
  const t = useT();
  const router = useRouter();
  const { currency, currencies, user, setCurrency, setAuth } = useSession();

  // เว็บนี้ใช้ภาษาไทยเป็นภาษาเดียว จึงไม่ต้องดึงรายการภาษาอีกต่อไป
  useEffect(() => {}, []);

  const logout = () => {
    setAuth(null, null);
    router.push('/');
    router.refresh();
  };

  const select = 'max-w-[7.5rem] cursor-pointer truncate bg-transparent text-[12px] text-ink-muted outline-none hover:text-primary';

  return (
    <div className="border-b border-line bg-white">
      <div className="container flex h-8 items-center justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <select aria-label="สกุลเงิน" className={select} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {(currencies.length ? currencies : [{ code: 'THB', name: 'บาทไทย', symbol: '฿' }]).map((c) => (
              <option key={c.code} value={c.code}>{c.name} {c.symbol}</option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[12px] text-ink-muted sm:gap-4">
          {mounted && user ? (
            <>
              <Link href={user.userType === 'customer' ? '/account' : '/admin'} className="hover:text-primary">{user.name}</Link>
              <button onClick={logout} className="hover:text-primary">{t('logout', 'ออกจากระบบ')}</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-primary">{t('login', 'เข้าสู่ระบบ')}</Link>
              <Link href="/register" className="hover:text-primary">{t('registration', 'สมัครสมาชิก')}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
