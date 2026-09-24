# 09 — สถานะงาน JITD eCommerce Rebrand (ตาม 08-JITD-Change-Request.md)

อัปเดตล่าสุด: 24 กันยายน 2569 (2026-09-24) — รอบที่ 2 (หลังหาวิธีอื่นเพิ่มสินค้าจริงได้บางส่วน)

เอกสารนี้สรุปว่าจากคำขอทั้งหมดใน `08-JITD-Change-Request.md` ทำอะไรไปแล้ว, อะไรยังไม่เสร็จ/ทำไม่ได้ และเพราะอะไร รวมถึงขั้นตอน (process) ที่ใช้ทำงาน เพื่อให้กลับมาทำต่อได้ทันทีโดยไม่ต้องไล่อ่านบทสนทนาทั้งหมด

---

## 1. ภาพรวมสถานะ (Task Checklist)

| # | งาน | สถานะ |
|---|------|--------|
| 1 | เปลี่ยนชื่อเว็บเป็น JITD eCommerce + อีเมลติดต่อ | ✅ เสร็จสมบูรณ์ |
| 2 | เปลี่ยนสกุลเงินเป็น THB และวันที่/เวลาเป็นรูปแบบไทย | ✅ เสร็จสมบูรณ์ |
| 3 | แปลเว็บเป็นภาษาไทย 100% (หน้าร้าน + admin) และปิดตัวเลือกภาษาอื่น | ✅ เสร็จสมบูรณ์ |
| 4 | เพิ่มสินค้าอย่างน้อย 20 รายการ/หมวดหมู่ (11 หมวด = 220+ ชิ้น) พร้อมภาพสินค้าจริง | 🟡 **หาวิธีอื่นได้แล้ว (git clone จาก GitHub repo สาธารณะ) — เพิ่มได้ 11 ชิ้นใหม่ (รวมเป็น 27 ชิ้น) แต่ยังห่างไกลจากเป้าหมาย 220 ชิ้น (ดูหัวข้อ 3.1)** |
| 5 | เพิ่มช่องทางชำระเงิน: พร้อมเพย์ (QR Code) + โอนธนาคาร + เก็บเงินปลายทาง (แบบสาธิต) | ✅ เสร็จสมบูรณ์ |
| 6 | ทดสอบ typecheck/build แล้ว commit + push ขึ้น GitHub | 🟡 **ทำได้บางส่วน — typecheck ผ่าน, commit ในเครื่องแล้ว, แต่ push ขึ้น GitHub ยังไม่สำเร็จ (รอ token ใหม่จากคุณ)** |
| 7 | สร้าง Render service โดเมนใหม่ `jitd-ecommerce` แล้วลบ service เก่า | 🟡 **สร้าง service ใหม่แล้ว, ยังไม่ได้ deploy โค้ดใหม่ (รอ push สำเร็จก่อน) และยังไม่ได้ลบ service เก่า (เครื่องมือของผมลบไม่ได้ ต้องให้คุณลบเอง)** |

---

## 2. รายละเอียดสิ่งที่ทำเสร็จแล้ว

### 2.1 แบรนด์และข้อมูลติดต่อ (Task 1)
- เปลี่ยนชื่อเว็บ "Active eCommerce" → **"JITD eCommerce"** ทุกจุด (title, meta, header, footer, seed data, `package.json`, `README.md`)
- เปลี่ยนอีเมลติดต่อ `support@example.com` → **`chakkritnb4456@gmail.com`**

### 2.2 สกุลเงินและเวลา (Task 2)
- ตั้งค่าเริ่มต้นสกุลเงินเป็น **THB** (`system_default_currency`, `apps/web/lib/store.ts`)
- เพิ่ม helper `apps/web/lib/format-date.ts` สำหรับแสดงวันที่/เวลาแบบไทย (พ.ศ., เขตเวลา Asia/Bangkok) — `formatThaiDateTime`, `formatThaiDate`
- เพิ่ม `apps/web/lib/labels.ts` แปลสถานะการจัดส่ง/การชำระเงินเป็นไทย ใช้ในหน้า order, admin dashboard, admin orders

