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
