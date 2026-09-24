import { execSync } from 'node:child_process';

// สร้าง test.db แยกจาก dev.db แล้ว seed ข้อมูลใหม่ทุกครั้งที่รันเทสต์
export default function setup(): void {
  const env = { ...process.env, DATABASE_URL: 'file:./test.db', UPLOAD_DIR: './uploads-test' };
  execSync('npx prisma db push --skip-generate --accept-data-loss', { env, stdio: 'ignore' });
  execSync('npx tsx prisma/seed/demoSeeder.ts', { env, stdio: 'ignore' });
}
