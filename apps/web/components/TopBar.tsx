'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { useMounted, useT } from '@/lib/hooks';
import { useSession } from '@/lib/store';

interface Language {
  code: string;
  name: string;
  flag: string;
}

export default function TopBar() {
  const mounted = useMounted();
  const t = useT();
  const router = useRouter();
  const { lang, currency, currencies, user, setLang, setCurrency, setAuth } = useSession();
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    api<Language[]>('/languages').then(setLanguages).catch(() => undefined);
  }, []);

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
          <label className="flex items-center gap-1">
            <Globe size={14} aria-hidden />
            <select aria-label="Language" className={select} value={lang} onChange={(e) => setLang(e.target.value)}>
              {(languages.length ? languages : [{ code: 'en', name: 'English', flag: '' }]).map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </label>
          <select aria-label="Currency" className={select} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {(currencies.length ? currencies : [{ code: 'USD', name: 'U.S. Dollar', symbol: '$' }]).map((c) => (
              <option key={c.code} value={c.code}>{c.name} {c.symbol}</option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[12px] text-ink-muted sm:gap-4">
          {mounted && user ? (
            <>
              <Link href={user.userType === 'customer' ? '/account' : '/admin'} className="hover:text-primary">{user.name}</Link>
              <button onClick={logout} className="hover:text-primary">{t('logout', 'Logout')}</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-primary">{t('login', 'Login')}</Link>
              <Link href="/register" className="hover:text-primary">{t('registration', 'Registration')}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
