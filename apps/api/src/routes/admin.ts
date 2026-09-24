import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, idParam, slugify, wrap } from '../lib/http';
import { clearAll, forget } from '../lib/cache';
import { optionalAuth, requirePermission, requireRole } from '../middlewares/auth';
import { data, validate } from '../middlewares/validate';
import { productInputSchema, productPatchSchema } from '../validators/schemas';
import { setSetting } from '../services/settings-service';

export const adminRouter = Router();
adminRouter.use(optionalAuth, requireRole('admin', 'staff'));

const num = (v: number | undefined) => (v === undefined ? undefined : v.toString());
const activity = (userId: number, action: string, subject?: string) => prisma.activityLog.create({ data: { userId, action, subject } });

// ---------- A1 Dashboard ----------
adminRouter.get(
  '/dashboard',
  requirePermission('dashboard.view'),
  wrap(async (_req, res) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
    const yearAgo = new Date(startOfDay.getFullYear(), startOfDay.getMonth() - 11, 1);
    const paidish = { deliveryStatus: { not: 'cancelled' as const } };
    const [today, month, byStatus, newCustomers, orders12, top, low] = await Promise.all([
      prisma.order.aggregate({ where: { ...paidish, createdAt: { gte: startOfDay } }, _sum: { grandTotal: true }, _count: true }),
      prisma.order.aggregate({ where: { ...paidish, createdAt: { gte: startOfMonth } }, _sum: { grandTotal: true }, _count: true }),
      prisma.order.groupBy({ by: ['deliveryStatus'], _count: true }),
      prisma.user.count({ where: { userType: 'customer', createdAt: { gte: startOfMonth } } }),
      prisma.order.findMany({ where: { ...paidish, createdAt: { gte: yearAgo } }, select: { createdAt: true, grandTotal: true } }),
      prisma.product.findMany({ where: { deletedAt: null }, orderBy: { numOfSale: 'desc' }, take: 10, select: { id: true, name: true, numOfSale: true, thumbnail: true } }),
      prisma.product.findMany({ where: { deletedAt: null, currentStock: { lte: 5 } }, take: 20, select: { id: true, name: true, currentStock: true } }),
    ]);
    const monthly: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(yearAgo.getFullYear(), yearAgo.getMonth() + i, 1);
      monthly[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
    }
    for (const o of orders12) {
      const k = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (k in monthly) monthly[k] += Number(o.grandTotal);
    }
    res.json({
      salesToday: Number(today._sum.grandTotal ?? 0),
      ordersToday: today._count,
      salesMonth: Number(month._sum.grandTotal ?? 0),
      ordersMonth: month._count,
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s.deliveryStatus, s._count])),
      newCustomers,
      monthlySales: Object.entries(monthly).map(([month, total]) => ({ month, total })),
      topProducts: top,
      lowStock: low,
    });
  }),
);

// ---------- A2 Products ----------
adminRouter.get(
  '/products',
  requirePermission('products.manage'),
  wrap(async (req, res) => {
    const q = String(req.query.q ?? '');
    const page = Math.max(1, Number(req.query.page ?? 1));
    const where = { deletedAt: null, ...(q ? { name: { contains: q } } : {}) };
    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy: { id: 'desc' }, skip: (page - 1) * 20, take: 20, include: { category: { select: { name: true } } } }),
    ]);
    res.json({ total, page, items });
  }),
);

adminRouter.get(
  '/products/:id',
  requirePermission('products.manage'),
  wrap(async (req, res) => {
    const p = await prisma.product.findFirst({ where: { id: idParam(req), deletedAt: null } });
    if (!p) throw new HttpError(404, 'Product not found');
    res.json(p);
  }),
);

