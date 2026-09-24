import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { serverGet } from '@/lib/api';
import type { Paged, ProductDTO } from '@/lib/types';

export const metadata: Metadata = { title: 'Products' };

type Params = Record<string, string | undefined>;

const SORTS = [
  ['newest', 'Newest'],
  ['popular', 'Best selling'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['rating', 'Top rated'],
] as const;

function href(sp: Params, patch: Params): string {
  const merged = { ...sp, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v);
  return `/products?${qs.toString()}`;
}

export default async function ProductsPage({ searchParams }: { searchParams: Params }) {
  const qs = new URLSearchParams();
  for (const k of ['q', 'category', 'brand', 'minPrice', 'maxPrice', 'sort', 'page']) if (searchParams[k]) qs.set(k, searchParams[k]!);
  const [data, categories, brands] = await Promise.all([
    serverGet<Paged<ProductDTO>>(`/products?${qs}`),
    serverGet<{ id: number; name: string; slug: string; level: number }[]>('/categories'),
    serverGet<{ id: number; name: string; slug: string }[]>('/brands'),
  ]);
  const page = Number(searchParams.page ?? 1);
  const pages = data ? Math.ceil(data.total / (data.perPage ?? 24)) : 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="ae-card h-fit space-y-4 p-4">
        <form action="/products" className="space-y-2">
          {searchParams.q && <input type="hidden" name="q" value={searchParams.q} />}
          {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
          {searchParams.brand && <input type="hidden" name="brand" value={searchParams.brand} />}
          {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
          <h3 className="ae-h">Price</h3>
          <div className="flex gap-2">
            <input name="minPrice" type="number" min="0" placeholder="Min" defaultValue={searchParams.minPrice} className="ae-input" aria-label="Min price" />
            <input name="maxPrice" type="number" min="0" placeholder="Max" defaultValue={searchParams.maxPrice} className="ae-input" aria-label="Max price" />
          </div>
          <button className="ae-btn w-full">Apply</button>
        </form>
        <div>
          <h3 className="ae-h mb-1">Categories</h3>
          <ul className="space-y-1">
            {(categories ?? []).filter((c) => c.level === 0).map((c) => (
              <li key={c.id}><Link href={href(searchParams, { category: c.slug, page: undefined })} className={searchParams.category === c.slug ? 'font-bold text-primary' : 'hover:text-primary'}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="ae-h mb-1">Brands</h3>
          <ul className="space-y-1">
            {(brands ?? []).map((b) => (
              <li key={b.id}><Link href={href(searchParams, { brand: b.slug, page: undefined })} className={searchParams.brand === b.slug ? 'font-bold text-primary' : 'hover:text-primary'}>{b.name}</Link></li>
            ))}
          </ul>
        </div>
        <Link href="/products" className="block text-primary">Clear filters</Link>
      </aside>

      <section>
        <div className="ae-card mb-3 flex flex-wrap items-center justify-between gap-2 p-3">
          <p>{data ? `${data.total} products` : ''}{searchParams.q ? ` for “${searchParams.q}”` : ''}</p>
          <div className="flex flex-wrap gap-2">
            {SORTS.map(([v, label]) => (
              <Link key={v} href={href(searchParams, { sort: v, page: undefined })} className={`rounded-card border px-2 py-1 ${(searchParams.sort ?? 'newest') === v ? 'border-primary text-primary' : 'border-line'}`}>{label}</Link>
            ))}
          </div>
        </div>

        {data && data.items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {data.items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="ae-card p-10 text-center">
            <p className="text-base font-bold text-ink">No products found</p>
            <p className="mt-1 text-ink-muted">Try different keywords or clear the filters.</p>
            <Link href="/products" className="ae-btn mt-4">Browse all products</Link>
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-4 flex flex-wrap justify-center gap-1" aria-label="Pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={href(searchParams, { page: String(n) })} aria-current={n === page ? 'page' : undefined} className={`min-w-9 rounded-card border px-3 py-1.5 text-center ${n === page ? 'border-primary bg-primary text-white' : 'border-line bg-white'}`}>{n}</Link>
            ))}
          </nav>
        )}
      </section>
    </div>
  );
}
