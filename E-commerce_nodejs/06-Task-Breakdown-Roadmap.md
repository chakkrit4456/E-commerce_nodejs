# 06 — Task Breakdown / Roadmap
**ระยะเวลารวมโดยประมาณ:** 14 สัปดาห์ (ทีม: 2 Backend, 1 Frontend, 1 UI/UX, 1 QA)

## สถานะการพัฒนา (MVP)
ทำแล้วใน `apps/api` + `apps/web` — วิธีรันและสิ่งที่ยังไม่ทำดูที่ [README](README.md). ข้อที่ติ๊ก [x] คือทำแล้ว (ข้อความ _(…)_ ท้ายบรรทัดคือขอบเขตที่ทำจริง)

## Milestone Overview
| Phase | สัปดาห์ | Deliverable |
|---|---|---|
| 0. Setup & Design | 1–2 | Repo, CI, Design system, Figma |
| 1. Core Backend & Admin Foundation | 3–4 | Auth, Roles, Media, Settings, Catalog CRUD |
| 2. Storefront Homepage (ตามภาพ) | 5–6 | Header, Sidebar, Slider, Featured, Todays Deal, Banners |
| 3. Catalog & Search | 7 | Listing, Product detail, Live search |
| 4. Cart / Checkout / Payment | 8–9 | Cart, Compare, Wishlist, Checkout, Gateways |
| 5. Orders & Customer Area | 10 | Admin orders, Customer dashboard, Refund |
| 6. Marketing & Reports | 11–12 | Flash deal, Coupon, Reports, Dashboard |
| 7. QA, Performance, Launch | 13–14 | Test, SEO, Optimize, Deploy |

## Phase 0 — Setup & Design (W1–2)
- [ ] ตั้ง pnpm workspaces + Turborepo, Node.js 20 LTS, Next.js 14 (storefront/admin), Express API, Tailwind
- [ ] ตั้ง ESLint, Prettier, Husky + lint-staged, Jest, Playwright, GitHub Actions
- [ ] ออกแบบ Design tokens + Figma หน้าแรก/หน้าหลัก (ตาม 07-UI-UX)
- [x] เขียน Prisma schema ทั้งหมดตาม 04-Data-Schema + migration แรก _(ใช้ SQLite ใน dev (สลับ provider เป็น mysql ได้), id เป็น Int; ตารางนอก MVP ยังไม่ครบ)_
- [x] Seeder ข้อมูลตัวอย่างตามภาพ (`prisma db seed`)

## Phase 1 — Core Backend & Admin (W3–4)
- [ ] Auth (NextAuth.js: customer + admin แยก provider/guard), Email verify, Forgot password
- [x] Roles & Permissions (RBAC/CASL) + Staff CRUD _(RBAC + permission middleware แล้ว; ยังไม่มีหน้า Staff CRUD)_
- [x] Admin layout (sidebar, topbar, data table component แบบ React)
- [ ] Media library (upload ผ่าน `multer`, resize WebP ด้วย `sharp`, picker modal)
- [x] Business settings + helper `getSetting()` + Redis cache _(in-memory cache (สลับเป็น Redis ได้))_
- [x] Languages + Translation editor, Currencies + `formatPrice()` _(currencies/formatPrice + พจนานุกรม en/th; ยังไม่มี editor)_
- [x] Categories (tree 3 ระดับ, icon, featured), Brands, Attributes, Colors _(API ครบ; ยังไม่มี UI จัดการหมวด)_
- [x] Products CRUD + variant matrix + SEO + toggle Featured/Todays Deal + Import/Export (exceljs) _(CRUD + toggle Featured/Todays Deal; variant matrix และ Import/Export ยังไม่ทำ)_

## Phase 2 — Storefront Homepage (W5–6)
- [x] Layout หลัก + Top bar (Language/Currency dropdown, Login/Registration)
- [x] Header: Logo, Search bar, Compare/Wishlist/Cart icons + badge (React state ผ่าน Zustand)
- [x] Categories sidebar + Mega menu hover + "See All" page
- [x] Hero slider (Swiper React) + Admin Home settings: sliders
- [x] Featured categories strip (8) + Admin เลือก/เรียง
- [x] Todays Deal panel (scroll แนวตั้ง, Hot badge)
- [x] Promo banners 3 ช่อง + Admin
- [x] Section เพิ่มเติม: Flash sale, Best selling, Category rows, Brands, Footer _(ยังไม่มี Category rows/Brands section)_
- [x] Responsive ทุก breakpoint + Mobile bottom nav
- [x] Cache หน้าแรกใน Redis (ISR/`revalidateTag` ของ Next.js เสริม) + ล้างเมื่อแก้ settings _(in-memory cache ล้างเมื่อแก้ settings/สินค้า)_

