# 01 — Product Requirements Document (PRD)
**โปรเจกต์:** Active eCommerce CMS (Node.js / Express + Next.js) — ร้านค้าออนไลน์หลายหมวดหมู่ + ระบบหลังบ้าน
**เวอร์ชันเอกสาร:** 1.0 | **สถานะ:** Draft

---

## 1. ภาพรวมผลิตภัณฑ์ (Overview)
ระบบ E-commerce แบบ B2C ขายสินค้าหลายหมวดหมู่ (แฟชั่น, อิเล็กทรอนิกส์, ยานยนต์, ของเล่น, กีฬา, เครื่องประดับ, ความงาม, เครื่องมือ, ของแต่งบ้าน) ประกอบด้วย 2 ส่วนหลัก:
1. **Storefront (หน้าร้าน)** — หน้าเว็บสำหรับลูกค้า ตามดีไซน์ในภาพ
2. **Admin Panel (ระบบหลังบ้าน)** — จัดการสินค้า คำสั่งซื้อ ลูกค้า โปรโมชัน เนื้อหาหน้าแรก และการตั้งค่าทั้งหมด

## 2. เป้าหมาย (Goals)
| เป้าหมาย | ตัวชี้วัด (KPI) |
|---|---|
| ลูกค้าค้นหาและซื้อสินค้าได้เร็ว | Conversion Rate ≥ 2% |
| หน้าแรกโหลดเร็ว | LCP < 2.5s, TTFB < 600ms |
| แอดมินจัดการหน้าร้านได้เองโดยไม่ต้องแก้โค้ด | 100% ของ Section หน้าแรกตั้งค่าได้จากหลังบ้าน |
| รองรับหลายภาษา/หลายสกุลเงิน | ≥ 2 ภาษา, ≥ 2 สกุลเงิน |

## 3. กลุ่มผู้ใช้ (Personas)
| Role | คำอธิบาย |
|---|---|
| **Guest** | ผู้เยี่ยมชม ดูสินค้า ค้นหา ใส่ตะกร้า เปรียบเทียบ ได้ |
| **Customer** | สมาชิก สั่งซื้อ ชำระเงิน ติดตามคำสั่งซื้อ Wishlist รีวิว |
| **Super Admin** | ผู้ดูแลระบบสูงสุด เข้าถึงทุกเมนู |
| **Staff** | พนักงาน สิทธิ์ตาม Role ที่กำหนด (เช่น Order Manager, Content Editor) |

## 4. ขอบเขตฟีเจอร์ — Storefront (ตรงตามภาพ)

### 4.1 Top Bar
- **FR-01** Dropdown เลือกภาษา (แสดงธง + ชื่อภาษา เช่น 🇺🇸 English)
- **FR-02** Dropdown เลือกสกุลเงิน (เช่น U.S. Dollar $) — ราคาทั้งเว็บแปลงตามอัตราแลกเปลี่ยน
- **FR-03** ลิงก์ Login / Registration (มุมขวา) — เมื่อล็อกอินแล้วเปลี่ยนเป็นชื่อผู้ใช้ + Dashboard / Logout

### 4.2 Header
- **FR-04** โลโก้ (ตั้งค่าได้จากหลังบ้าน) คลิกกลับหน้าแรก
- **FR-05** Search bar placeholder "I am shopping for..." + ปุ่มค้นหาสีส้ม
  - Live search (autocomplete) แสดง สินค้า / หมวดหมู่ / แบรนด์ ขณะพิมพ์ (debounce 300ms, ขั้นต่ำ 2 ตัวอักษร)
- **FR-06** ไอคอน **Compare** พร้อม badge จำนวน (สูงสุด 3–4 ชิ้น)
- **FR-07** ไอคอน **Wishlist** พร้อม badge จำนวน (ต้องล็อกอิน)
- **FR-08** ไอคอน **Cart** พร้อม badge จำนวน + Mini-cart dropdown (Guest ใช้ได้ผ่าน tempUserId)

