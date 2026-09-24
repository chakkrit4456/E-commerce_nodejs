# 02 — Tech Stack & Architecture Document

## 1. Tech Stack
| Layer | เทคโนโลยี | เหตุผล |
|---|---|---|
| Backend Framework | **Express.js** (Node.js 20 LTS) | เบา, ยืดหยุ่น, ecosystem ใหญ่, เหมาะกับทีมที่ต้องการควบคุม middleware เอง |
| Language | **TypeScript** | Type safety ทั้ง backend/frontend, ลด runtime error |
| Frontend (Storefront) | **Next.js 14 (React) — App Router, SSR/ISR** | SSR ดีต่อ SEO เทียบเท่า Blade, React ecosystem ใหญ่, รองรับ interactivity เต็มรูปแบบ |
| Styling | Tailwind CSS 3 | ตรงกับ design tokens เดิมใน 07-UI-UX |
| Slider | Swiper.js (React wrapper) | Hero slider + Featured strip |
| Admin Panel | **Next.js (แยก route group `/admin`) + Tailwind** หรือแยกเป็นแอปย่อยในโมโนรีโป | CRUD เร็ว, ใช้ React component ร่วมกับ storefront ได้ |
| State/Data fetching | TanStack Query (React Query) + Zustand (client state เล็ก ๆ เช่น mini-cart) | จัดการ cache ฝั่ง client แทน Alpine.js |
| Build Tool | Next.js built-in (Turbopack/Webpack) + Vite (สำหรับ admin ถ้าแยกแอป) | |
| Database | **MySQL 8** | Relational, รองรับ JSON column (คงเดิมตาม 04-Data-Schema) |
| ORM | **Prisma ORM** | Type-safe query, migration file อ่านง่าย, generate client อัตโนมัติ |
| Cache / Queue / Session | **Redis 7** (ioredis) + **BullMQ** | Cache หน้าแรก, queue ส่งอีเมล/รูป/index search |
| Search | **Meilisearch** (ผ่าน `meilisearch` SDK) | Live search เร็ว, typo-tolerant (เหมือนเดิม เปลี่ยนแค่ SDK จาก Scout → JS client) |
| File Storage | Local (dev) / **S3-compatible** (prod) + CDN | รูปสินค้า/แบนเนอร์ (ใช้ `@aws-sdk/client-s3`) |
| Image Processing | **sharp** | Resize + WebP (แทน Intervention Image) |
| Auth | **NextAuth.js / Auth.js** (session, credentials + OAuth) + JWT (สำหรับ API mobile อนาคต) | Session สำหรับเว็บ, token สำหรับ API |
| Permission | Custom RBAC middleware หรือ **CASL** | Role/Permission ของ Staff (แทน spatie/laravel-permission) |
| Validation | **Zod** | Validate request body ทั้ง API route และฟอร์มฝั่ง client (แทน FormRequest) |
| PDF | **@react-pdf/renderer** หรือ Puppeteer (HTML→PDF) | Invoice |
| Excel | **exceljs** | Import/Export |
| Payment | Stripe SDK, PayPal SDK, Omise SDK (PromptPay), COD (custom) | |
| Mail | Nodemailer (SMTP) / Resend / SES SDK | |
| Testing | **Jest** + **Testing Library** (unit/component), **Playwright** (e2e) | |
| Code Quality | **ESLint** (`eslint-config-airbnb-typescript` หรือ custom) + **Prettier** | |
| CI/CD | GitHub Actions | lint → test → build → deploy |
| Server | Node.js process manager **PM2** หรือ Docker + Nginx reverse proxy | |
| Monitoring | Sentry (prod), pino/winston logger (dev/prod) | |
| Package Manager | pnpm (แนะนำ, เร็วและประหยัด disk ใน monorepo) | |
| Monorepo Tooling | Turborepo (ถ้าจำเป็นต้องแยก storefront/admin/API เป็นหลาย package) | |

## 2. High-Level Architecture
```
                ┌──────────────┐
  Browser ─────►│  CDN (images) │
     │          └──────────────┘
     ▼
┌──────────┐    ┌───────────────────────── Node.js App ─────────────────────────┐
│  Nginx   │───►│  Next.js (storefront + admin, App Router)  |  Express API      │
└──────────┘    │  Middleware: locale, currency, auth, role, rate-limit          │
                │  Route Handlers (thin) → Services → Prisma Client              │
                │  Event Emitter/Queue Producers → BullMQ Jobs                    │
                └───────┬───────────────┬──────────────┬──────────────┬──────┘
                        ▼               ▼              ▼              ▼
                    MySQL 8         Redis 7       Meilisearch     S3 Storage
                                 (cache/queue)
                        ▲
                 BullMQ Worker Process — email, invoice PDF, image resize (sharp), search index
                 Scheduler (node-cron / BullMQ repeatable jobs) — flash deal expire, currency rate sync, sitemap
```

