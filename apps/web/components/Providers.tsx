'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useSession } from '@/lib/store';
import type { CartData, Currency } from '@/lib/types';

function Bootstrap() {
  const { lang, token, setCurrencies, setDict, setCart, setWishlistCount } = useSession();

  useEffect(() => {
    api<Currency[]>('/currencies').then((rows) => setCurrencies(rows.map((c) => ({ ...c, exchangeRate: Number(c.exchangeRate) })))).catch(() => undefined);
  }, [setCurrencies]);

  useEffect(() => {
    if (lang === 'en') return setDict({});
    api<Record<string, string>>(`/translations/${lang}`).then(setDict).catch(() => undefined);
  }, [lang, setDict]);

  useEffect(() => {
    api<CartData>('/cart').then(setCart).catch(() => undefined);
    if (token) api<unknown[]>('/me/wishlist').then((w) => setWishlistCount(w.length)).catch(() => undefined);
    else setWishlistCount(0);
  }, [token, setCart, setWishlistCount]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } }));
  return (
    <QueryClientProvider client={client}>
      <Bootstrap />
      {children}
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 13 } }} />
    </QueryClientProvider>
  );
}
