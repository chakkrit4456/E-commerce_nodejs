import CategorySidebar from '@/components/CategorySidebar';
import FeaturedCategories from '@/components/FeaturedCategories';
import FlashSale from '@/components/FlashSale';
import HeroSlider from '@/components/HeroSlider';
import ProductCard from '@/components/ProductCard';
import PromoBanners from '@/components/PromoBanners';
import TodaysDeal from '@/components/TodaysDeal';
import { serverGet } from '@/lib/api';
import type { HomeData } from '@/lib/types';

export default async function HomePage() {
  const home = await serverGet<HomeData>('/home');
  if (!home) {
    return <p className="ae-card p-8 text-center">Store is temporarily unavailable. Please try again shortly.</p>;
  }
  const dealEnabled = home.settings.todays_deal_enabled !== '0';

  return (
    <div className="space-y-4">
      {/* 3 คอลัมน์ 25% / 58% / 17% ≥1200px; <1200 Todays Deal ลงใต้ slider (03-User-Flow §1-2) */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] xl:grid-cols-[minmax(0,3fr)_minmax(0,7fr)_minmax(0,2fr)]">
        <CategorySidebar categories={home.categories} />
        <div className="min-w-0 space-y-4">
          <HeroSlider sliders={home.sliders} />
          <FeaturedCategories items={home.featuredCategories} />
        </div>
        {dealEnabled && (
          <div className="lg:col-span-2 xl:col-span-1"><TodaysDeal products={home.todaysDeal} /></div>
        )}
      </div>

      <PromoBanners banners={home.banners} />

      {home.flashDeal && <FlashSale deal={home.flashDeal} />}

      <section className="ae-card p-4">
        <h2 className="ae-h mb-3">Best Selling</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          {home.bestSelling.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  );
}
