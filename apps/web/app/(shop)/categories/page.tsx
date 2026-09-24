import type { Metadata } from 'next';
import Link from 'next/link';
import { CategoryIcon } from '@/components/Icons';
import { serverGet } from '@/lib/api';
import type { HomeData } from '@/lib/types';

export const metadata: Metadata = { title: 'All Categories' };

export default async function CategoriesPage() {
  const home = await serverGet<HomeData>('/home');
  return (
    <div className="space-y-3">
      <h1 className="ae-h">All Categories</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {home?.categories.map((c) => (
          <section key={c.id} className="ae-card p-4">
            <h2 className="mb-2 font-bold text-ink"><Link href={`/products?category=${c.slug}`} className="hover:text-primary"><CategoryIcon name={c.icon} className="mr-1 inline" /> {c.name}</Link></h2>
            <ul className="space-y-1">
              {c.children.map((k) => <li key={k.id}><Link href={`/products?category=${k.slug}`} className="hover:text-primary">{k.name}</Link></li>)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