adminRouter.post(
  '/products',
  requirePermission('products.manage'),
  validate(productInputSchema),
  wrap(async (req, res) => {
    const b = data<z.infer<typeof productInputSchema>>(req);
    let slug = slugify(b.name);
    if (await prisma.product.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    const p = await prisma.product.create({
      data: {
        ...b,
        thumbnail: b.thumbnail ?? b.photos?.[0] ?? null,
        slug,
        unitPrice: b.unitPrice.toString(),
        discount: b.discount.toString(),
        tax: b.tax.toString(),
        shippingCost: b.shippingCost.toString(),
        addedByUserId: req.user!.id,
      },
    });
    forget('home');
    await activity(req.user!.id, 'product.create', String(p.id));
    res.status(201).json(p);
  }),
);

adminRouter.put(
  '/products/:id',
  requirePermission('products.manage'),
  validate(productPatchSchema),
  wrap(async (req, res) => {
    const b = data<z.infer<typeof productPatchSchema>>(req);
    const id = idParam(req);
    if (!(await prisma.product.findFirst({ where: { id, deletedAt: null } }))) throw new HttpError(404, 'Product not found');
    const p = await prisma.product.update({
      where: { id },
      data: { ...b, thumbnail: b.thumbnail !== undefined ? b.thumbnail : b.photos ? (b.photos[0] ?? null) : undefined, unitPrice: num(b.unitPrice), discount: num(b.discount), tax: num(b.tax), shippingCost: num(b.shippingCost) },
    });
    forget('home'); // todaysDeal/featured อาจเปลี่ยน → ล้าง cache หน้าแรก
    await activity(req.user!.id, 'product.update', String(id));
    res.json(p);
  }),
);

adminRouter.delete(
  '/products/:id',
  requirePermission('products.manage'),
  wrap(async (req, res) => {
    await prisma.product.update({ where: { id: idParam(req) }, data: { deletedAt: new Date(), published: false } });
    forget('home');
    res.status(204).end();
  }),
);

// ---------- A3/A4 Categories & Brands ----------
const categorySchema = z.object({
  name: z.string().min(1),
  parentId: z.number().int().positive().nullish(),
  icon: z.string().nullish(),
  banner: z.string().nullish(),
  orderLevel: z.number().int().default(0),
  featured: z.boolean().default(false),
});

adminRouter.post(
  '/categories',
  requirePermission('categories.manage'),
  validate(categorySchema),
  wrap(async (req, res) => {
    const b = data<z.infer<typeof categorySchema>>(req);
    let level = 0;
    if (b.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: b.parentId } });
      if (!parent) throw new HttpError(400, 'Parent not found');
      if (parent.level >= 2) throw new HttpError(400, 'Max 3 category levels');
      level = parent.level + 1;
    }
    let slug = slugify(b.name);
    if (await prisma.category.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    const c = await prisma.category.create({ data: { ...b, level, slug } });
    forget('home');
    res.status(201).json(c);
  }),
);

adminRouter.put(
  '/categories/:id',
  requirePermission('categories.manage'),
  validate(categorySchema.partial()),
  wrap(async (req, res) => {
    const c = await prisma.category.update({ where: { id: idParam(req) }, data: data(req) });
    forget('home');
    res.json(c);
  }),
);

adminRouter.delete(
  '/categories/:id',
  requirePermission('categories.manage'),
  wrap(async (req, res) => {
    const id = idParam(req);
    if ((await prisma.product.count({ where: { categoryId: id } })) || (await prisma.category.count({ where: { parentId: id } })))
      throw new HttpError(409, 'Category still has products or sub-categories');
    await prisma.category.delete({ where: { id } });
    forget('home');
    res.status(204).end();
  }),
);

const brandSchema = z.object({ name: z.string().min(1), logo: z.string().nullish(), top: z.boolean().default(false) });

adminRouter.post(
  '/brands',
  requirePermission('brands.manage'),
  validate(brandSchema),
  wrap(async (req, res) => {
    const b = data<z.infer<typeof brandSchema>>(req);
    res.status(201).json(await prisma.brand.create({ data: { ...b, slug: `${slugify(b.name)}-${Date.now().toString(36)}` } }));
  }),
);

adminRouter.delete(
  '/brands/:id',
  requirePermission('brands.manage'),
  wrap(async (req, res) => {
    await prisma.brand.delete({ where: { id: idParam(req) } });
    res.status(204).end();
  }),
);

