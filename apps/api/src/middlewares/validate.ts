import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { HttpError } from '../lib/http';

export const validate =
  <T extends ZodTypeAny>(schema: T, source: 'body' | 'query' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const r = schema.safeParse(req[source]);
    if (!r.success) return next(new HttpError(400, r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')));
    (req as Request & { data: z.infer<T> }).data = r.data;
    next();
  };

// T ระบุเองได้ที่จุดเรียกใช้; ถ้าไม่ระบุ ค่าถูก validate โดย schema ใน middleware แล้ว
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const data = <T = any>(req: Request): T => (req as Request & { data: T }).data;
