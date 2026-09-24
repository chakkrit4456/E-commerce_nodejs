import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Stars } from '@/components/Icons';
import ProductCard from '@/components/ProductCard';
import { Price } from '@/components/Price';
import { serverGet } from '@/lib/api';
import type { ProductDTO } from '@/lib/types';
import BuyBox from './BuyBox';
import Gallery from './Gallery';

interface Detail extends ProductDTO {
  description: string;
  category: { name: string; slug: string };
  brand: { name: string; slug: string } | null;
  photos: string[];
  photoCredits: string | null;
  variants: { id: number; variant: string; sku: string; price: number; qty: number }[];
  reviews: { id: number; rating: number; comment: string; user: string }[];
  related: ProductDTO[];
  seo: { title: string; description: string };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await serverGet<Detail>(`/products/${params.slug}`);
  return p ? { title: p.seo.title, description: p.seo.description, openGraph: { title: p.seo.title, images: p.thumbnail ? [p.thumbnail] : [] } } : { title: 'Product not found' };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await serverGet<Detail>(`/products/${params.slug}`);
  if (!p) notFound();

  // schema.org Product (01-PRD §6 SEO)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.seo.description,
    image: p.photos,
    offers: { '@type': 'Offer', price: p.price, priceCurrency: 'USD', availability: p.currentStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
  };

  return (
    <div className="space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav className="text-ink-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary">Home</Link> / <Link href={`/products?category=${p.category.slug}`} className="hover:text-primary">{p.category.name}</Link> / <span>{p.name}</span>
      </nav>

      <div className="ae-card grid gap-6 p-4 md:grid-cols-2">
        <div>
          <Gallery photos={p.photos} name={p.name} />
          {p.photoCredits && <p className="mt-2 whitespace-pre-line break-words text-[11px] text-ink-muted">{p.photoCredits}</p>}
        </div>
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-ink">{p.name}</h1>
          <p className="flex items-center gap-2"><Stars rating={p.rating} size={16} /> <span className="text-ink-muted">({p.reviews.length} reviews)</span></p>
          <p className="text-2xl"><Price value={p.price} original={p.originalPrice} /></p>
          {p.brand && <p>Brand: <Link href={`/products?brand=${p.brand.slug}`} className="text-primary">{p.brand.name}</Link></p>}
          <p className={p.currentStock > 0 ? 'text-success' : 'text-danger'}>{p.currentStock > 0 ? `In stock (${p.currentStock})` : 'Out of stock'}</p>
          <BuyBox product={p} variants={p.variants} />
          <p className="whitespace-pre-line border-t border-line pt-3">{p.description}</p>
        </div>
      </div>

      <section className="ae-card p-4">
        <h2 className="ae-h mb-2">Reviews</h2>
        {p.reviews.length === 0 && <p className="text-ink-muted">No reviews yet.</p>}
        <ul className="space-y-3">
          {p.reviews.map((r) => (
            <li key={r.id} className="border-b border-line pb-2">
              <p className="flex items-center gap-2"><Stars rating={r.rating} /> <span className="font-semibold text-ink">{r.user}</span></p>
              <p>{r.comment}</p>
            </li>
          ))}
        </ul>
      </section>

      {p.related.length > 0 && (
        <section>
          <h2 className="ae-h mb-2">Related products</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {p.related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
