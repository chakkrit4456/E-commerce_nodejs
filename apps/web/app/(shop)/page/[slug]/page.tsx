import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/api';

interface CmsPage {
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await serverGet<CmsPage>(`/pages/${params.slug}`);
  return { title: p?.metaTitle ?? p?.title ?? 'Page', description: p?.metaDescription ?? undefined };
}

export default async function CmsPageView({ params }: { params: { slug: string } }) {
  const p = await serverGet<CmsPage>(`/pages/${params.slug}`);
  if (!p) notFound();
  // เนื้อหาแสดงเป็นข้อความล้วน (React escape ให้อัตโนมัติ) — ไม่ render HTML ดิบเพื่อกัน XSS
  return (
    <article className="ae-card mx-auto max-w-3xl space-y-3 p-6">
      <h1 className="text-xl font-bold text-ink">{p.title}</h1>
      <p className="whitespace-pre-line">{p.content}</p>
    </article>
  );
}