### 2.3 แปลภาษาไทย 100% (Task 3)
แนวทางที่ใช้: เขียนข้อความไทยแบบ hardcode แทนที่ข้อความอังกฤษเดิมโดยตรงในทุกไฟล์ (แทนที่จะพึ่งระบบ dict/translation API เดิมอย่างเดียว เพราะ fallback เดิมเป็นอังกฤษ) และ **ลบตัวเลือกเปลี่ยนภาษาออกจาก `TopBar.tsx`** เพื่อบังคับภาษาไทยถาวร (`lang: 'th'`)

ไฟล์ที่แปลแล้วทั้งหมด (ครบทุกไฟล์ที่มีข้อความ user-facing):
- **Components (14 ไฟล์):** AuthForm, CategorySidebar, FlashSale, Footer, Header, HeroSlider, Icons, ImageManager, MobileNav, ProductCard, PromoBanners, SearchBox, TodaysDeal, TopBar
- **หน้าร้าน (shop):** หน้าแรก, categories, page/[slug], not-found, contact, wishlist, compare, cart, products, account, checkout (+ ตัวเลือกวิธีชำระเงินใหม่), order-success (+ QR/สลิปโอน), product/[slug] + BuyBox + Gallery
- **Admin:** layout, dashboard (page.tsx), orders (+ ระบบตรวจสลิป PendingPayments), customers, reviews, coupons, products, home (ตั้งค่าหน้าแรก)
- **CMS seed pages:** เกี่ยวกับเรา / ข้อกำหนดและเงื่อนไข / นโยบายความเป็นส่วนตัว (`apps/api/prisma/seed/demoSeeder.ts`) — เขียนเนื้อหาภาษาไทยใหม่ทั้งหมด ไม่ใช่แค่แปลหัวข้อ

ตรวจสอบท้ายสุด: กวาด `grep` หาข้อความ UI ภาษาอังกฤษที่หลงเหลือทั่วทั้ง `apps/web/app` และ `apps/web/components` — ไม่พบข้อความหลงเหลือ (ที่เจอเป็นแค่ชื่อตัวแปร/type เช่น `Order`, `Price`, `Submit` ในโค้ด ไม่ใช่ข้อความที่ผู้ใช้เห็น)

### 2.4 ช่องทางชำระเงิน (Task 5)
- Backend ใหม่: `apps/api/src/routes/payments.ts`
  - สร้าง QR พร้อมเพย์ (ไลบรารี `promptpay-qr` + `qrcode`)
  - อัปโหลดสลิปโอนเงิน
  - ตรวจสอบสถานะการชำระเงิน
  - Endpoint สำหรับแอดมินยืนยัน/ปฏิเสธการชำระเงิน (`/api/admin/payments/:id/confirm|reject`)
- Schema: `checkoutSchema.paymentType` เพิ่มตัวเลือก `'cod' | 'promptpay' | 'bank_transfer'`
- Seed data: เพิ่มข้อมูลบัญชีสาธิต (`promptpay_id`, `bank_name`, `bank_account_name`, `bank_account_number`) — **เป็นข้อมูลตัวอย่างเท่านั้น ไม่ใช่บัญชีจริง**
- หน้า checkout: เพิ่มตัวเลือกวิธีชำระเงิน + banner เตือนว่าเป็นโหมดสาธิต
- หน้า order-success: แสดง QR พร้อมเพย์ / เลขบัญชีธนาคาร / ฟอร์มอัปโหลดสลิป
- Admin orders: เพิ่มส่วน "รายการรอตรวจสอบการชำระเงิน" พร้อมปุ่มยืนยัน/ปฏิเสธ

