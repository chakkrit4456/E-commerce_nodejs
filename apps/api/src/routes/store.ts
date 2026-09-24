import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, idParam, wrap } from '../lib/http';
import { remember } from '../lib/cache';
import { data, validate } from '../middlewares/validate';
import { listQuerySchema } from '../validators/schemas';
import { toProductDTOs } from '../services/product-service';
import { getSettings } from '../services/settings-service';

export const storeRouter = Router();

const publishedProduct: Prisma.ProductWhereInput = { published: true, deletedAt: null };

storeRouter.get(
  '/home',
  wrap(async (_req, res) => {
    const payload = await remember('home', 3600, async () => {
      const [categories, sliders, featured, deals, banners, best, flash, settings] = await Promise.all([
        prisma.category.findMany({ where: { parentId: null }, orderBy: { orderLevel: 'asc' }, include: { children: { orderBy: { orderLevel: 'asc' } } } }),
        prisma.slider.findMany({ where: { status: true }, orderBy: { sortOrder: 'asc' } }),
        prisma.homeFeaturedCategory.findMany({ orderBy: { sortOrder: 'asc' }, take: 8, include: { category: true } }),
        prisma.product.findMany({ where: { ...publishedProduct, todaysDeal: true }, orderBy: { id: 'desc' }, take: 20 }),
        prisma.banner.findMany({ where: { status: true }, orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }], take: 3 }),
        prisma.product.findMany({ where: publishedProduct, orderBy: { numOfSale: 'desc' }, take: 10 }),
        prisma.flashDeal.findFirst({
          where: { status: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
          include: { products: { include: { product: true } } },
        }),
        getSettings(),
      ]);
      return {
        settings,
        categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, children: c.children.map((k) => ({ id: k.id, name: k.name, slug: k.slug })) })),
        sliders,
        featuredCategories: featured.map((f) => ({ id: f.category.id, name: f.category.name, slug: f.category.slug, banner: f.category.banner })),
        todaysDeal: await toProductDTOs(deals),
        banners,
        bestSelling: await toProductDTOs(best),
        flashDeal: flash && {
          id: flash.id,
          title: flash.title,
          slug: flash.slug,
          endDate: flash.endDate,
          products: await toProductDTOs(flash.products.map((p) => p.product)),
        },
      };
    });
    res.json(payload);
  }),
);

/** หน้าแฟลชเซลแยกเฉพาะ: ดึงตาม slug ไม่จำกัดจำนวนสินค้า (ต่างจาก /home ที่ใช้แค่พรีวิว) */
storeRouter.get(
  '/flash-deals/:slug',
  wrap(async (req, res) => {
    const deal = await prisma.flashDeal.findUnique({
      where: { slug: req.params.slug },
      include: { products: { include: { product: true } } },
    });
    if (!deal) throw new HttpError(404, 'ไม่พบแฟลชเซลนี้');
    res.json({
      id: deal.id,
      title: deal.title,
      slug: deal.slug,
      startDate: deal.startDate,
      endDate: deal.endDate,
      active: deal.status && deal.startDate <= new Date() && deal.endDate >= new Date(),
      products: await toProductDTOs(deal.products.map((p) => p.product)),
    });
  }),
);

storeRouter.get(
  '/categories',
  wrap(async (_req, res) => {
    const all = await prisma.category.findMany({ orderBy: [{ level: 'asc' }, { orderLevel: 'asc' }] });
    res.json(all);
  }),
);

storeRouter.get(
  '/category/:id/children',
  wrap(async (req, res) => {
    res.json(await prisma.category.findMany({ where: { parentId: idParam(req) }, orderBy: { orderLevel: 'asc' } }));
  }),
);

storeRouter.get('/brands', wrap(async (_req, res) => void res.json(await prisma.brand.findMany({ orderBy: { name: 'asc' } }))));

storeRouter.get('/currencies', wrap(async (_req, res) => void res.json(await prisma.currency.findMany({ where: { status: true } }))));

storeRouter.get('/languages', wrap(async (_req, res) => void res.json(await prisma.language.findMany({ where: { status: true } }))));

storeRouter.get(
  '/translations/:lang',
  wrap(async (req, res) => {
    const rows = await prisma.translation.findMany({ where: { lang: req.params.lang } });
    res.json(Object.fromEntries(rows.map((r) => [r.langKey, r.langValue])));
  }),
);

/** slug หมวดที่เลือก + หมวดลูกทั้งหมด */
async function categoryIds(slug: string): Promise<number[]> {
  const root = await prisma.category.findUnique({ where: { slug } });
  if (!root) return [];
  const ids = [root.id];
  let frontier = [root.id];
  while (frontier.length) {
    const kids = await prisma.category.findMany({ where: { parentId: { in: frontier } }, select: { id: true } });
    frontier = kids.map((k) => k.id);
    ids.push(...frontier);
  }
  return ids;
}

