import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FlashSaleCountdown from '@/components/FlashSaleCountdown';
import ProductCard from '@/components/ProductCard';
import { serverGet } from '@/lib/api';
import type { FlashDealDetail } from '@/lib/types';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const deal = await serverGet<FlashDealDetail>(`/flash-deals/${params.slug}`);
  return { title: deal ? `แฟลชเซล: ${deal.title}` : 'แฟลชเซล' };
}

/** หน้าแฟลชเซลเฉพาะดีล: เห็นสินค้าทั้งหมดในดีลนี้ ไม่ใช่แค่พรีวิวบนหน้าแรก */
export default async function FlashSaleDetailPage({ params }: { params: { slug: string } }) {
  const deal = await serverGet<FlashDealDetail>(`/flash-deals/${params.slug}`);
  if (!deal) notFound();

  return (
    <div className="space-y-4">
      <section className="ae-card overflow-hidden p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="ae-h text-xl">แฟลชเซล: {deal.title}</h1>
            <p className="mt-1 text-sm text-ink-muted">{deal.active ? 'กำลังลดราคาอยู่ตอนนี้ รีบก่อนสินค้าหมด!' : 'แฟลชเซลนี้สิ้นสุดแล้ว'}</p>
          </div>
          <FlashSaleCountdown end={deal.endDate} />
        </div>
      </section>

      {deal.products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {deal.products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="ae-card p-10 text-center">
          <p className="text-base font-bold text-ink">ไม่มีสินค้าในแฟลชเซลนี้</p>
        </div>
      )}
    </div>
  );
}