// ---------- A6 Orders ----------
adminRouter.get(
  '/orders',
  requirePermission('orders.manage'),
  wrap(async (req, res) => {
    const where: Record<string, unknown> = {};
    if (req.query.status) where.deliveryStatus = String(req.query.status);
    if (req.query.payment) where.paymentStatus = String(req.query.payment);
    const page = Math.max(1, Number(req.query.page ?? 1));
    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({ where, orderBy: { id: 'desc' }, skip: (page - 1) * 20, take: 20, include: { user: { select: { name: true, email: true } } } }),
    ]);
    res.json({ total, page, items });
  }),
);

adminRouter.get(
  '/orders/:id',
  requirePermission('orders.manage'),
  wrap(async (req, res) => {
    const id = idParam(req);
    const order = await prisma.order.findUnique({ where: { id }, include: { details: true, history: { orderBy: { id: 'asc' } }, user: { select: { name: true, email: true } } } });
    if (!order) throw new HttpError(404, 'Order not found');
    if (!order.viewed) await prisma.order.update({ where: { id }, data: { viewed: true } });
    res.json(order);
  }),
);

const statusSchema = z.object({
  deliveryStatus: z.enum(['pending', 'confirmed', 'picked_up', 'on_the_way', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded', 'partially_refunded']).optional(),
  trackingCode: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
});

adminRouter.put(
  '/orders/:id/status',
  requirePermission('orders.manage'),
  validate(statusSchema),
  wrap(async (req, res) => {
    const b = data<z.infer<typeof statusSchema>>(req);
    const id = idParam(req);
    const order = await prisma.order.findUnique({ where: { id }, include: { details: true } });
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.deliveryStatus === 'cancelled' && b.deliveryStatus && b.deliveryStatus !== 'cancelled') throw new HttpError(400, 'Cancelled order cannot be reopened');

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { deliveryStatus: b.deliveryStatus, paymentStatus: b.paymentStatus, trackingCode: b.trackingCode } });
      if (b.deliveryStatus || b.paymentStatus) {
        await tx.orderDetail.updateMany({ where: { orderId: id }, data: { deliveryStatus: b.deliveryStatus, paymentStatus: b.paymentStatus } });
      }
      if (b.deliveryStatus && b.deliveryStatus !== order.deliveryStatus) {
        await tx.orderStatusHistory.create({ data: { orderId: id, status: b.deliveryStatus, note: b.note, changedByUserId: req.user!.id } });
        if (b.deliveryStatus === 'cancelled') {
          // คืนสต็อกเมื่อยกเลิก
          for (const d of order.details) {
            await tx.product.update({ where: { id: d.productId }, data: { currentStock: { increment: d.quantity }, numOfSale: { decrement: d.quantity } } });
          }
        }
      }
    });
    await activity(req.user!.id, 'order.status', String(id));
    res.json(await prisma.order.findUnique({ where: { id }, include: { details: true, history: true } }));
  }),
);

// ---------- A7 Refunds ----------
adminRouter.get('/refunds', requirePermission('orders.manage'), wrap(async (_req, res) => void res.json(await prisma.refundRequest.findMany({ orderBy: { id: 'desc' }, include: { order: { select: { code: true } } } }))));

adminRouter.put(
  '/refunds/:id',
  requirePermission('orders.manage'),
  validate(z.object({ status: z.enum(['approved', 'rejected']), adminNote: z.string().optional() })),
  wrap(async (req, res) => {
    const b = data<{ status: 'approved' | 'rejected'; adminNote?: string }>(req);
    const r = await prisma.refundRequest.update({ where: { id: idParam(req) }, data: b });
    if (b.status === 'approved') await prisma.order.update({ where: { id: r.orderId }, data: { paymentStatus: 'refunded' } });
    res.json(r);
  }),
);

// ---------- A8 Customers ----------
adminRouter.get(
  '/customers',
  requirePermission('customers.manage'),
  wrap(async (_req, res) => {
    const users = await prisma.user.findMany({ where: { userType: 'customer', deletedAt: null }, orderBy: { id: 'desc' }, select: { id: true, name: true, email: true, banned: true, createdAt: true, _count: { select: { orders: true } } } });
    res.json(users);
  }),
);

adminRouter.put(
  '/customers/:id/ban',
  requirePermission('customers.manage'),
  validate(z.object({ banned: z.boolean() })),
  wrap(async (req, res) => {
    const u = await prisma.user.update({ where: { id: idParam(req) }, data: { banned: data<{ banned: boolean }>(req).banned }, select: { id: true, banned: true } });
    res.json(u);
  }),
);