## Phase 3 — Catalog & Search (W7)
- [x] Product listing: filter (หมวด, ราคา, แบรนด์, สี, attribute), sort, pagination _(ยังไม่มี filter สี/attribute)_
- [x] Product detail: gallery zoom, variant select, stock, related products, reviews _(ยังไม่มี zoom)_
- [ ] Meilisearch (JS SDK) + index job (BullMQ), Live search dropdown, Search results page
- [ ] บันทึก search keyword สำหรับรายงาน

## Phase 4 — Cart / Checkout / Payment (W8–9)
- [x] CartService (guest tempUserId + merge หลัง login), Mini-cart _(guest tempUserId + merge หลัง login; ยังไม่มี mini-cart dropdown)_
- [x] Compare (max 3) + หน้าเปรียบเทียบ, Wishlist
- [x] Checkout 3 steps: Address → Shipping → Payment _(หน้าเดียว 3 ส่วน + guest checkout)_
- [x] Shipping calculation (free/flat/zone), Pickup point _(free/flat; ยังไม่มี zone/pickup point)_
- [x] Coupon apply/remove
- [ ] Payment: COD, Bank transfer (upload slip), Stripe SDK, PayPal SDK, Omise PromptPay + webhook
- [x] placeOrderAction (Prisma `$transaction` + row lock), Order success, Email (Nodemailer) _(transaction + ตัดสต็อกแบบ atomic; ยังไม่ส่งอีเมล)_

## Phase 5 — Orders & Customer Area (W10)
- [x] Admin Orders: list/filter, detail, update status + history, invoice PDF (Puppeteer/@react-pdf), tracking _(ยังไม่มี PDF invoice (ใช้ print ของเบราว์เซอร์) และแจ้งเตือนอีเมล)_
- [ ] Notifications (email/SMS) เมื่อสถานะเปลี่ยน (BullMQ job)
- [x] Customer dashboard: orders, addresses, profile, reviews, wishlist _(ประวัติคำสั่งซื้อ + ขอคืนเงิน; ที่อยู่ผ่าน API)_
- [x] Refund request (customer) + อนุมัติ (admin)
- [x] Customers management (ban, impersonate) _(ban/unban; ยังไม่มี impersonate)_
- [x] Review moderation

## Phase 6 — Marketing & Reports (W11–12)
- [x] Flash deals (countdown บนหน้าร้าน, node-cron/BullMQ repeatable job ปิดอัตโนมัติ) _(ตรวจช่วงเวลาตอน query แทน cron)_
- [x] Coupons CRUD + usage limit
- [x] Newsletter + subscribers
- [x] Admin Dashboard (KPI cards, chart 12 เดือน ด้วย Recharts, top products, low stock)
- [ ] Reports + Export Excel (exceljs)
- [x] CMS Pages, Contact messages _(แสดงผล + contact form; ยังไม่มี admin editor)_
- [ ] Payment/SMTP/SMS/Social login/Analytics settings
- [ ] Activity log, Cache clear, Backup

## Phase 7 — QA & Launch (W13–14)
- [ ] Jest/Testing Library/Playwright tests ครอบ critical path
- [ ] Security review (OWASP), penetration test เบื้องต้น
- [ ] SEO: sitemap (`next-sitemap`), schema.org, meta, canonical
- [ ] Performance: Lighthouse ≥ 90 (desktop), ≥ 80 (mobile), CDN, image optimize (`next/image` + sharp)
- [ ] UAT กับเจ้าของร้าน, แก้ bug
- [ ] Deploy production (Docker + PM2/Kubernetes), monitoring (Sentry), backup schedule
- [ ] คู่มือแอดมิน

## Backlog (เฟสถัดไป)
Multi-vendor seller, Mobile app (API), Club points / Wallet, Affiliate, POS, Live chat, Product Q&A, Blog
