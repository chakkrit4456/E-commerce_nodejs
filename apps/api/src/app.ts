import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middlewares/error';
import { authRouter } from './routes/auth';
import { storeRouter } from './routes/store';
import { shopRouter } from './routes/shop';
import { adminRouter } from './routes/admin';
import { UPLOAD_DIR, uploadsRouter } from './routes/uploads';
import { adminPaymentsRouter, paymentsRouter } from './routes/payments';
import Decimal from 'decimal.js';

export function createApp() {
  const app = express();
  // Prisma Decimal → number ใน JSON (จำนวนเงินคำนวณด้วย decimal.js ฝั่ง server แล้ว)
  app.set('json replacer', function (this: Record<string, unknown>, key: string, value: unknown) {
    const raw = this[key];
    return raw instanceof Decimal || (raw && (raw as { constructor?: { name?: string } }).constructor?.name === 'Decimal') ? Number(raw) : value;
  });
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.webOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.get('/api/health', (_req, res) => void res.json({ ok: true }));
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }));
  app.use('/api/admin/uploads', uploadsRouter);
  app.use('/api/admin/payments', adminPaymentsRouter);
  app.use('/api', paymentsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', storeRouter);
  app.use('/api', shopRouter);
  app.use((_req, res) => void res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);
  return app;
}
