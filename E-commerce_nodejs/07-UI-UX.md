# 07 — UI/UX Specification (อ้างอิงจากภาพ)

## 1. Design Principles
- **Marketplace-dense:** ข้อมูลเยอะในพื้นที่แรก (above the fold) — หมวดหมู่ + โปรโมชัน + ดีลวันนี้ อยู่ในสายตาทันที
- **Orange = Action:** สีส้มแดงใช้กับสิ่งที่คลิก/ดึงดูด (ปุ่มค้นหา, badge, ราคา, Todays Deal)
- **Card on light gray:** ทุก section เป็นการ์ดพื้นขาววางบนพื้นเทาอ่อน

## 2. Color Tokens
| Token | Hex | ใช้ที่ |
|---|---|---|
| `primary` | `#E62E04` | ปุ่ม Search, badge ตัวเลข, ราคา, dot slider active, ขอบ Todays Deal |
| `primary-hover` | `#C42703` | hover ปุ่ม |
| `primary-soft` | `#FDE3DC` | พื้นหัวกล่อง "Categories" และ "Todays Deal" |
| `hot` | `#E62E04` / text white | ป้าย Hot |
| `bg-body` | `#F2F3F8` | พื้นหลังหน้า |
| `surface` | `#FFFFFF` | การ์ด, header, top bar |
| `text-primary` | `#1B1B28` | หัวข้อ |
| `text-secondary` | `#4A4A5A` | รายการหมวดหมู่ |
| `text-muted` | `#8A8A9A` | placeholder, ข้อความใต้ไอคอน header, top bar |
| `border` | `#E6E7EB` | เส้นขอบ search, การ์ด |
| `success` | `#0ABB75` | สถานะสำเร็จ |
| `warning` | `#FFA707` | |
| `danger` | `#EF486A` | |
> สีหลักตั้งค่าได้จากหลังบ้าน (Appearance → Base color) และ inject เป็น CSS variable `--primary` ผ่าน `tailwind.config.ts` + `globals.css` (Next.js อ่านค่าจาก `business_settings` ตอน render layout root)

## 3. Typography
- Font: **Open Sans** (fallback: `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif`) — โหลดผ่าน `next/font`
- ภาษาไทย: **Noto Sans Thai** / Prompt

| Style | Size / Weight | ใช้ที่ |
|---|---|---|
| H-section | 16px / 700 | "Categories", "Todays Deal" |
| Body | 13–14px / 400 | รายการหมวดหมู่, top bar |
| Caption | 12px / 400 | ชื่อใต้ Featured card, ข้อความใต้ไอคอน header |
| Price | 15px / 700, color primary | Todays Deal |
| Badge | 10px / 700 white | ตัวเลขบนไอคอน |

## 4. Spacing, Radius, Shadow
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32
- Container: max-width 1320px, padding 15px
- Gap ระหว่างคอลัมน์ / section: 16px
- Radius: การ์ด 4px, search input 4px, badge/arrow = full circle
- Shadow: `0 1px 3px rgba(0,0,0,.06)` สำหรับการ์ด; hover `0 6px 16px rgba(0,0,0,.10)`

## 5. Component Specs
> แต่ละหัวข้อด้านล่างจับคู่กับ React component ใน `apps/web/components/` ตามชื่อในวงเล็บ (ดู 02-Tech-Stack-Architecture)

### 5.1 Top Bar (`<TopBar />`)
- สูง 32px, พื้นขาว, border-bottom `border`, ข้อความ 12px `text-muted`
- ซ้าย: ธง 16×11 + "English ▾" | "U.S. Dollar $ ▾" — dropdown เงาเล็ก (React state, ไม่ reload หน้า)
- ขวา: "Login" "Registration" (hover → primary)

### 5.2 Header (`<Header />`)
- สูง ~80px, พื้นขาว, sticky เมื่อ scroll (ย่อเหลือ 64px + shadow, ใช้ `useEffect` + scroll listener หรือ `IntersectionObserver`)
- โลโก้ สูง 40px (ไอคอนถุงช้อปปิ้งสีส้ม + ข้อความสีส้ม + tagline ตัวเล็ก)
- Search: สูง 40px, กว้าง ~45% ของ container, input ขอบ 1px `border`, ปุ่มขวา 40×40 พื้น `primary` ไอคอนแว่นขยายสีขาว
- Icon group (Compare ⟳, Wishlist ♡, Cart 🛒): ไอคอน 22px เส้น `text-primary`, badge วงกลม 16px `primary` มุมขวาบน, label 12px `text-muted` ใต้/ข้างไอคอน — จำนวน badge มาจาก Zustand store (`useCartStore`, `useWishlistStore`, `useCompareStore`)

### 5.3 Categories Sidebar (`<CategorySidebar />`)
- การ์ดขาว; หัวกล่องพื้น `primary-soft` สูง 44px: "Categories" (16/700) + "See All >" (12px)
- แต่ละรายการสูง 24px, ไอคอนเส้น 14px สีเทา + ข้อความ 13px
- Hover: ข้อความ `primary` + เปิด Mega menu ทางขวา (กว้างเท่า Slider, แบ่งคอลัมน์หมวดย่อย) — โหลดข้อมูลผ่าน TanStack Query (`/api/category/:id/children`)

