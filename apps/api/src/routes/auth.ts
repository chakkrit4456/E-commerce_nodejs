import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { HttpError, wrap } from '../lib/http';
import { optionalAuth, requireAuth, signToken } from '../middlewares/auth';
import { data, validate } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../validators/schemas';
import { mergeGuestCart } from '../services/cart-service';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';

export const authRouter = Router();

// login 5 ครั้ง/นาที (02-Tech-Stack §6)
const loginLimiter = rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: true, legacyHeaders: false, skip: () => process.env.NODE_ENV === 'test' });

const publicUser = (u: { id: number; name: string; email: string | null; userType: string }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  userType: u.userType,
});

authRouter.post(
  '/register',
  validate(registerSchema),
  wrap(async (req, res) => {
    const { name, email, password, guestId } = data<z.infer<typeof registerSchema>>(req);
    if (await prisma.user.findUnique({ where: { email } })) throw new HttpError(409, 'Email already registered');
    const user = await prisma.user.create({ data: { name, email, password: await bcrypt.hash(password, 10) } });
    if (guestId) await mergeGuestCart(guestId, user.id);
    res.status(201).json({ token: signToken({ id: user.id, userType: user.userType }), user: publicUser(user) });
  }),
);

authRouter.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  wrap(async (req, res) => {
    const { email, password, guestId } = data<z.infer<typeof loginSchema>>(req);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || !(await bcrypt.compare(password, user.password))) throw new HttpError(401, 'Invalid email or password');
    if (user.banned) throw new HttpError(403, 'Account is banned');
    if (guestId) await mergeGuestCart(guestId, user.id);
    res.json({ token: signToken({ id: user.id, userType: user.userType }), user: publicUser(user) });
  }),
);

authRouter.get(
  '/me',
  optionalAuth,
  requireAuth,
  wrap(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(401, 'Authentication required');
    res.json(publicUser(user));
  }),
);

// Login ผ่าน Google (Google Identity Services): เว็บส่ง ID token มา → ตรวจลายเซ็น/audience กับ Google
const googleClient = new OAuth2Client();
const googleSchema = z.object({ credential: z.string().min(1), guestId: z.string().optional() });

authRouter.get('/google/config', (_req, res) => {
  res.json({ clientId: config.googleClientId || null });
});

authRouter.post(
  '/google',
  loginLimiter,
  validate(googleSchema),
  wrap(async (req, res) => {
    if (!config.googleClientId) throw new HttpError(503, 'Google login is not configured');
    const { credential, guestId } = data<z.infer<typeof googleSchema>>(req);
    let payload;
    try {
      payload = (await googleClient.verifyIdToken({ idToken: credential, audience: config.googleClientId })).getPayload();
    } catch {
      throw new HttpError(401, 'Invalid Google credential');
    }
    if (!payload?.sub || !payload.email || !payload.email_verified) throw new HttpError(401, 'Google account email is not verified');

    const email = payload.email.toLowerCase();
    let user =
      (await prisma.user.findFirst({ where: { provider: 'google', providerId: payload.sub } })) ??
      (await prisma.user.findUnique({ where: { email } }));
    if (user) {
      if (user.deletedAt) throw new HttpError(401, 'Invalid email or password');
      // บัญชีเดิมที่สมัครด้วยอีเมลเดียวกัน → ผูกกับ Google ครั้งแรก (Google ยืนยันอีเมลแล้ว)
      if (!user.providerId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { provider: 'google', providerId: payload.sub, emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
        });
      }
    } else {
      // ไม่มีรหัสผ่าน → เก็บ hash ของค่าสุ่ม จึงล็อกอินด้วยรหัสผ่านไม่ได้
      user = await prisma.user.create({
        data: {
          name: payload.name || email.split('@')[0],
          email,
          password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
          provider: 'google',
          providerId: payload.sub,
          emailVerifiedAt: new Date(),
        },
      });
    }
    if (user.banned) throw new HttpError(403, 'Account is banned');
    if (guestId) await mergeGuestCart(guestId, user.id);
    res.json({ token: signToken({ id: user.id, userType: user.userType }), user: publicUser(user) });
  }),
);
