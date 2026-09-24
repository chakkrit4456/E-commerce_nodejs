import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container py-16 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <p className="mt-2 text-base text-ink">ไม่พบหน้าที่คุณต้องการ</p>
      <form action="/products" className="mx-auto mt-4 flex max-w-sm gap-2" role="search">
        <input name="q" className="ae-input" placeholder="ค้นหาสินค้า" aria-label="ค้นหาสินค้า" />
        <button className="ae-btn">ค้นหา</button>
      </form>
      <Link href="/" className="mt-4 inline-block text-primary">กลับสู่หน้าแรก</Link>
    </div>
  );
}
