import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http';

export interface AuthUser {
  id: number;
  userType: 'admin' | 'staff' | 'customer';
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export const signToken = (u: AuthUser): string => jwt.sign(u, config.jwtSecret, { expiresIn: '7d' });

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(h.slice(7), config.jwtSecret) as AuthUser;
    } catch {
      /* token ไม่ถูกต้อง → ถือเป็น guest */
    }
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  next();
}

export const requireRole =
  (...roles: AuthUser['userType'][]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new HttpError(401, 'Authentication required'));
    if (!roles.includes(req.user.userType)) return next(new HttpError(403, 'Forbidden'));
    next();
  };

/** admin ผ่านทุกสิทธิ์; staff ต้องมี permission ผ่าน role */
export const requirePermission =
  (key: string) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new HttpError(401, 'Authentication required');
      if (req.user.userType === 'admin') return next();
      if (req.user.userType !== 'staff') throw new HttpError(403, 'Forbidden');
      const n = await prisma.rolePermission.count({
        where: { permission: { key }, role: { users: { some: { userId: req.user.id } } } },
      });
      if (!n) throw new HttpError(403, 'Missing permission');
      next();
    } catch (e) {
      next(e);
    }
  };