### 4.3 Categories Sidebar (ซ้าย)
- **FR-09** หัวข้อ "Categories" + ลิงก์ "See All >"
- **FR-10** รายการหมวดหมู่ระดับบนพร้อมไอคอน (ตามภาพ 11 หมวด):
  Women Clothing & Fashion, Men Clothing & Fashion, Computer & Accessories, Automobile & Motorcycle, Kids & toy, Sports & outdoor, Jewelry & Watches, Cellphones & Tabs, Beauty, Health & Hair, Home Improvement & Tools, Home decoration & Appliance
- **FR-11** Hover แสดง Mega menu หมวดย่อย (ระดับ 2–3)

### 4.4 Hero Slider (กลาง)
- **FR-12** สไลด์แบนเนอร์หลายภาพ ปุ่มลูกศร ซ้าย/ขวา (วงกลมสีขาว) + Dots indicator ด้านล่าง
- **FR-13** Autoplay 5 วินาที, หยุดเมื่อ hover, รองรับ swipe บนมือถือ
- **FR-14** แต่ละสไลด์มีลิงก์ปลายทาง (ตั้งค่าจากหลังบ้าน)

### 4.5 Featured Categories Strip (ใต้ Slider)
- **FR-15** การ์ดหมวดหมู่แนะนำ 8 ช่อง (รูป + ชื่อ ตัดข้อความด้วย ellipsis) เช่น Sports & outdoor, Mobile Phones, Women Watches, Women Dress, Baby Dress, Men Formal, Doll, Tools
- **FR-16** แอดมินเลือกหมวดที่แสดงและเรียงลำดับได้

### 4.6 Todays Deal (ขวา)
- **FR-17** กล่องหัวข้อ "Todays Deal" + ป้าย **Hot** สีแดง
- **FR-18** รายการสินค้าแนวตั้งบนพื้นสีส้มแดง แต่ละการ์ด: รูปสินค้า + ราคา (สีแดง ตัวหนา) — scroll ได้ในกล่อง
- **FR-19** สินค้าถูกดึงจาก flag `todaysDeal = true` ในหลังบ้าน

### 4.7 Promo Banners (แถวล่าง)
- **FR-20** แบนเนอร์โปรโมชัน 3 ช่องเท่ากัน (เช่น Super Sale, Summer, End of Season Sale) ตั้งค่ารูป + ลิงก์ได้

### 4.8 หน้าอื่นที่ต้องมี (นอกภาพ แต่จำเป็น)
Product Listing (filter ราคา/แบรนด์/หมวด/attribute, sort), Product Detail (gallery, variant สี/ไซส์, stock, review), Cart, Checkout (ที่อยู่ → การจัดส่ง → ชำระเงิน), Order Confirmation, Compare page, Wishlist, Customer Dashboard (Orders, Addresses, Profile, Reviews), Flash Deal page, Brands page, All Categories page, Static pages (About, Terms, Privacy, Contact), 404

### 4.9 Footer
- Newsletter subscribe, ลิงก์หน้า Static, ช่องทางติดต่อ, Social links, ไอคอนช่องทางชำระเงิน, Copyright

## 5. ขอบเขตฟีเจอร์ — Admin Panel (ระบบหลังบ้านทั้งหมด)

