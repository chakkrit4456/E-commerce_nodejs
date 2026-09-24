# 05 — Coding Style & Rules

## 1. มาตรฐานทั่วไป
- TypeScript ทุกไฟล์ (`.ts` / `.tsx`) — ห้ามใช้ `.js` ในโค้ดใหม่, เปิด `strict: true` ใน `tsconfig.json`
- **ESLint** (`eslint-config-airbnb-typescript` + `eslint-plugin-react` + `eslint-plugin-react-hooks`) + **Prettier** (รันก่อน commit ผ่าน `lint-staged` + `husky`)
- Static analysis: `tsc --noEmit` ต้องผ่านใน CI (ไม่มี `any` แบบไม่จำเป็น, ห้าม `// @ts-ignore` โดยไม่มีคอมเมนต์อธิบาย)
- ใช้ type/interface + return type ทุกฟังก์ชันสาธารณะ (public export)
- ห้าม commit `console.log()`, `debugger`, `console.debug()` (ยกเว้นใน logger service ที่ตั้งใจ)

## 2. Naming Convention
| สิ่ง | รูปแบบ | ตัวอย่าง |
|---|---|---|
| Class / React Component | PascalCase เอกพจน์ | `Product`, `FlashDeal`, `ProductCard.tsx` |
| Prisma Model / Table | PascalCase เอกพจน์ (model) / snake_case พหูพจน์ (@@map) | `model Product { @@map("products") }` |
| Column (field) | camelCase ใน Prisma / snake_case ใน DB (`@map`) | `unitPrice` → `@map("unit_price")` |
| Controller / Route module | camelCase + Controller/Router | `admin/productController.ts`, `productRouter.ts` |
| Function / Variable | camelCase | `addToCart()`, `grandTotal` |
| React Hook | `use` + PascalCase | `useCart()`, `useCurrency()` |
| Route path | kebab-case | `/admin/products`, `/cart/add` |
| Next.js file/route segment | kebab-case (folder), `page.tsx`/`route.ts` | `app/product-detail/[slug]/page.tsx` |
| Config / Setting key | snake_case (เก็บใน DB เหมือนเดิม) | `todays_deal_enabled` |
| Enum | PascalCase + member PascalCase | `enum OrderStatus { OnTheWay }` |
| CSS custom class (Tailwind) | kebab-case, prefix `ae-` | `ae-product-card` |
| ไฟล์ทั่วไป (non-component) | kebab-case | `pricing-service.ts`, `format-price.ts` |

## 3. สถาปัตยกรรมโค้ด
- **Thin Controller/Route Handler:** รับ Request → validate ด้วย Zod → เรียก Service/Action → คืน JSON/Response (ไม่เกิน ~20 บรรทัด/handler)
- **Validation:** ใช้ **Zod schema** เสมอ (`validators/*.schema.ts`) ห้าม validate ใน controller โดยตรง
- **Business logic:** อยู่ใน `services/` หรือ `actions/` (เช่น `placeOrderAction.ts`)
- **Authorization:** ใช้ middleware `requireRole()` / `requirePermission()` (RBAC/CASL) — ห้ามเช็ค role ใน controller ตรง ๆ
- **ราคา:** คำนวณผ่าน `PricingService` ที่เดียว (discount, flash deal, tax) — ห้ามคำนวณใน React component/JSX
- **สกุลเงิน:** ใช้ helper `formatPrice(amount, currency)` ทุกที่ที่แสดงราคา
- **ข้อความ:** ทุกข้อความ UI ต้องผ่านระบบ i18n (`next-intl` หรือ `i18next`) ห้าม hardcode string
- **Settings:** อ่านผ่าน `getSetting('key')` (มี cache ใน Redis)
- **Query:** ป้องกัน N+1 ด้วย Prisma `include`/`select`; เปิด query logging ใน local เพื่อตรวจสอบ
- **Transaction:** การสร้าง order, ตัดสต็อก, ชำระเงิน ต้องอยู่ใน `prisma.$transaction()` พร้อม row lock (`SELECT ... FOR UPDATE` ผ่าน `$queryRaw` เมื่อจำเป็น)
- **Money:** ใช้ Prisma `Decimal` type + library `decimal.js` ห้ามใช้ `number` (float) คำนวณเงิน
- **Queue:** งานช้า (อีเมล, PDF, resize รูป, index search) ต้องเป็น BullMQ Job (`jobs/*.processor.ts`)

