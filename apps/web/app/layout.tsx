import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import { serverGet } from '@/lib/api';
import type { HomeData } from '@/lib/types';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Active eCommerce', template: '%s | Active eCommerce' },
  description: 'Online shop for fashion, electronics, home and more.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const home = await serverGet<HomeData>('/home');
  const color = home?.settings.base_color;
  // สีหลักจากหลังบ้าน (Appearance → Base color) → CSS variable --primary; ตรวจ format กัน CSS injection
  const primary = color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#E62E04';
  return (
    <html lang="en" style={{ ['--primary' as string]: primary }}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