// ---------- A9 Reviews ----------
adminRouter.get('/reviews', requirePermission('reviews.manage'), wrap(async (_req, res) => void res.json(await prisma.review.findMany({ orderBy: { id: 'desc' }, include: { product: { select: { name: true } }, user: { select: { name: true } } } }))));

adminRouter.put(
  '/reviews/:id',
  requirePermission('reviews.manage'),
  validate(z.object({ status: z.enum(['pending', 'approved']) })),
  wrap(async (req, res) => {
    const r = await prisma.review.update({ where: { id: idParam(req) }, data: data(req) });
    const agg = await prisma.review.aggregate({ where: { productId: r.productId, status: 'approved' }, _avg: { rating: true } });
    await prisma.product.update({ where: { id: r.productId }, data: { rating: (agg._avg.rating ?? 0).toFixed(2) } });
    res.json(r);
  }),
);

// ---------- A10 Marketing: Coupons & Flash deals ----------
const couponSchema = z.object({
  type: z.enum(['cart_base', 'product_base']).default('cart_base'),
  code: z.string().min(3).max(30).transform((s) => s.toUpperCase()),
  discount: z.number().positive(),
  discountType: z.enum(['amount', 'percent']).default('percent'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  usageLimit: z.number().int().positive().nullish(),
  perUserLimit: z.number().int().positive().default(1),
  details: z.object({ minBuy: z.number().optional(), maxDiscount: z.number().optional(), productIds: z.array(z.number()).optional() }).default({}),
});

adminRouter.get('/coupons', requirePermission('marketing.manage'), wrap(async (_req, res) => void res.json(await prisma.coupon.findMany({ orderBy: { id: 'desc' } }))));

adminRouter.post(
  '/coupons',
  requirePermission('marketing.manage'),
  validate(couponSchema),
  wrap(async (req, res) => {
    const b = data<z.infer<typeof couponSchema>>(req);
    if (b.endDate <= b.startDate) throw new HttpError(400, 'endDate must be after startDate');
    if (b.discountType === 'percent' && b.discount > 100) throw new HttpError(400, 'Percent discount cannot exceed 100');
    if (await prisma.coupon.findUnique({ where: { code: b.code } })) throw new HttpError(409, 'Coupon code exists');
    res.status(201).json(await prisma.coupon.create({ data: { ...b, discount: b.discount.toString() } }));
  }),
);

adminRouter.delete('/coupons/:id', requirePermission('marketing.manage'), wrap(async (req, res) => { await prisma.coupon.delete({ where: { id: idParam(req) } }); res.status(204).end(); }));

const flashSchema = z.object({
  title: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.boolean().default(true),
  products: z.array(z.object({ productId: z.number().int().positive(), discount: z.number().positive(), discountType: z.enum(['amount', 'percent']).default('percent') })).min(1),
});

adminRouter.get('/flash-deals', requirePermission('marketing.manage'), wrap(async (_req, res) => void res.json(await prisma.flashDeal.findMany({ orderBy: { id: 'desc' }, include: { products: true } }))));

adminRouter.post(
  '/flash-deals',
  requirePermission('marketing.manage'),
  validate(flashSchema),
  wrap(async (req, res) => {
    const b = data<z.infer<typeof flashSchema>>(req);
    if (b.endDate <= b.startDate) throw new HttpError(400, 'endDate must be after startDate');
    const fd = await prisma.flashDeal.create({
      data: {
        title: b.title,
        slug: `${slugify(b.title)}-${Date.now().toString(36)}`,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
        products: { create: b.products.map((p) => ({ ...p, discount: p.discount.toString() })) },
      },
      include: { products: true },
    });
    forget('home');
    res.status(201).json(fd);
  }),
);

adminRouter.delete('/flash-deals/:id', requirePermission('marketing.manage'), wrap(async (req, res) => { await prisma.flashDeal.delete({ where: { id: idParam(req) } }); forget('home'); res.status(204).end(); }));

// ---------- A11 Website Setup: Home page settings ----------
const websiteGuard = requirePermission('website.manage');

adminRouter.get(
  '/home-settings',
  websiteGuard,
  wrap(async (_req, res) => {
    const [sliders, banners, featured, settings] = await Promise.all([
      prisma.slider.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.banner.findMany({ orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }] }),
      prisma.homeFeaturedCategory.findMany({ orderBy: { sortOrder: 'asc' }, include: { category: { select: { id: true, name: true } } } }),
      prisma.businessSetting.findMany(),
    ]);
    res.json({ sliders, banners, featuredCategories: featured, settings: Object.fromEntries(settings.map((s) => [s.type, s.value])) });
  }),
);

