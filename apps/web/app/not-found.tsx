import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container py-16 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <p className="mt-2 text-base text-ink">We couldn’t find that page.</p>
      <form action="/products" className="mx-auto mt-4 flex max-w-sm gap-2" role="search">
        <input name="q" className="ae-input" placeholder="Search products" aria-label="Search products" />
        <button className="ae-btn">Search</button>
      </form>
      <Link href="/" className="mt-4 inline-block text-primary">Back to home</Link>
    </div>
  );
}
