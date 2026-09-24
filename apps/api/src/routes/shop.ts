import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, idParam, wrap } from '../lib/http';
import { optionalAuth, requireAuth } from '../middlewares/auth';
import { data, validate } from '../middlewares/validate';
import { addressSchema, cartAddSchema, cartRemoveSchema, cartUpdateSchema, checkoutSchema } from '../validators/schemas';
import { addToCart, cartOwner, getCart, removeLine, updateQuantity } from '../services/cart-service';
import { placeOrderAction } from '../actions/place-order-action';
import { toProductDTOs } from '../services/product-service';
import rateLimit from 'express-rate-limit';

export const shopRouter = Router();
shopRouter.use(optionalAuth);

const cartLimiter = rateLimit({ windowMs: 60_000, limit: 30, skip: () => process.env.NODE_ENV === 'test' });

// ---------- Cart (guest ใช้ header x-temp-user-id) ----------
shopRouter.get('/cart', wrap(async (req, res) => void res.json(await getCart(cartOwner(req), req.query.coupon as string | undefined))));

shopRouter.post(
  '/cart/add',
  cartLimiter,
  validate(cartAddSchema),
  wrap(async (req, res) => {
    const b = data<z.infer<typeof cartAddSchema>>(req);
    const owner = cartOwner(req);
    await addToCart(owner, b.productId, b.quantity, b.variation);
    res.status(201).json(await getCart(owner));
  }),
);

shopRouter.post(
  '/cart/update',
  cartLimiter,
  validate(cartUpdateSchema),
  wrap(async (req, res) => {
    const b = data<z.infer<typeof cartUpdateSchema>>(req);
    const owner = cartOwner(req);
    await updateQuantity(owner, b.id, b.quantity);
    res.json(await getCart(owner));
  }),
);

shopRouter.post(
  '/cart/remove',
  cartLimiter,
  validate(cartRemoveSchema),
  wrap(async (req, res) => {
    const owner = cartOwner(req);
    await removeLine(owner, data<{ id: number }>(req).id);
    res.json(await getCart(owner));
  }),
);

// ---------- Checkout (guest checkout ได้) ----------
shopRouter.post(
  '/checkout',
  validate(checkoutSchema),
  wrap(async (req, res) => {
    const b = data<z.infer<typeof checkoutSchema>>(req);
    const order = await placeOrderAction({
      owner: cartOwner(req),
      shippingAddress: b.shippingAddress,
      paymentType: b.paymentType,
      couponCode: b.couponCode,
      currencyCode: b.currencyCode,
      notes: b.notes,
    });
    res.status(201).json({ id: order.id, code: order.code, grandTotal: Number(order.grandTotal) });
  }),
);

// guest ดูออเดอร์ที่เพิ่งสั่งด้วย code + guest id
shopRouter.get(
  '/orders/track/:code',
  wrap(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { code: req.params.code }, include: { details: true } });
    const temp = req.header('x-temp-user-id');
    const mine = order && ((req.user && order.userId === req.user.id) || (temp && order.guestId === temp));
    if (!order || !mine) throw new HttpError(404, 'Order not found');
    res.json(order);
  }),
);

// ---------- Customer area (ต้องล็อกอิน) ----------
const me = Router();
me.use(requireAuth);

me.get(
  '/orders',
  wrap(async (req, res) => {
    res.json(await prisma.order.findMany({ where: { userId: req.user!.id }, orderBy: { id: 'desc' }, include: { details: true } }));
  }),
);

me.get(
  '/orders/:id',
  wrap(async (req, res) => {
    const order = await prisma.order.findFirst({ where: { id: idParam(req), userId: req.user!.id }, include: { details: true, history: true } });
    if (!order) throw new HttpError(404, 'Order not found');
    res.json(order);
  }),
);

me.get('/addresses', wrap(async (req, res) => void res.json(await prisma.address.findMany({ where: { userId: req.user!.id } }))));

me.post(
  '/addresses',
  validate(addressSchema),
  wrap(async (req, res) => {
    const a = await prisma.address.create({ data: { ...data<z.infer<typeof addressSchema>>(req), userId: req.user!.id } });
    res.status(201).json(a);
  }),
);

me.delete(
  '/addresses/:id',
  wrap(async (req, res) => {
    await prisma.address.deleteMany({ where: { id: idParam(req), userId: req.user!.id } });
    res.status(204).end();
  }),
);

me.get(
  '/wishlist',
  wrap(async (req, res) => {
    const rows = await prisma.wishlist.findMany({ where: { userId: req.user!.id }, include: { product: true } });
    res.json(await toProductDTOs(rows.map((r) => r.product)));
  }),
);

me.post(
  '/wishlist/toggle',
  validate(z.object({ productId: z.number().int().positive() })),
  wrap(async (req, res) => {
    const { productId } = data<{ productId: number }>(req);
    const key = { userId_productId: { userId: req.user!.id, productId } };
    const existing = await prisma.wishlist.findUnique({ where: key });
    if (existing) await prisma.wishlist.delete({ where: key });
    else await prisma.wishlist.create({ data: { userId: req.user!.id, productId } });
    res.json({ wishlisted: !existing, count: await prisma.wishlist.count({ where: { userId: req.user!.id } }) });
  }),
);

me.post(
  '/reviews',
  validate(z.object({ productId: z.number().int().positive(), rating: z.number().int().min(1).max(5), comment: z.string().max(1000).default('') })),
  wrap(async (req, res) => {
    const b = data<{ productId: number; rating: number; comment: string }>(req);
    const bought = await prisma.orderDetail.findFirst({
      where: { productId: b.productId, order: { userId: req.user!.id, deliveryStatus: 'delivered' } },
      select: { orderId: true },
    });
    if (!bought) throw new HttpError(403, 'You can review only products you received');
    const r = await prisma.review.create({ data: { ...b, userId: req.user!.id, orderId: bought.orderId } });
    res.status(201).json(r);
  }),
);

me.post(
  '/refunds',
  validate(z.object({ orderId: z.number().int().positive(), reason: z.string().min(3).max(500) })),
  wrap(async (req, res) => {
    const b = data<{ orderId: number; reason: string }>(req);
    const order = await prisma.order.findFirst({ where: { id: b.orderId, userId: req.user!.id } });
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.deliveryStatus !== 'delivered') throw new HttpError(400, 'Only delivered orders can be refunded');
    const r = await prisma.refundRequest.create({ data: { orderId: order.id, userId: req.user!.id, reason: b.reason, refundAmount: order.grandTotal } });
    res.status(201).json(r);
  }),
);

shopRouter.use('/me', me);
