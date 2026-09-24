import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma';
import { HttpError, wrap } from '../lib/http';
import { optionalAuth, requirePermission, requireRole } from '../middlewares/auth';

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'));
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/** ตรวจชนิดไฟล์จาก magic bytes (ไม่เชื่อ mimetype/นามสกุลที่ client ส่งมา); ไม่รับ SVG เพื่อกัน XSS */
export function sniffImage(buf: Buffer): { ext: 'jpg' | 'png' | 'webp' | 'gif'; mime: string } | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', mime: 'image/png' };
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  if (buf.length > 6 && ['GIF87a', 'GIF89a'].includes(buf.toString('ascii', 0, 6))) return { ext: 'gif', mime: 'image/gif' };
  return null;
}

export const saveImage = async (buf: Buffer, originalName: string, userId?: number) => {
  const kind = sniffImage(buf);
  if (!kind) throw new HttpError(400, 'Only JPG, PNG, WebP or GIF images are allowed');
  const fileName = `${crypto.randomUUID()}.${kind.ext}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, fileName), buf);
  const row = await prisma.upload.create({
    data: { userId, fileOriginalName: originalName.slice(0, 200), fileName: `/uploads/${fileName}`, extension: kind.ext, type: 'image', fileSize: buf.length },
  });
  return { id: row.id, url: row.fileName, name: row.fileOriginalName, size: row.fileSize };
};

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 10 } });

export const uploadsRouter = Router();
uploadsRouter.use(optionalAuth, requireRole('admin', 'staff'));

// อัปโหลดได้ทีละหลายไฟล์ (field: files) สูงสุด 5MB/ไฟล์
uploadsRouter.post(
  '/',
  requirePermission('products.manage'),
  (req, res, next) =>
    upload.array('files', 10)(req, res, (err) => {
      if (err instanceof multer.MulterError) return next(new HttpError(400, err.code === 'LIMIT_FILE_SIZE' ? 'File is larger than 5MB' : err.message));
      next(err);
    }),
  wrap(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) throw new HttpError(400, 'No files uploaded');
    const saved = [];
    for (const f of files) saved.push(await saveImage(f.buffer, f.originalname, req.user!.id));
    res.status(201).json(saved);
  }),
);
