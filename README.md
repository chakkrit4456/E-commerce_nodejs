# JITD eCommerce (Node.js) — MVP

ระบบร้านค้าออนไลน์ตามเอกสารใน [`E-commerce_nodejs/`](E-commerce_nodejs/README.md): **Express + TypeScript + Prisma** (API) และ **Next.js 14 + Tailwind** (หน้าร้าน + แอดมิน)

## รันบนเครื่อง

ต้องมี Node.js 20+ (ทดสอบบน Node 24). ไม่ต้องติดตั้ง MySQL/Redis — dev ใช้ SQLite และ in-memory cache

```bash
npm install
cp apps/api/.env.example apps/api/.env      # ถ้ายังไม่มี
npm run db:setup                            # สร้างตาราง + seed ข้อมูลตัวอย่าง
npm run dev                                 # รัน API (:4000) + เว็บ (:3000) พร้อมกัน
# หรือแยกเทอร์มินัล: npm run dev:api  /  npm run dev:web  (ต้องรัน API ด้วย ไม่งั้นหน้าเว็บจะขึ้น ECONNREFUSED)
```

บัญชีตัวอย่าง (จาก seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin1234 |
| Staff (Order Manager) | staff@example.com | staff1234 |
| Customer | customer@example.com | customer1234 |

คูปองตัวอย่าง `WELCOME10` (10%, ขั้นต่ำ 20). แอดมินอยู่ที่ `/admin`.

ทดสอบ: `npm test` (Vitest + Supertest, 25 เทสต์ ใช้ฐานข้อมูล `test.db` แยกจาก dev) · type-check: `npm run typecheck -w apps/api` / `-w apps/web`

## สถานะ MVP

**ทำแล้ว**
- หน้าแรกตรงตามภาพ: Top bar (ภาษา/สกุลเงิน/Login), Header + live search (debounce 300ms) + badge Compare/Wishlist/Cart, Categories sidebar + mega menu, Hero slider (Swiper, autoplay 5s), Featured 8 หมวด, Todays Deal, Promo 3 ช่อง, Flash sale + countdown, Best selling, responsive + bottom nav
- Listing (filter/sort/pagination), Product detail (variant, รีวิว, related, schema.org), Cart (guest → merge หลัง login), Coupon, Checkout แบบ guest/สมาชิก (COD), Order success, Compare, Wishlist, บัญชีลูกค้า (ประวัติ + ขอคืนเงิน), หน้า static, Contact, Newsletter
- ราคา/ส่วนลด/ภาษี/flash deal/coupon คำนวณฝั่ง server ที่เดียว (`PricingService`, `decimal.js`), สร้างออเดอร์ใน transaction + ตัดสต็อกแบบ atomic, ยกเลิกแล้วคืนสต็อก
- Auth (JWT, bcrypt, rate limit login 5/นาที), RBAC (admin / staff + permission)
- Admin: Dashboard (KPI + กราฟ), Products (CRUD + toggle Todays Deal/Featured/Published), Orders (สถานะ + ประวัติ + tracking), Customers (ban), Reviews, Coupons, Home Page Settings (สี, sliders, featured categories, banners) — แก้แล้วหน้าแรกเปลี่ยนทันที (ล้าง cache อัตโนมัติ)
- อัปโหลด/แก้ไขรูปสินค้าในแอดมิน (`/admin/products` → Add New / ไอคอนดินสอ): อัปโหลดหลายรูป, เปลี่ยนรูป, ลบ, ตั้งรูปหลัก (สูงสุด 10 รูป, 5MB/รูป, JPG/PNG/WebP/GIF; ตรวจ magic bytes ไม่รับ SVG) ไฟล์เก็บใน `apps/api/uploads/` (ตั้ง `UPLOAD_DIR` ได้)
- สินค้าตัวอย่าง 16 ชิ้นใช้ภาพจริงจาก Wikimedia Commons/Openverse (CC0 / CC BY / CC BY-SA) เก็บใน `apps/api/prisma/seed/images/` พร้อม `credits.json`; ชื่อ/รายละเอียดเขียนจากสิ่งที่เห็นในภาพ และหน้าสินค้าแสดงเครดิตผู้ถ่าย ราคา/สต็อกเป็นค่าสมมติ ดาวน์โหลดใหม่ได้ด้วย `npm run seed:images -w apps/api`
- Prisma schema ตาม `04-Data-Schema.md` + seed ตามภาพ (12 หมวด, 8 featured, USD 3 ทศนิยม, todays deal, sliders, banners)

**ยังไม่ทำ / ต่างจากเอกสาร** (ทำไม่ได้หรือทดสอบจริงไม่ได้ในเครื่องนี้)
- Payment gateway (Stripe/PayPal/Omise) + webhook, ส่งอีเมล/SMS, BullMQ jobs, Meilisearch (ตอนนี้ค้นด้วย SQL `LIKE`), S3/Media library + `sharp`, PDF invoice (ใช้ print ของเบราว์เซอร์), social login / อีเมลยืนยัน / forgot password, 2FA, Sentry, CI/Docker deploy
- แอดมินยังไม่มี UI สำหรับ Categories/Brands/Attributes, Flash deals, Staff & Roles, Reports/Export Excel, CMS pages, Shipping zones, Payment/SMTP settings, Activity log (API บางส่วนมีแล้ว)
- ฐานข้อมูล: dev ใช้ SQLite และ `id` เป็น Int (แทน BigInt); Json fields เป็น optional. สำหรับ MySQL เปลี่ยน `provider = "mysql"` ใน `apps/api/prisma/schema.prisma`, ตั้ง `DATABASE_URL` แล้วรัน `docker compose up -d` (ยังไม่ได้ทดสอบกับ MySQL จริง)
- Cache เป็น in-memory (interface เดียวกับที่จะสลับเป็น Redis) · รูป Slider/Banner/Featured tiles ยังเป็น SVG placeholder จาก `/api/img/...` (รูปสินค้าเป็นภาพจริงแล้ว) · ใช้ `<img>` แทน `next/image` · ใช้ Vitest แทน Jest · ใช้ npm workspaces แทน pnpm/Turborepo · ยังไม่ได้ตั้ง ESLint/Prettier/Husky
- i18n: มีพจนานุกรม en/th สำหรับข้อความหลักเท่านั้น