### 5.4 Hero Slider (`<HeroSlider />`, Swiper React)
- อัตราส่วน ~ 2.5:1 (แนะนำรูป 1100×440), radius 4px
- ปุ่มลูกศร: วงกลมขาว 36px ไอคอน ‹ › สีเทาเข้ม, ห่างขอบ 16px, แสดงตลอด (desktop)
- Dots: 8px, ห่าง 6px, active = `primary`, inactive = ขาวโปร่ง 60%
- Transition slide 500ms, autoplay 5s

### 5.5 Featured Categories Strip (`<FeaturedCategories />`)
- 8 การ์ดเท่ากัน สูง ~80px, พื้นขาว, radius 4px
- รูปสินค้าไม่มีพื้นหลัง (PNG/WebP ผ่าน `next/image`) ขนาด ~48px กึ่งกลาง + ชื่อ 12px บรรทัดเดียว `text-overflow: ellipsis`
- Hover: ยกขึ้น 2px + shadow

### 5.6 Todays Deal (`<TodaysDeal />`)
- หัวกล่องพื้น `primary-soft`: "Todays Deal" + ป้าย "Hot" (พื้น primary, ขาว, 10px, radius 3px)
- ตัวกล่องพื้น `primary` padding 6px, การ์ดสินค้าขาวเรียงแนวตั้ง gap 6px
- การ์ด: รูป 56×56 ซ้าย + ราคา 15/700 `primary` ขวา; ถ้ามีส่วนลดแสดงราคาเดิมขีดฆ่า 11px
- สูงเท่า Slider + Featured strip; overflow-y auto (scrollbar บาง)

### 5.7 Promo Banners (`<PromoBanners />`)
- 3 คอลัมน์เท่ากัน, gap 16px, อัตราส่วน ~2.9:1 (รูป 600×210), radius 4px
- Hover: zoom รูป 1.03 (overflow hidden, `group-hover:scale-[1.03]` ของ Tailwind)

### 5.8 Product Card (`<ProductCard />` — ใช้ทั่วเว็บ)
รูป 1:1 → ชื่อ 2 บรรทัด → ⭐ rating → ราคา (primary, ตัวหนา) + ราคาเดิมขีดฆ่า → hover แสดงปุ่ม ♡ ⟳ 🛒 ด้านขวาของรูป; ป้ายส่วนลด "-50%" มุมซ้ายบน

### 5.9 Price Format
ตามภาพ: สัญลักษณ์หน้าเลข, คั่นหลักพันด้วย `,`, ทศนิยม 3 ตำแหน่ง `.` → `$1,200.000` (ตั้งค่าได้ใน Currency settings, render ผ่าน helper `formatPrice()`)

## 6. Interaction & Feedback
| Action | Feedback |
|---|---|
| Add to cart | Badge เด้ง (scale 1.2 → 1, Tailwind `animate-*`), toast "Added to cart" (react-hot-toast) + ปุ่ม View cart |
| Add to wishlist/compare | ไอคอนเติมสี primary + toast |
| Search typing | Skeleton ใน dropdown, highlight คำที่ตรง (debounce 300ms ผ่าน `useDebouncedValue`) |
| โหลดรูป | Skeleton สีเทา / blur-up placeholder (`next/image` placeholder="blur") |
| ฟอร์ม error | ขอบแดง + ข้อความใต้ช่อง 12px (React Hook Form + Zod resolver) |
| ปุ่ม submit | spinner + disabled ระหว่างส่ง |

## 7. Empty / Error States
- Cart ว่าง: ภาพประกอบ + "Your cart is empty" + ปุ่ม "Continue shopping"
- Search ไม่พบ: แนะนำคำค้น + สินค้ายอดนิยม
- 404: ช่องค้นหา + ลิงก์หน้าแรก (Next.js `not-found.tsx`)

## 8. Admin UI
- Sidebar มืด (`#1B1B28`) กว้าง 260px, ไอคอน + label, submenu collapse, active = แถบ primary ด้านซ้าย
- Content พื้น `#F2F3F8`, การ์ดขาว
- Data table (React component, เช่น TanStack Table): search, filter, per page, bulk action, status toggle switch (primary)
- ฟอร์ม: label บน input, แบ่ง card ตามกลุ่ม, ปุ่ม Save ติด bottom (sticky) — React Hook Form
- Home Page Settings: preview ภาพ, drag & drop เรียงลำดับ (`@dnd-kit/core`)
- Dashboard: KPI cards 4 ใบ, line chart ยอดขาย, pie สถานะออเดอร์ (Recharts), ตาราง top products

## 9. Accessibility
- Contrast ≥ 4.5:1 (ข้อความขาวบน `#E62E04` ผ่าน)
- ปุ่มไอคอนมี `aria-label` (Compare, Wishlist, Cart, Previous slide, Next slide)
- Slider หยุดได้, keyboard ← → ใช้ได้, focus ring ชัดเจน
- Target size ≥ 44×44px บนมือถือ

## 10. Assets ที่ต้องเตรียม
- โลโก้ (SVG) — **ใช้โลโก้/ชื่อแบรนด์ของตัวเอง**
- ไอคอนหมวดหมู่ 11 ชิ้น (line icon, SVG)
- Hero slider 3 รูป (1100×440), Featured category PNG พื้นใส 8 รูป, Promo banner 3 รูป (600×210)
- รูปในภาพอ้างอิงใช้เป็นตัวอย่างเลย์เอาต์เท่านั้น ควรใช้รูปที่มีสิทธิ์ใช้งานจริงในโปรดักชัน
