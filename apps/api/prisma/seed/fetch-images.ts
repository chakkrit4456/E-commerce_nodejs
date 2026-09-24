/**
 * ดาวน์โหลดรูปสินค้าจริง (Wikimedia Commons / Openverse — CC0, CC BY, CC BY-SA) ตาม images-manifest.json
 * ย่อเป็น JPEG ไม่เกิน 1200px แล้วเก็บใน prisma/seed/images/ พร้อม credits.json สำหรับให้เครดิตผู้ถ่าย
 * รัน: npm run seed:images -w apps/api   (ต้องต่ออินเทอร์เน็ต; seed ปกติใช้ไฟล์ที่ดาวน์โหลดไว้แล้ว ไม่ต้องรันซ้ำ)
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

interface Img { src: string; title: string; license: string; author: string; page: string }
interface Entry { slug: string; images: Img[] }

const dir = path.resolve(__dirname);
const outDir = path.join(dir, 'images');
const manifest: Entry[] = JSON.parse(fs.readFileSync(path.join(dir, 'images-manifest.json'), 'utf8'));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function download(url: string): Promise<Buffer> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'ecom-demo-seed/1.0 (cai@rvc.ac.th)' }, redirect: 'follow' });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status === 429 || res.status >= 500) await sleep(3000 * (attempt + 1));
    else throw new Error(`${res.status} ${url}`);
  }
  throw new Error(`Gave up: ${url}`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const credits: Record<string, { file: string; license: string; author: string; page: string }[]> = {};
  for (const p of manifest) {
    credits[p.slug] = [];
    for (const [i, img] of p.images.entries()) {
      const file = `${p.slug}-${i + 1}.jpg`;
      const target = path.join(outDir, file);
      if (!fs.existsSync(target)) {
        const buf = await download(img.src);
        await sharp(buf).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(target);
        console.log('saved', file);
        await sleep(1200);
      }
      credits[p.slug].push({ file, license: img.license.toUpperCase().replace(/\s+/g, ' '), author: img.author || 'Unknown', page: img.page });
    }
  }
  fs.writeFileSync(path.join(outDir, 'credits.json'), JSON.stringify(credits, null, 1));
}

main().catch((e) => { console.error(e); process.exit(1); });
