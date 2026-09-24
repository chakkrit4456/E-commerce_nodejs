import { Router } from 'express';
import multer from 'multer';
import QRCode from 'qrcode';
import generatePayload from 'promptpay-qr';
import { prisma } from '../lib/prisma';
import { HttpError, wrap } from '../lib/http';
import { optionalAuth, requirePermission, requireRole } from '../middlewares/auth';
import { saveImage } from './uploads';

/**
 * ช่องทางชำระเงินโหมดสาธิต: promptpay และ bank_transfer ทำงานได้จริง (สร้าง QR / รับสลิป)
 * แต่ยังไม่มีการตรวจสอบยอดอัตโนมัติ ต้องให้แอดมินกดยืนยันเองหลังตรวจสลิป (ดู requirePermission('orders.manage'))
 */

async function orderByCode(code: string, req: { user?: { id: number }; header: (k: string) => string | undefined }) {
  const order = await prisma.order.findUnique({ where: { code } });
  const temp = req.header('x-temp-user-id');
  const mine = order && ((req.user && order.userId === req.user.id) || (temp && order.guestId === temp));
  if (!order || !mine) throw new HttpError(404, 'Order not found');
  return order;
}

export const paymentsRouter = Router();
paymentsRouter.use(optionalAuth);

/** ยิง QR พร้อมเพย์ตามยอดคำสั่งซื้อจริง (คำนวณฝั่ง server เท่านั้น) */
paymentsRouter.get(
  '/orders/:code/promptpay-qr',
  wrap(async (req, res) => {
    const order = await orderByCode(req.params.code, req);
    const setting = await prisma.businessSetting.findUnique({ where: { type: 'promptpay_id' } });
    const promptpayId = setting?.value ?? '';
    if (!promptpayId) throw new HttpError(400, 'ร้านค้ายังไม่ได้ตั้งค่าพร้อมเพย์');
    const payload = generatePayload(promptpayId, { amount: Number(order.grandTotal) });
    const qrDataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
    res.json({ qrDataUrl, amount: Number(order.grandTotal), promptpayId });
  }),
);

/** ข้อมูลบัญชีสำหรับโอนผ่านธนาคาร (โหมดสาธิต) */
paymentsRouter.get(
  '/payment-settings',
  wrap(async (_req, res) => {
    const rows = await prisma.businessSetting.findMany({
      where: { type: { in: ['promptpay_id', 'bank_name', 'bank_account_name', 'bank_account_number'] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.type, r.value]));
    res.json({
      promptpayId: map.promptpay_id ?? '',
      bankName: map.bank_name ?? '',
      bankAccountName: map.bank_account_name ?? '',
      bankAccountNumber: map.bank_account_number ?? '',
    });
  }),
);

const slipUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

/** ลูกค้าอัปโหลดสลิปการโอนเงิน → สร้าง/อัปเดตแถว Payment เป็น pending_verification รอแอดมินตรวจ */
paymentsRouter.post(
  '/orders/:code/slip',
  (req, res, next) =>
    slipUpload.single('slip')(req, res, (err) => {
      if (err instanceof multer.MulterError) return next(new HttpError(400, err.code === 'LIMIT_FILE_SIZE' ? 'ไฟล์ใหญ่เกิน 5MB' : err.message));
      next(err);
    }),
  wrap(async (req, res) => {
    const order = await orderByCode(req.params.code, req);
    const file = req.file;
    if (!file) throw new HttpError(400, 'กรุณาแนบไฟล์สลิป');
    const saved = await saveImage(file.buffer, file.originalname, req.user?.id);
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: req.user?.id,
        amount: order.grandTotal,
        method: order.paymentType,
        transactionId: `slip-${order.code}-${Date.now()}`,
        status: 'pending_verification',
        payload: { slipUrl: saved.url },
      },
    });
    res.status(201).json({ id: payment.id, status: payment.status, slipUrl: saved.url });
  }),
);

/** สถานะการชำระเงินของออเดอร์ (ให้หน้า order-success/บัญชีลูกค้า poll ดูได้) */
paymentsRouter.get(
  '/orders/:code/payment-status',
  wrap(async (req, res) => {
    const order = await orderByCode(req.params.code, req);
    const latest = await prisma.payment.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } });
    res.json({ paymentStatus: order.paymentStatus, paymentType: order.paymentType, latestPayment: latest ? { status: latest.status, createdAt: latest.createdAt } : null });
  }),
);

// ---------- Admin: ตรวจ/ยืนยันสลิปการชำระเงิน ----------
export const adminPaymentsRouter = Router();
adminPaymentsRouter.use(optionalAuth, requireRole('admin', 'staff'));

adminPaymentsRouter.get(
  '/pending',
  requirePermission('orders.manage'),
  wrap(async (_req, res) => {
    const rows = await prisma.payment.findMany({
      where: { status: 'pending_verification' },
      orderBy: { createdAt: 'asc' },
      include: { order: { select: { code: true, grandTotal: true, currencyCode: true } } },
    });
    res.json(rows.map((r) => ({ id: r.id, orderCode: r.order.code, amount: Number(r.amount), method: r.method, slipUrl: (r.payload as { slipUrl?: string } | null)?.slipUrl ?? null, createdAt: r.createdAt })));
  }),
);

adminPaymentsRouter.post(
  '/:id/confirm',
  requirePermission('orders.manage'),
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new HttpError(404, 'Payment not found');
    await prisma.$transaction([
      prisma.payment.update({ where: { id }, data: { status: 'confirmed' } }),
      prisma.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'paid' } }),
      prisma.orderStatusHistory.create({ data: { orderId: payment.orderId, status: 'pending', note: 'ยืนยันการชำระเงินแล้ว (ตรวจสลิปด้วยตนเอง)' } }),
    ]);
    res.json({ ok: true });
  }),
);

adminPaymentsRouter.post(
  '/:id/reject',
  requirePermission('orders.manage'),
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new HttpError(404, 'Payment not found');
    await prisma.payment.update({ where: { id }, data: { status: 'rejected' } });
    res.json({ ok: true });
  }),
);