| # | โมดูล | ฟังก์ชันหลัก |
|---|---|---|
| A1 | **Dashboard** | ยอดขายวันนี้/เดือนนี้, จำนวนออเดอร์ตามสถานะ, ลูกค้าใหม่, กราฟยอดขาย 12 เดือน, สินค้าขายดี Top 10, สินค้าใกล้หมดสต็อก |
| A2 | **Products** | CRUD สินค้า, Variant (สี/ไซส์/attribute), รูปหลายรูป, SEO meta, สต็อก, SKU, ราคาพิเศษ/ส่วนลด, Tax, Publish/Unpublish, Featured, **Todays Deal toggle**, Bulk import/export CSV, Duplicate |
| A3 | **Categories** | ต้นไม้หมวดหมู่ 3 ระดับ, ไอคอน, แบนเนอร์, ลำดับ, Featured, Commission (สำรองไว้) |
| A4 | **Brands** | CRUD แบรนด์ + โลโก้ |
| A5 | **Attributes & Colors** | จัดการ attribute (Size, Material ฯลฯ) และค่าสี |
| A6 | **Orders** | รายการออเดอร์, filter สถานะ/วันที่/การชำระเงิน, อัปเดตสถานะ (Pending → Confirmed → Picked up → On the way → Delivered / Cancelled), Payment status, พิมพ์ใบแจ้งหนี้ (PDF), Tracking number |
| A7 | **Refund Requests** | อนุมัติ/ปฏิเสธคำขอคืนเงิน |
| A8 | **Customers** | รายชื่อ, ประวัติการซื้อ, Ban/Unban, Login-as (impersonate) |
| A9 | **Reviews** | อนุมัติ/ซ่อนรีวิว |
| A10 | **Marketing** | Flash Deals (ช่วงเวลา + ส่วนลด), Coupons (Cart/Product based, % หรือจำนวนเงิน, วันหมดอายุ, จำนวนครั้ง), Newsletter, Subscribers |
| A11 | **Website Setup** | Header (โลโก้, top bar), **Home Page Settings** (Hero sliders, Featured categories, Todays deal, 3 Promo banners, Section สินค้าตามหมวด), Footer, Pages (CMS), Appearance (สีหลัก, favicon, fonts) |
| A12 | **Shipping** | Countries, Cities/Zones, ค่าจัดส่ง (Flat / Per product / Per zone), Pickup points |
| A13 | **Payments** | เปิด/ปิด Gateway (Stripe, PayPal, Omise/PromptPay, COD, Bank transfer) + API keys |
| A14 | **Setup & Config** | General settings, Languages + Translation editor, Currencies + อัตราแลกเปลี่ยน + รูปแบบทศนิยม, Tax, SMTP, SMS/OTP, Social login, Google Analytics / Facebook Pixel, Maintenance mode |
| A15 | **Staff & Roles** | สร้าง Role + Permission ละเอียดรายเมนู, บัญชีพนักงาน |
| A16 | **Reports** | ยอดขายตามช่วงเวลา, สินค้าขายดี, สต็อก, Wishlist report, Search keyword report, Export Excel |
| A17 | **Uploaded Files** | Media library จัดการรูปทั้งหมด (upload, เลือกซ้ำ, ลบ) |
| A18 | **Support** | Contact messages / Ticket |
| A19 | **System** | Cache clear, Activity log, Backup, Server status |

## 6. Non-Functional Requirements
- **Performance:** Cache หน้าแรก (Redis) + Next.js ISR, รูปภาพ WebP + lazy-load (`next/image`), CDN
- **Security:** OWASP Top 10, CSRF, rate limit login (5 ครั้ง/นาที), 2FA สำหรับแอดมิน, เข้ารหัส API key
- **SEO:** SEO-friendly slug, sitemap.xml (`next-sitemap`), schema.org Product, meta/OG tags
- **Responsive:** Mobile-first, breakpoint 576/768/992/1200/1400
- **Accessibility:** WCAG 2.1 AA (contrast, alt text, keyboard nav)
- **Localization:** i18n ทุกข้อความ (next-intl/i18next), รองรับ RTL
- **Availability:** 99.5% uptime

## 7. Out of Scope (เฟสแรก)
Multi-vendor seller, Mobile app native, Affiliate, Club point, Auction, POS — ออกแบบ schema ให้ต่อยอดได้

## 8. Acceptance Criteria (ตัวอย่าง)
- เปลี่ยนสกุลเงินที่ top bar → ราคาใน Todays Deal, Slider, Product card เปลี่ยนทันที
- แอดมินเปิดใช้งาน toggle "Todays Deal" ในสินค้า → แสดงในกล่องขวาหน้าแรกภายในการ clear cache
- เพิ่มสินค้าลงตะกร้า → badge Cart +1 โดยไม่รีโหลดหน้า
- ค้นหา "iphone" → dropdown แสดงผลภายใน 500ms
