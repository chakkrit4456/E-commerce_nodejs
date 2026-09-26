import 'dotenv/config';

// WEB_HOST มาจาก Render blueprint (fromService) กรณีไม่ได้ตั้ง WEB_ORIGIN ตรง ๆ
const webOrigin = process.env.WEB_ORIGIN
  ?? (process.env.WEB_HOST ? `https://${process.env.WEB_HOST}` : 'http://localhost:3000');

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  webOrigin,
  // OAuth Client ID (Web application) จาก Google Cloud Console; ว่าง = ปิด login ผ่าน Google
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
};
