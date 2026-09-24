import Footer from '@/components/Footer';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import TopBar from '@/components/TopBar';
import { serverGet } from '@/lib/api';
import type { HomeData } from '@/lib/types';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const home = await serverGet<HomeData>('/home');
  const siteName = home?.settings.site_name ?? 'JITD eCommerce';
  return (
    <>
      <TopBar />
      <Header siteName={siteName} />
      <main className="container min-h-[60vh] min-w-0 overflow-x-clip py-4">{children}</main>
      <Footer siteName={siteName} email={home?.settings.contact_email ?? ''} />
      <MobileNav />
    </>
  );
}