const sliderSchema = z.object({ image: z.string().min(1), link: z.string().default('/'), sortOrder: z.number().int().default(0), status: z.boolean().default(true) });

adminRouter.post('/sliders', websiteGuard, validate(sliderSchema), wrap(async (req, res) => { const s = await prisma.slider.create({ data: data(req) }); forget('home'); res.status(201).json(s); }));
adminRouter.put('/sliders/:id', websiteGuard, validate(sliderSchema.partial()), wrap(async (req, res) => { const s = await prisma.slider.update({ where: { id: idParam(req) }, data: data(req) }); forget('home'); res.json(s); }));
adminRouter.delete('/sliders/:id', websiteGuard, wrap(async (req, res) => { await prisma.slider.delete({ where: { id: idParam(req) } }); forget('home'); res.status(204).end(); }));

const bannerSchema = z.object({ position: z.enum(['home_1', 'home_2', 'home_3']), image: z.string().min(1), link: z.string().default('/'), sortOrder: z.number().int().default(0), status: z.boolean().default(true) });

adminRouter.post('/banners', websiteGuard, validate(bannerSchema), wrap(async (req, res) => { const b = await prisma.banner.create({ data: data(req) }); forget('home'); res.status(201).json(b); }));
adminRouter.put('/banners/:id', websiteGuard, validate(bannerSchema.partial()), wrap(async (req, res) => { const b = await prisma.banner.update({ where: { id: idParam(req) }, data: data(req) }); forget('home'); res.json(b); }));
adminRouter.delete('/banners/:id', websiteGuard, wrap(async (req, res) => { await prisma.banner.delete({ where: { id: idParam(req) } }); forget('home'); res.status(204).end(); }));

// Featured categories (สูงสุด 8) — ส่งเป็นลิสต์เรียงลำดับใหม่ทั้งชุด
adminRouter.put(
  '/featured-categories',
  websiteGuard,
  validate(z.object({ categoryIds: z.array(z.number().int().positive()).max(8) })),
  wrap(async (req, res) => {
    const { categoryIds } = data<{ categoryIds: number[] }>(req);
    if (new Set(categoryIds).size !== categoryIds.length) throw new HttpError(400, 'Duplicate categories');
    await prisma.$transaction([
      prisma.homeFeaturedCategory.deleteMany(),
      ...categoryIds.map((categoryId, sortOrder) => prisma.homeFeaturedCategory.create({ data: { categoryId, sortOrder } })),
    ]);
    forget('home');
    res.json({ ok: true });
  }),
);

adminRouter.put(
  '/settings',
  websiteGuard,
  validate(z.record(z.string().regex(/^[a-z0-9_]+$/), z.string())),
  wrap(async (req, res) => {
    for (const [k, v] of Object.entries(data<Record<string, string>>(req))) await setSetting(k, v);
    res.json({ ok: true });
  }),
);

// ---------- A19 System ----------
adminRouter.post('/cache/clear', requireRole('admin'), wrap(async (_req, res) => { clearAll(); res.json({ ok: true }); }));
adminRouter.get('/activity-logs', requireRole('admin'), wrap(async (_req, res) => void res.json(await prisma.activityLog.findMany({ orderBy: { id: 'desc' }, take: 100 }))));
adminRouter.get('/subscribers', requirePermission('marketing.manage'), wrap(async (_req, res) => void res.json(await prisma.subscriber.findMany({ orderBy: { id: 'desc' } }))));
adminRouter.get('/contacts', requirePermission('support.manage'), wrap(async (_req, res) => void res.json(await prisma.contact.findMany({ orderBy: { id: 'desc' } }))));