## 4. Frontend (Next.js / React)
- แยก component: `<ProductCard />`, `<CategorySidebar />`, `<TodaysDeal />`, `<HeroSlider />`, `<PromoBanners />`
- Tailwind utility-first; ค่าสี/spacing ใช้จาก `tailwind.config.ts` (tokens ใน 07-UI-UX) ห้าม hex ตรงใน JSX
- รูปทุกรูปใช้ `next/image` ต้องมี `alt`, `loading="lazy"` (ยกเว้นสไลด์แรกใช้ `priority`), กำหนด `width/height`
- ใช้ React Server Component เป็นค่าเริ่มต้น, ใส่ `"use client"` เฉพาะ component ที่ต้อง interactive (cart, search dropdown, slider)
- Client state เล็ก ๆ (mini-cart, modal) ใช้ Zustand; data fetching/cache ใช้ TanStack Query, AJAX ใช้ `fetch` + CSRF token header
- ห้าม inline style ยกเว้นค่าที่มาจาก DB (เช่น flash deal bg color) — ใช้ `style={{ backgroundColor }}` เฉพาะกรณีนี้

## 5. Database & Migration
- ห้ามแก้ Prisma migration ที่ merge แล้ว → สร้าง migration ใหม่ด้วย `prisma migrate dev --name xxx`
- ทุก FK ต้องมี `@relation` พร้อม index และกำหนด `onDelete` ชัดเจนใน `schema.prisma`
- Seeder แยกไฟล์ตามโมดูลใน `prisma/seed/`; `demoSeeder.ts` สำหรับข้อมูลตามภาพ (รันผ่าน `prisma db seed`)

## 6. Git Workflow
- Branch: `main` (prod), `develop`, `feature/xxx`, `fix/xxx`, `hotfix/xxx`
- Commit: **Conventional Commits** — `feat(cart): add mini cart dropdown`, `fix(order): ...`
- PR ต้องมี: คำอธิบาย, screenshot (ถ้าเป็น UI), test ผ่าน (CI), reviewer ≥ 1

## 7. Testing
- **Jest + Testing Library**: unit/component test ครอบ flow สำคัญ (add to cart, checkout, coupon, order status, permission)
- Unit test: `PricingService`, `CurrencyService`, `CouponService`
- Coverage เป้าหมาย ≥ 70% ใน `services/` และ `actions/`
- **Playwright**: e2e หน้าแรก, search, checkout

## 8. Security Rules
- ห้ามเชื่อราคา/ยอดจาก client — คำนวณใหม่ฝั่ง server เสมอ
- Escape output ใน JSX เป็นค่าเริ่มต้นของ React; ใช้ `dangerouslySetInnerHTML` เฉพาะ HTML ที่ผ่าน sanitizer (`dompurify`)
- เก็บ secret ใน `.env` เท่านั้น (ไม่ commit); API key ใน DB ต้องเข้ารหัสด้วย `crypto` ก่อนบันทึก
- Log ห้ามมีข้อมูลบัตร/รหัสผ่าน (ใช้ `pino` redact fields)
- Validate + sanitize ทุก input ด้วย Zod ก่อนเข้าสู่ business logic

## 9. Documentation
- JSDoc/TSDoc สำหรับฟังก์ชันสาธารณะที่ซับซ้อน
- อัปเดต `CHANGELOG.md` ทุก release
