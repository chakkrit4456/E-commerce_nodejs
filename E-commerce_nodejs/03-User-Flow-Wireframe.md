# 03 — User Flow / Wireframe Description

## 1. Wireframe หน้าแรก (Desktop ≥ 1200px) — ตรงตามภาพ
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🇺🇸 English ▾   U.S. Dollar $ ▾                         Login   Registration │ ← Top bar (h:32px, bg white, border-bottom)
├──────────────────────────────────────────────────────────────────────────────┤
│ [🛍 LOGO]        [ I am shopping for...                       ][🔍]  ⟳0  ♡0  🛒0│ ← Header (h:80px)
│                                                            Compare Wishlist Cart│
├──────────────────────────────────────────────────────────────────────────────┤  bg: #F2F3F8
│ ┌─Categories  See All >─┐ ┌──────────── HERO SLIDER ───────────┐ ┌Todays Deal[Hot]┐│
│ │ ▢ Women Clothing & F..│ │ (‹)                           (›) │ │ ┌────────────┐ ││
│ │ ▢ Men Clothing & Fa.. │ │                                    │ │ │[img] $52.000│ ││
│ │ ▢ Computer & Access.. │ │                                    │ │ ├────────────┤ ││
│ │ ▢ Automobile & Moto.. │ │             ● ○ ○                  │ │ │[img] $399.000│││
│ │ ▢ Kids & toy          │ └────────────────────────────────────┘ │ ├────────────┤ ││
│ │ ▢ Sports & outdoor    │ ┌──┬──┬──┬──┬──┬──┬──┬──┐               │ │[img]$1,200.000││
│ │ ▢ Jewelry & Watches   │ │🏀│📱│⌚│👗│👶│👔│🧸│🧰│ ← 8 featured  │ ├────────────┤ ││
│ │ ▢ Cellphones & Tabs   │ │Sp│Mo│Wo│Wo│Ba│Me│Do│To│   categories  │ │[img] $140.000│││
│ │ ▢ Beauty, Health&Hair │ └──┴──┴──┴──┴──┴──┴──┴──┘               │ └────────────┘ ││
│ │ ▢ Home Improvement..  │                                          └ bg orange-red ┘│
│ │ ▢ Home decoration..   │                                                          │
│ └───────────────────────┘                                                          │
│ ┌──── Promo Banner 1 ────┐ ┌──── Promo Banner 2 ────┐ ┌──── Promo Banner 3 ────┐   │
│ │  SUPER SALE 50%        │ │     SUMMER 50% OFF     │ │  End of Season SALE    │   │
│ └────────────────────────┘ └────────────────────────┘ └────────────────────────┘   │
│ (ต่อด้วย: Flash Sale, Best Selling, Section สินค้าตามหมวด, Brands, Footer)          │
└──────────────────────────────────────────────────────────────────────────────┘
```
**Grid:** container 1320px → 3 คอลัมน์ `3 / 7 / 2` (ประมาณ 25% / 58% / 17%) gap 16px — จัดด้วย CSS Grid/Tailwind ใน React layout component

## 2. Responsive
| Breakpoint | การเปลี่ยนแปลง |
|---|---|
| < 1200px | Todays Deal ย้ายลงใต้ Slider เป็นแถวแนวนอน scroll |
| < 992px | Categories sidebar ซ่อน → ปุ่ม ☰ เปิด off-canvas; Featured strip 4 คอลัมน์ 2 แถว |
| < 768px | Top bar ย่อ, Search เต็มความกว้างบรรทัดที่ 2, ไอคอน Compare/Wishlist ซ่อนย้ายไป bottom nav; Promo banner เรียงแนวตั้ง / swipe |
| < 576px | Bottom navigation: Home / Categories / Cart / Account |

## 3. User Flows (Storefront)

### 3.1 Browse → Purchase (Happy path)
```
Home ─► คลิกหมวด (Sidebar / Featured) ─► Product Listing (filter/sort)
     ─► Product Detail (เลือก variant, จำนวน) ─► Add to Cart (badge +1, toast)
     ─► Cart ─► Checkout
          ├─ ยังไม่ล็อกอิน → Login / Register / Guest checkout
          ─► Step1 ที่อยู่จัดส่ง ─► Step2 วิธีจัดส่ง ─► Step3 ชำระเงิน (+coupon)
          ─► Payment Gateway ─► callback (webhook) ─► Order Success (Order code) ─► Email ยืนยัน
