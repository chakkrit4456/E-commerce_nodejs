'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { imgSrc } from '@/lib/format-price';
import { useT } from '@/lib/hooks';
import type { ProductDTO } from '@/lib/types';
import { Price } from './Price';

interface Result {
  products: ProductDTO[];
  categories: { id: number; name: string; slug: string }[];
  brands: { id: number; name: string; slug: string }[];
}

export default function SearchBox() {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLFormElement>(null);

  // debounce 300ms, ขั้นต่ำ 2 ตัวอักษร (01-PRD FR-05)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (debounced.length < 2) return setResult(null);
    let cancelled = false;
    setLoading(true);
    api<Result>(`/search?q=${encodeURIComponent(debounced)}`)
      .then((r) => !cancelled && setResult(r))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    if (q.trim()) router.push(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  const empty = result && !result.products.length && !result.categories.length && !result.brands.length;

  return (
    <form ref={box} onSubmit={submit} className="relative w-full" role="search">
      <div className="flex">
        <input
          className="ae-input rounded-r-none"
          placeholder={t('search_placeholder', 'I am shopping for...')}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          aria-label="Search products"
        />
        <button type="submit" aria-label="Search" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-r-card bg-primary text-white hover:bg-primary-hover">
          <Search size={18} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
      {open && debounced.length >= 2 && (
        <div className="absolute left-0 right-0 top-11 z-40 max-h-[70vh] overflow-y-auto rounded-card border border-line bg-white p-3 shadow-hover">
          {loading && !result && <div className="h-16 animate-pulse rounded bg-body" />}
          {empty && <p className="py-3 text-center text-ink-muted">No results for “{debounced}”</p>}
          {result && result.categories.length > 0 && (
            <Section title="Categories">
              {result.categories.map((c) => <Link key={c.id} onClick={() => setOpen(false)} href={`/products?category=${c.slug}`} className="block py-1 hover:text-primary">{c.name}</Link>)}
            </Section>
          )}
          {result && result.brands.length > 0 && (
            <Section title="Brands">
              {result.brands.map((b) => <Link key={b.id} onClick={() => setOpen(false)} href={`/products?brand=${b.slug}`} className="block py-1 hover:text-primary">{b.name}</Link>)}
            </Section>
          )}
          {result && result.products.length > 0 && (
            <Section title="Products">
              {result.products.map((p) => (
                <Link key={p.id} onClick={() => setOpen(false)} href={`/product/${p.slug}`} className="flex items-center gap-2 py-1 hover:text-primary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgSrc(p.thumbnail)} alt="" width={36} height={36} className="h-9 w-9 rounded object-cover" />
                  <span className="flex-1 truncate">{p.name}</span>
                  <Price value={p.price} />
                </Link>
              ))}
              <Link onClick={() => setOpen(false)} href={`/products?q=${encodeURIComponent(debounced)}`} className="mt-1 block text-center font-semibold text-primary">View all results</Link>
            </Section>
          )}
        </div>
      )}
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="mb-1 border-b border-line pb-1 text-[11px] font-bold uppercase text-ink-muted">{title}</div>
      {children}
    </div>
  );
}