## 3. โครงสร้างโฟลเดอร์ (Monorepo, pnpm workspaces + Turborepo)
```
apps/
├── web/                        (Next.js — storefront + admin route group)
│   ├── app/
│   │   ├── (storefront)/       (home, product, cart, checkout, ...)
│   │   ├── admin/              (dashboard, products, orders, ...)
│   │   └── api/                (Next.js Route Handlers สำหรับ BFF เล็ก ๆ ถ้าจำเป็น)
│   ├── components/             (ProductCard, CategorySidebar, TodaysDeal, HeroSlider)
│   ├── lib/                    (auth.ts, currency.ts, format-price.ts)
│   └── middleware.ts           (locale, currency, auth guard)
├── api/                        (Express.js — REST API หลัก)
│   ├── src/
│   │   ├── routes/             (frontend/, admin/)
│   │   ├── controllers/        (thin, รับ req → เรียก service → คืน JSON)
│   │   ├── services/           (CartService, CheckoutService, PricingService, CurrencyService, HomePageService)
│   │   ├── repositories/       (คลุม Prisma query ที่ซับซ้อน)
│   │   ├── actions/            (single-purpose เช่น placeOrderAction.ts)
│   │   ├── enums/               (orderStatus.ts, paymentStatus.ts, discountType.ts)
│   │   ├── middlewares/        (setLocale, setCurrency, isAdmin, validateRequest)
│   │   ├── jobs/                (BullMQ processors: email, invoice-pdf, image-resize, search-index)
│   │   ├── events/              (event emitter + listeners)
│   │   └── validators/          (Zod schema แทน FormRequest)
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
packages/
├── ui/                          (React component ที่ใช้ร่วมกัน storefront/admin)
├── config/                      (eslint-config, tsconfig, tailwind-config ที่ใช้ร่วมกัน)
└── shared/                      (types, zod schema, constants ที่ใช้ร่วมกันระหว่าง api และ web)
```

## 4. Request Flow ตัวอย่าง: โหลดหน้าแรก
1. `middleware.ts` (Next.js) อ่าน locale/currency จาก cookie แล้วส่งต่อผ่าน request header
2. หน้า `app/(storefront)/page.tsx` เรียก `HomePageService.getHomeData()` (ผ่าน internal API หรือเรียก service ตรงถ้าใช้ Server Component เรียก Prisma ได้เลย)
3. Service ดึงข้อมูลจาก Cache key `home:{locale}` (Redis, TTL 1 ชม.) — ถ้าไม่มีจึง query ผ่าน Prisma: categories (top-level), sliders, featured_categories, todays_deal products, promo banners
4. แปลงราคาด้วย `formatPrice()` ตอน render (ไม่ cache ราคาที่แปลงแล้ว)
5. Admin แก้ Home settings → emit event `home-settings.updated` → BullMQ job ล้าง cache Redis

## 5. API (สำหรับ Storefront เรียกผ่าน fetch/React Query)
| Method | Endpoint | ใช้ทำ |
|---|---|---|
| GET | `/api/search?q=` | Live search |
| POST | `/api/cart/add` | เพิ่มสินค้า → คืน count + mini-cart JSON |
| POST | `/api/cart/update` / `/api/cart/remove` | |
| POST | `/api/compare/toggle` | |
| POST | `/api/wishlist/toggle` | (auth) |
| POST | `/api/currency/change` / `/api/language/change` | |
| GET | `/api/category/:id/children` | Mega menu |

## 6. Security
- Admin route อยู่ใต้ prefix `/admin` + middleware `requireAuth`, `requireRole(['admin','staff'])`, `requirePermission(...)`
- Rate limit: `express-rate-limit` — login 5/min, search 60/min, cart 30/min
- Payment webhook ตรวจ signature ทุกครั้ง (stripe-signature ฯลฯ); ราคาคำนวณฝั่ง server เสมอ (Prisma + PricingService)
- File upload: `multer` + whitelist mime (jpg, png, webp, svg sanitize ด้วย `dompurify`/`svg-sanitizer`), max 5MB
- Validate input ทุก endpoint ด้วย Zod schema ก่อนเข้า controller

## 7. Deployment
- Environments: local (Docker Compose) → staging → production
- Zero-downtime deploy: PM2 `reload` หรือ container orchestration (ECS/Kubernetes) + rolling update
- `next build` + `prisma migrate deploy` ใน CI step ก่อน deploy, restart BullMQ worker process
- Backup DB รายวัน เก็บ 14 วัน