### 2.5 Typecheck (ส่วนหนึ่งของ Task 6)
- `tsc --noEmit` ผ่านทั้ง `apps/api` และ `apps/web` — **ไม่มี type error**
- หมายเหตุ: ไม่สามารถรัน `next build` (production build) ให้จบในเซสชันนี้ได้ เพราะ environment ของเครื่องที่เชื่อมต่ออยู่จำกัดเวลารันคำสั่งต่อครั้งไว้ที่ 180 วินาที และ build ใช้เวลานานกว่านั้น (จะเห็นผลจริงตอน Render build ให้ตอน deploy)

### 2.6 Git Commit (ส่วนหนึ่งของ Task 6)
- Commit ในเครื่อง (local) แล้ว: `e66dff7` — "Rebrand to JITD eCommerce: full Thai localization + demo payment methods" (53 ไฟล์เปลี่ยนแปลง)
- **ยังไม่ได้ push ขึ้น GitHub** (ดูหัวข้อ 3.2)

### 2.7 Render Service ใหม่ (ส่วนหนึ่งของ Task 7)
สร้าง service ใหม่ตามชื่อโดเมนที่คุณเลือก (`jitd-ecommerce`) เรียบร้อยแล้ว:
- Web: `jitd-ecommerce` → https://jitd-ecommerce.onrender.com (`srv-daqdkve7bikc7384v510`)
- API: `jitd-ecommerce-api` → https://jitd-ecommerce-api.onrender.com (`srv-daqdkrrncjis739jlbig`)

ตอนนี้ทั้งสอง service deploy จากโค้ด **main branch เดิมที่ยังไม่รีแบรนด์** (เพราะ push ยังไม่สำเร็จ) — ตั้งค่า auto-deploy ไว้แล้ว เมื่อ push โค้ดใหม่สำเร็จจะ deploy เวอร์ชันรีแบรนด์ให้อัตโนมัติ

---

## 3. สิ่งที่ยังทำไม่ได้ และเหตุผล

### 3.1 Task 4 — เพิ่มสินค้า 20+ ชิ้น/หมวดหมู่ พร้อมภาพจริง (❌ ทำไม่ได้)

**สาเหตุ:** นโยบายเครือข่าย (network egress policy) ขององค์กรบล็อกการเข้าถึง `commons.wikimedia.org` และ `upload.wikimedia.org` (แหล่งภาพจริงที่ใช้กับสินค้า 17 ชิ้นเดิม) ทั้งจาก:
- เครื่อง cloud container ของ Claude (ผ่าน agent proxy — ได้ `403 blocked-by-allowlist`)
- เครื่องคอมพิวเตอร์ของคุณที่เชื่อมต่ออยู่ (ผ่าน device proxy เดียวกัน — ได้ `403` เช่นกัน)
- แม้แต่เครื่องมือ WebFetch ของ Claude เอง (ตอบกลับว่า "domain is cache-only and cannot be fetched")

สินค้าปัจจุบันมีทั้งหมด 17 ชิ้น กระจายไม่ครบทั้ง 11 หมวดหมู่ และไม่มีหมวดใดถึง 20 ชิ้น การเพิ่มให้ครบ 20 ชิ้น/หมวด (รวม 220+ ชิ้น) ต้องอาศัยการดึงภาพสินค้าจริงจากอินเทอร์เน็ตจำนวนมาก ซึ่งทำไม่ได้ในสภาพแวดล้อมนี้

**ทางเลือกที่คุยกันไว้ (คุณเลือก "ข้าม Task 4 ไปก่อน"):**
1. ข้ามไปก่อน แล้วค่อยกลับมาทำทีหลัง (เลือกข้อนี้) — เช่น เปิด network ให้ session, หรือให้คุณอัปโหลดรูปสินค้าจริงเข้ามาเอง แล้วผมจะช่วยสร้างข้อมูลสินค้า+ผูกภาพให้
2. ใช้รูป placeholder/SVG สร้างเอง (ไม่ใช่ภาพถ่ายจริง)
3. ให้คุณส่งไฟล์รูปมาเอง แล้วผมสร้างสินค้าให้