```

### 3.2 Search
```
พิมพ์ในช่อง "I am shopping for..." (≥2 ตัวอักษร)
  ─► Dropdown: Categories (≤3) | Brands (≤3) | Products (≤5 พร้อมรูป+ราคา) | "ดูผลทั้งหมด"
  ─► Enter/ปุ่มส้ม ─► /search?keyword=... (Listing + filter) ; ไม่พบ → Empty state + สินค้าแนะนำ
```

### 3.3 Compare
Product card → ไอคอน ⟳ → badge Compare +1 (สูงสุด 3; เกิน → แทนที่อันเก่าสุด) → หน้า /compare ตารางเทียบ (รูป, ราคา, แบรนด์, หมวด, attribute, ปุ่ม Add to cart)

### 3.4 Wishlist
♡ → ถ้า Guest → modal Login → หลังล็อกอินเพิ่มอัตโนมัติ → badge +1 → /wishlist

### 3.5 Change Language / Currency
Dropdown top bar → POST `/api/language/change` หรือ `/api/currency/change` → เก็บ cookie/session → reload หน้าเดิม (หรือ revalidate ผ่าน router.refresh()) → ข้อความ + ราคาเปลี่ยน

### 3.6 Registration / Login
Registration: ชื่อ, อีเมล/เบอร์, รหัสผ่าน, ยืนยันรหัส, ยอมรับเงื่อนไข → ยืนยันอีเมล/OTP → Dashboard
Login: อีเมล/เบอร์ + รหัสผ่าน (ผ่าน NextAuth.js Credentials Provider), Remember me, Forgot password, Social login (Google/Facebook)
*Guest cart merge เข้าบัญชีหลังล็อกอิน*

### 3.7 Customer Dashboard
Sidebar: Dashboard | Purchase History | Downloads | Wishlist | Compare | Addresses | Refund Requests | Reviews | Manage Profile | Logout

## 4. User Flows (Admin)

### 4.1 Admin Layout
```
┌────────────┬──────────────────────────────────────────────┐
│  LOGO      │ ☰  [search]            🌐 lang  🔔  👤 Admin ▾ │
│ Dashboard  ├──────────────────────────────────────────────┤
│ Products ▸ │  Breadcrumb / Page title        [+ Add New]    │
│ Orders   ▸ │  ┌─ Filters ────────────────────────────────┐ │
│ Customers  │  └──────────────────────────────────────────┘ │
│ Marketing ▸│  ┌─ Data table (sort, paginate, bulk) ───────┐ │
│ Website  ▸ │  │                                            │ │
│ Reports  ▸ │  └──────────────────────────────────────────┘ │
│ Setup    ▸ │                                                │
│ Staff    ▸ │                                                │
└────────────┴──────────────────────────────────────────────┘
```

### 4.2 เพิ่มสินค้า
Products → Add New → Tabs: General (ชื่อ, หมวด, แบรนด์, หน่วย, tags) | Images (gallery + thumbnail จาก Media library) | Price & Stock (ราคา, ส่วนลด+ช่วงเวลา, variant matrix, SKU, qty) | Description | Shipping | SEO | Status (Published, Featured, **Todays Deal**) → Save & Publish → index ไป Meilisearch (BullMQ job) → ล้าง cache หน้าแรก (Redis + Next.js revalidateTag)

### 4.3 จัดการหน้าแรก
Website Setup → Home Page Settings:
- **Hero Slider:** เพิ่ม/ลบ/ลากเรียง รูป (1100×400) + ลิงก์
- **Featured Categories:** เลือกหมวด (max 8) ลากเรียง
- **Todays Deal:** แสดงรายการสินค้าที่ flag ไว้ + เปิด/ปิด section
- **Promo Banners (3):** รูป (600×200) + ลิงก์ ต่อช่อง
- **Home Categories Sections:** เลือกหมวดที่แสดงเป็น product row
→ Save → Preview

### 4.4 จัดการออเดอร์
Orders → filter → เปิดรายละเอียด → เปลี่ยน Delivery status / Payment status → (ระบบส่งอีเมล/SMS แจ้งลูกค้าผ่าน BullMQ job) → Print invoice (PDF)

### 4.5 Flash Deal / Coupon
Marketing → Flash Deals → ตั้งชื่อ, banner, ช่วงวัน-เวลา, เลือกสินค้า + ส่วนลดรายชิ้น → Active
Marketing → Coupons → type (cart/product), code, discount (%/amount), min spend, max discount, วันเริ่ม-หมด, จำกัดการใช้
