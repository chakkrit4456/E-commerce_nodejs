'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';
import { useMounted } from '@/lib/hooks';
import { useSession } from '@/lib/store';
import type { ProductDTO } from '@/lib/types';

export default function WishlistPage() {
  const mounted = useMounted();
  const token = useSession((s) => s.token);
  const [items, setItems] = useState<ProductDTO[] | null>(null);

  useEffect(() => {
    if (mounted && token) api<ProductDTO[]>('/me/wishlist').then(setItems).catch(() => setItems([]));
  }, [mounted, token]);

  if (!mounted) return null;
  if (!token) return <div className="ae-card p-10 text-center">Please <Link href="/login" className="text-primary">login</Link> to see your wishlist.</div>;
  return (
    <section>
      <h1 className="ae-h mb-3">Wishlist</h1>
      {items?.length === 0 && <div className="ae-card p-10 text-center text-ink-muted">Your wishlist is empty.</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">{items?.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  );
}