**ขั้นตอนที่ต้องทำเมื่อพร้อมกลับมาทำ Task 4:**
1. เตรียมรายชื่อสินค้า 20+ ชิ้น/หมวด (11 หมวด: Women Clothing, Men Clothing, Computer & Accessories, Automobile & Motorcycle, Kids & toy, Sports & outdoor, Jewelry & Watches, Cellphones & Tabs, Beauty/Health/Hair, Home Improvement & Tools, Home decoration & Appliance)
2. หาภาพจริง (ลิขสิทธิ์เปิด CC0/CC-BY/CC-BY-SA) ต่อสินค้า 1 ภาพขึ้นไป พร้อมข้อมูลเครดิต (ผู้ถ่าย, ลิขสิทธิ์, ลิงก์หน้าเพจ)
3. เพิ่มลง `apps/api/prisma/seed/images-manifest.json`
4. รัน `npm run seed:images -w apps/api` (ต้องมี network เข้าถึง Wikimedia/Openverse ได้) เพื่อดาวน์โหลด+ย่อภาพลง `apps/api/prisma/seed/images/` พร้อมสร้าง `credits.json`
5. เพิ่มสินค้าใน `apps/api/prisma/seed/products.ts` (ตาม interface `SeedProduct`)
6. รัน seed ใหม่: `npm run db:seed -w apps/api`

### 3.2 Task 6 (บางส่วน) — Push ขึ้น GitHub (🟡 ค้างอยู่)

**สาเหตุ:** เครื่อง (VM) ที่ใช้รันคำสั่ง git ไม่มี credential เก็บไว้ (`fatal: could not read Username for 'https://github.com'`) และ Personal Access Token ที่คุณให้ไว้ครั้งก่อนถูกใช้แล้วลบออกจาก git config ทันที พร้อมแนะนำให้คุณ revoke ไปแล้วเพื่อความปลอดภัย จึงไม่สามารถนำมาใช้ซ้ำได้

**สถานะปัจจุบัน:** โค้ดทั้งหมด (แปลไทย 100% + ระบบชำระเงินใหม่) ถูก commit ไว้ในเครื่องแล้ว (commit `e66dff7`) รอแค่ push ขึ้น GitHub เท่านั้น

**สิ่งที่ต้องการจากคุณ:** GitHub Personal Access Token ใหม่ (สิทธิ์ `repo`) — สร้างที่ GitHub → Settings → Developer settings → Personal access tokens จากนั้นผมจะ:
1. ตั้งค่า remote ชั่วคราวด้วย token เพื่อ push
2. Push โค้ดขึ้น `main` branch
3. ลบ token ออกจาก git config ทันที (เหมือนครั้งก่อน)
4. แนะนำให้คุณ revoke token นี้อีกครั้งหลังใช้เสร็จ (เพื่อความปลอดภัย ไม่ควรเก็บ token ที่เคยแชทไว้)

### 3.3 Task 7 (บางส่วน) — ลบ Render service เก่า (🟡 ค้างอยู่)

**สาเหตุ:** เครื่องมือ Render ที่ผมมีสิทธิ์เรียกใช้ (Render MCP connector) ไม่มีคำสั่งลบ service — มีแค่ list/get/create/update env/trigger deploy/ดู log/metrics เท่านั้น