storeRouter.get(
  '/products',
  validate(listQuerySchema, 'query'),
  wrap(async (req, res) => {
    const q = data<z.infer<typeof listQuerySchema>>(req);
    const where: Prisma.ProductWhereInput = { ...publishedProduct };
    if (q.q) where.OR = [{ name: { contains: q.q } }, { tags: { contains: q.q } }];
    if (q.category) where.categoryId = { in: await categoryIds(q.category) };
    if (q.brand) where.brand = { slug: q.brand };
    if (q.minPrice != null || q.maxPrice != null) where.unitPrice = { gte: q.minPrice, lte: q.maxPrice };
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      { newest: { id: 'desc' }, price_asc: { unitPrice: 'asc' }, price_desc: { unitPrice: 'desc' }, popular: { numOfSale: 'desc' }, rating: { rating: 'desc' } }[q.sort] as Prisma.ProductOrderByWithRelationInput;
    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy, skip: (q.page - 1) * q.perPage, take: q.perPage }),
    ]);
    res.json({ total, page: q.page, perPage: q.perPage, items: await toProductDTOs(rows) });
  }),
);

storeRouter.get(
  '/products/:slug',
  wrap(async (req, res) => {
    const p = await prisma.product.findFirst({
      where: { slug: req.params.slug, ...publishedProduct },
      include: { category: true, brand: true, stocks: true, reviews: { where: { status: 'approved' }, include: { user: { select: { name: true } } }, orderBy: { id: 'desc' }, take: 20 } },
    });
    if (!p) throw new HttpError(404, 'Product not found');
    const [dto] = await toProductDTOs([p]);
    const related = await prisma.product.findMany({ where: { ...publishedProduct, categoryId: p.categoryId, id: { not: p.id } }, take: 6 });
    res.json({
      ...dto,
      description: p.description,
      tags: p.tags,
      photoCredits: p.photoCredits,
      category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
      brand: p.brand && { id: p.brand.id, name: p.brand.name, slug: p.brand.slug },
      photos: (p.photos as string[] | null) ?? (p.thumbnail ? [p.thumbnail] : []),
      variants: p.stocks.map((s) => ({ id: s.id, variant: s.variant, sku: s.sku, price: Number(s.price), qty: s.qty })),
      reviews: p.reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, user: r.user.name, createdAt: r.createdAt })),
      related: await toProductDTOs(related),
      seo: { title: p.metaTitle ?? p.name, description: p.metaDescription ?? p.description.slice(0, 160) },
    });
  }),
);

/** Live search: products ≤5, categories ≤3, brands ≤3 (03-User-Flow §3.2) */
storeRouter.get(
  '/search',
  wrap(async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) return void res.json({ products: [], categories: [], brands: [] });
    const [products, categories, brands] = await Promise.all([
      prisma.product.findMany({ where: { ...publishedProduct, OR: [{ name: { contains: q } }, { tags: { contains: q } }] }, take: 5 }),
      prisma.category.findMany({ where: { name: { contains: q } }, take: 3 }),
      prisma.brand.findMany({ where: { name: { contains: q } }, take: 3 }),
    ]);
    res.json({
      products: await toProductDTOs(products),
      categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
      brands: brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug })),
    });
  }),
);

storeRouter.get(
  '/pages/:slug',
  wrap(async (req, res) => {
    const page = await prisma.page.findUnique({ where: { slug: req.params.slug } });
    if (!page) throw new HttpError(404, 'Page not found');
    res.json(page);
  }),
);

storeRouter.post(
  '/subscribe',
  validate(z.object({ email: z.string().email() })),
  wrap(async (req, res) => {
    const { email } = data<{ email: string }>(req);
    await prisma.subscriber.upsert({ where: { email }, update: {}, create: { email } });
    res.status(201).json({ ok: true });
  }),
);

storeRouter.post(
  '/contact',
  validate(z.object({ name: z.string().min(1), email: z.string().email(), phone: z.string().optional(), message: z.string().min(3).max(2000) })),
  wrap(async (req, res) => {
    await prisma.contact.create({ data: data(req) });
    res.status(201).json({ ok: true });
  }),
);

/** รูป placeholder SVG สำหรับ demo/seed (ไม่พึ่งบริการภายนอก) — /api/img/600x200?t=Text&c=E62E04 */
storeRouter.get('/img/:size', (req, res) => {
  const m = /^(\d{1,4})x(\d{1,4})$/.exec(req.params.size);
  if (!m) return void res.status(400).json({ error: 'Invalid size' });
  const [w, h] = [Number(m[1]), Number(m[2])].map((n) => Math.min(n, 2000));
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const text = esc(String(req.query.t ?? `${w}×${h}`).slice(0, 40));
  const color = /^[0-9a-fA-F]{6}$/.test(String(req.query.c)) ? String(req.query.c) : 'E62E04';
  const size = Math.max(8, Math.min(Math.min(w, h) / 6, (w * 0.9) / (Math.max(text.length, 1) * 0.62)));
  res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400').send(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#${color}"/><text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-size="${size}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`,
  );
});

/** ใช้กับหน้า Compare (ตาราง: แบรนด์/หมวด/ราคา) */
storeRouter.get(
  '/products/by-id/:id',
  wrap(async (req, res) => {
    const p = await prisma.product.findFirst({ where: { id: idParam(req), ...publishedProduct }, include: { category: true, brand: true } });
    if (!p) throw new HttpError(404, 'Product not found');
    const [dto] = await toProductDTOs([p]);
    res.json({ ...dto, brand: p.brand && { name: p.brand.name }, category: { name: p.category.name } });
  }),
);
