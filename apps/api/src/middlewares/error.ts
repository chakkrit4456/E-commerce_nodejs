import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err); // eslint-disable-line no-console
  res.status(500).json({ error: 'Internal server error' });
}