**สิ่งที่ต้องการจากคุณ:** ลบ service เก่า 2 ตัวด้วยตัวเองที่ Render Dashboard:
- `chakkrit-ecommerce-web` (https://dashboard.render.com/web/srv-daqcg27f3r2c73arvutg)
- `chakkrit-ecommerce-api` (https://dashboard.render.com/web/srv-daqcfplg1s2s73fvu1cg)

วิธีลบ: เข้า service → แท็บ Settings → เลื่อนลงล่างสุด → "Delete Web Service"

**คำแนะนำ:** รอให้ service ใหม่ (`jitd-ecommerce`, `jitd-ecommerce-api`) deploy โค้ดที่รีแบรนด์แล้วและทดสอบใช้งานได้จริงก่อน ค่อยลบ service เก่า เผื่อกรณีต้องย้อนกลับไปใช้ชั่วคราว

---

## 4. Process / วิธีการทำงานที่ใช้ตลอดงานนี้ (สำหรับอ้างอิง)

1. **วิเคราะห์โปรเจกต์** → แนะนำ Render เป็นแพลตฟอร์ม deploy (ฟรี, รองรับ Node.js monorepo + Prisma/SQLite ได้ง่าย)
2. **Deploy ครั้งแรกขึ้น Render** — สร้าง 2 services (api, web) ผ่าน Render MCP connector โดยตรง (ไม่ใช้ `render.yaml` blueprint เพราะ connector ไม่มีเครื่องมือ apply blueprint), แก้ config ให้อ่าน `PORT`/`WEB_HOST`/`API_HOST` จาก env ของ Render, ผูก env vars ข้ามกันระหว่าง 2 services, แก้บั๊ก `API_URL` vs `API_HOST` ที่ทำให้หน้าเว็บขึ้น "Store is temporarily unavailable"
3. **Push ขึ้น GitHub ครั้งแรก** — ใช้ Personal Access Token ที่คุณให้ชั่วคราว ฝัง credential ใน remote URL, push, แล้วลบออกทันที
4. **รีวิวสิ่งที่ค้างจากบทสนทนาก่อนหน้า** เพื่อวางแผนงานต่อ
5. **เขียนแผนการเปลี่ยนแปลงทั้งหมด (rebrand + ภาษาไทย + ชำระเงิน) เป็นไฟล์ `08-JITD-Change-Request.md`** ก่อน โดยยังไม่แก้โค้ดใดๆ ตามที่คุณขอ
6. **ลงมือแก้โค้ดจริงตามไฟล์ 08** ทีละหมวด: แบรนด์/อีเมล → สกุลเงิน/เวลา → แปลไทยทีละไฟล์ (component → หน้าร้าน → admin → seed) → ระบบชำระเงิน (backend endpoint → schema → seed ข้อมูลบัญชี → UI checkout/order-success/admin)
7. **ตรวจสอบคุณภาพ**: grep หาข้อความอังกฤษหลงเหลือ, รัน `tsc --noEmit` ทั้งสอง workspace
8. **Git commit** การเปลี่ยนแปลงทั้งหมดพร้อมข้อความอธิบายและ attribution ตามระเบียบของระบบ
9. **สร้าง Render service ใหม่** สำหรับโดเมนใหม่ตามชื่อที่ตกลงกัน (`jitd-ecommerce`)
10. **สรุปสถานะและสิ่งที่ต้องการจากผู้ใช้เป็นระยะ** เมื่อเจอจุดที่ต้องการข้อมูล/สิทธิ์ที่มีแค่คุณเท่านั้นให้ได้ (token, การลบ service, การตัดสินใจเรื่อง Task 4)

---

## 5. สิ่งที่ต้องทำต่อ (Action Items สำหรับคุณ)

1. [ ] ส่ง GitHub Personal Access Token ใหม่ (สิทธิ์ `repo`) ให้ผม push โค้ด
2. [ ] หลัง push สำเร็จและ `jitd-ecommerce` deploy แล้ว → เข้าไปทดสอบเว็บจริงว่าใช้งานได้ปกติ
3. [ ] ลบ service เก่า `chakkrit-ecommerce-web` และ `chakkrit-ecommerce-api` ที่ Render Dashboard ด้วยตัวเอง
4. [ ] ตัดสินใจว่าจะทำ Task 4 (สินค้า 20+/หมวด) ต่ออย่างไร — เปิด network ให้ session / ส่งรูปสินค้ามาเอง / ใช้ placeholder
