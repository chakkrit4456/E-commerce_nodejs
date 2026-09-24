import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next: NextFunction) => {
    fn(req, res).catch(next);
  };

export const idParam = (req: Request, name = 'id'): number => {
  const n = Number(req.params[name]);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `Invalid ${name}`);
  return n;
};

export const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9฀-๿]+/g, '-').replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
