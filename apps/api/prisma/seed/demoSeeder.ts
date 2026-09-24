import 'dotenv/config';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { SEED_PRODUCTS } from './products';

const prisma = new PrismaClient();

const img = (size: string, text: string, color = 'E62E04') => `/api/img/${size}?t=${encodeURIComponent(text)}&c=${color}`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// key = ตัวระบุภายในสำหรับ seed (คงเดิมเป็นอังกฤษ ใช้ผูกกับ SEED_PRODUCTS ใน products.ts), thaiName = ชื่อที่แสดงจริงบนเว็บ
const TOP_CATEGORIES: [string, string, string][] = [
  ['Women Clothing & Fashion', 'แฟชั่นผู้หญิง', 'shirt'],
  ['Men Clothing & Fashion', 'แฟชั่นผู้ชาย', 'briefcase'],
  ['Computer & Accessories', 'คอมพิวเตอร์และอุปกรณ์เสริม', 'laptop'],
  ['Automobile & Motorcycle', 'รถยนต์และมอเตอร์ไซค์', 'car'],
  ['Kids & toy', 'เด็กและของเล่น', 'baby'],
  ['Sports & outdoor', 'กีฬาและกิจกรรมกลางแจ้ง', 'dumbbell'],
  ['Jewelry & Watches', 'เครื่องประดับและนาฬิกา', 'watch'],
  ['Cellphones & Tabs', 'มือถือและแท็บเล็ต', 'smartphone'],
  ['Beauty, Health & Hair', 'ความงาม สุขภาพ และเส้นผม', 'sparkles'],
  ['Home Improvement & Tools', 'เครื่องมือช่างและซ่อมบ้าน', 'wrench'],
  ['Home decoration & Appliance', 'ของแต่งบ้านและเครื่องใช้ไฟฟ้า', 'sofa'],
];


async function main() {
  // เคลียร์ข้อมูลเดิม (seed รันซ้ำได้)
  for (const t of ['couponUsage', 'coupon', 'flashDealProduct', 'flashDeal', 'orderStatusHistory', 'orderDetail', 'payment', 'refundRequest', 'order', 'cart', 'wishlist', 'review', 'productStock', 'productTranslation', 'product', 'homeFeaturedCategory', 'categoryTranslation', 'brand', 'slider', 'banner', 'page', 'businessSetting', 'currency', 'language', 'translation', 'address', 'upload', 'userRole', 'rolePermission', 'role', 'permission', 'user'] as const) {
    await (prisma[t] as unknown as { deleteMany: () => Promise<unknown> }).deleteMany();
  }
  await prisma.category.deleteMany({ where: { parentId: { not: null } } });
  await prisma.category.deleteMany();

  // Users
  const pw = (s: string) => bcrypt.hashSync(s, 10);
  const admin = await prisma.user.create({ data: { name: 'Admin', email: 'admin@example.com', password: pw('admin1234'), userType: 'admin' } });
  const staff = await prisma.user.create({ data: { name: 'Order Staff', email: 'staff@example.com', password: pw('staff1234'), userType: 'staff' } });
  await prisma.user.create({ data: { name: 'Demo Customer', email: 'customer@example.com', password: pw('customer1234'), userType: 'customer' } });

  // RBAC
  const permKeys = ['dashboard.view', 'products.manage', 'categories.manage', 'brands.manage', 'orders.manage', 'customers.manage', 'reviews.manage', 'marketing.manage', 'website.manage', 'support.manage'];
  const perms = await Promise.all(permKeys.map((key) => prisma.permission.create({ data: { key } })));
  const orderManager = await prisma.role.create({ data: { name: 'Order Manager' } });
  for (const p of perms.filter((p) => ['dashboard.view', 'orders.manage'].includes(p.key))) {
    await prisma.rolePermission.create({ data: { roleId: orderManager.id, permissionId: p.id } });
  }
  await prisma.userRole.create({ data: { userId: staff.id, roleId: orderManager.id } });

  // ภาพจริงจาก prisma/seed/images → uploads/ + ตาราง uploads (ต้องตั้งค่าก่อนสร้างหมวดหมู่ เพราะ banner หมวดหมู่ก็ใช้ภาพจริงด้วย)
  const imagesDir = path.join(__dirname, 'images');
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'));
  fs.mkdirSync(uploadDir, { recursive: true });
  const credits: Record<string, { file: string; license: string; author: string; page: string }[]> = JSON.parse(fs.readFileSync(path.join(imagesDir, 'credits.json'), 'utf8'));
  const copyImage = async (file: string): Promise<string> => {
    const name = `${crypto.randomUUID()}.jpg`;
    const buf = fs.readFileSync(path.join(imagesDir, file));
    fs.writeFileSync(path.join(uploadDir, name), buf);
    await prisma.upload.create({ data: { fileOriginalName: file, fileName: `/uploads/${name}`, extension: 'jpg', type: 'image', fileSize: buf.length, userId: admin.id } });
    return `/uploads/${name}`;
  };

  // Categories (11 หมวดบน + ลูกบางส่วน) — banner ใช้ภาพสินค้าจริงที่ใกล้เคียงที่สุดในชุดที่มี แทน placeholder
  const CATEGORY_BANNER_IMAGE: Record<string, string> = {
    'Women Clothing & Fashion': 'navy-floral-summer-dress-1.jpg',
    'Men Clothing & Fashion': 'mens-gingham-dress-shirt-purple-1.jpg',
    'Computer & Accessories': 'dell-inspiron-1525-laptop-1.jpg',
    'Automobile & Motorcycle': 'white-ferrari-f12-sports-car-1.jpg',
    'Kids & toy': 'vintage-gottschalk-dollhouse-1.jpg',
    'Sports & outdoor': 'cube-mountain-bike-1.jpg',
    'Jewelry & Watches': 'junghans-mega-wristwatch-1.jpg',
    'Cellphones & Tabs': 'apple-iphone-11-pro-1.jpg',
    'Beauty, Health & Hair': 'day-cream-jar-1.jpg',
    'Home Improvement & Tools': 'panasonic-cordless-drill-driver-1.jpg',
    'Home decoration & Appliance': 'amazon-echo-dot-speaker-1.jpg',
    'Women Dress': 'navy-floral-summer-dress-1.jpg',
    'Women Watches': 'citizen-quartz-two-tone-wristwatch-1.jpg',
    'Men Formal': 'mens-chino-pants-grey-1.jpg',
    'Mobile Phones': 'apple-iphone-11-pro-1.jpg',
    'Baby Dress': 'baby-clothes-set-1.jpg',
    'Doll': 'vintage-gottschalk-dollhouse-1.jpg',
    'Tools': 'red-cordless-drill-with-charger-1.jpg',
  };
  const cat: Record<string, number> = {};
  for (const [i, [key, thaiName, icon]] of TOP_CATEGORIES.entries()) {
    const banner = await copyImage(CATEGORY_BANNER_IMAGE[key]);
    const c = await prisma.category.create({ data: { name: thaiName, slug: slug(key), icon, orderLevel: i, level: 0, banner } });
    cat[key] = c.id;
  }
  const kids: [string, string, string][] = [
    ['Women Dress', 'เดรสผู้หญิง', 'Women Clothing & Fashion'], ['Women Watches', 'นาฬิกาผู้หญิง', 'Jewelry & Watches'], ['Men Formal', 'ชุดทำงานผู้ชาย', 'Men Clothing & Fashion'],
    ['Mobile Phones', 'โทรศัพท์มือถือ', 'Cellphones & Tabs'], ['Baby Dress', 'ชุดเด็กอ่อน', 'Kids & toy'], ['Doll', 'ตุ๊กตา', 'Kids & toy'], ['Tools', 'เครื่องมือช่าง', 'Home Improvement & Tools'],
  ];
  for (const [i, [key, thaiName, parentKey]] of kids.entries()) {
    const banner = await copyImage(CATEGORY_BANNER_IMAGE[key]);
    const c = await prisma.category.create({ data: { name: thaiName, slug: slug(key), parentId: cat[parentKey], level: 1, orderLevel: i, banner } });
    cat[key] = c.id;
  }
  // Featured strip (8)
  const featured = ['Sports & outdoor', 'Mobile Phones', 'Women Watches', 'Women Dress', 'Baby Dress', 'Men Formal', 'Doll', 'Tools'];
  for (const [i, key] of featured.entries()) await prisma.homeFeaturedCategory.create({ data: { categoryId: cat[key], sortOrder: i } });

  // Brands, colors, attributes
  const brandNames = [...new Set(SEED_PRODUCTS.flatMap((p) => (p.brand ? [p.brand] : [])))];
  const brands: Record<string, number> = {};
  for (const name of brandNames) brands[name] = (await prisma.brand.create({ data: { name, slug: slug(name), top: true } })).id;
  await prisma.color.createMany({ data: [{ name: 'Red', code: '#E62E04' }, { name: 'Black', code: '#1B1B28' }] });
  const size = await prisma.attribute.create({ data: { name: 'Size' } });
  await prisma.attributeValue.createMany({ data: ['S', 'M', 'L', 'XL'].map((value) => ({ attributeId: size.id, value })) });

  // Products
  const created: Awaited<ReturnType<typeof prisma.product.create>>[] = [];
  for (const p of SEED_PRODUCTS) {
    const photos: string[] = [];
    for (const c of credits[p.slug] ?? []) {
      photos.push(await copyImage(c.file));
    }
    if (!photos.length) throw new Error(`No images for ${p.slug}`);
    const photoCredits = (credits[p.slug] ?? []).map((c) => (c.license.startsWith('CC0') ? `Photo: ${c.page} (CC0)` : `Photo: ${c.author} — ${c.license} — ${c.page}`)).join(String.fromCharCode(10));
    created.push(
      await prisma.product.create({
        data: {
          name: p.name, slug: p.slug, categoryId: cat[p.category], brandId: p.brand ? brands[p.brand] : null, addedByUserId: admin.id,
          thumbnail: photos[0], photos, photoCredits,
          unitPrice: p.price.toString(), discount: String(p.discountPercent ?? 0), discountType: 'percent', tax: '7', taxType: 'percent',
          currentStock: p.stock, todaysDeal: !!p.todaysDeal, featured: !!p.featured,
          shippingType: p.price > 100 ? 'free' : 'flat_rate', shippingCost: '3', tags: p.tags, description: p.description,
        },
      }),
    );
  }

  // Hero slider — ภาพจริงที่ออกแบบมาโดยเฉพาะ (Mega Sale, สินค้ามาใหม่, จัดส่งฟรี)
  const heroSlides = ['hero-mega-sale-1.jpg', 'hero-new-arrivals-1.jpg', 'hero-free-shipping-1.jpg'];
  for (const [i, file] of heroSlides.entries()) {
    const image = await copyImage(file);
    await prisma.slider.create({ data: { image, link: '/products', sortOrder: i } });
  }
  for (const [i, t] of ['SUPER SALE 50%', 'SUMMER 50% OFF', 'End of Season SALE'].entries()) {
    await prisma.banner.create({ data: { position: (['home_1', 'home_2', 'home_3'] as const)[i], image: img('600x210', t, ['4A4A5A', 'FFA707', 'EF486A'][i]), link: '/products', sortOrder: i } });
  }

  // Currency / Language
  await prisma.currency.createMany({
    data: [
      { name: 'U.S. Dollar', symbol: '$', code: 'USD', exchangeRate: '1', decimalPlaces: 3 },
      { name: 'Thai Baht', symbol: '฿', code: 'THB', exchangeRate: '36.5', decimalPlaces: 2 },
    ],
  });
  await prisma.language.createMany({ data: [{ name: 'English', code: 'en', flag: 'us' }, { name: 'ไทย', code: 'th', flag: 'th' }] });
  const th: Record<string, string> = { login: 'เข้าสู่ระบบ', registration: 'สมัครสมาชิก', categories: 'หมวดหมู่', see_all: 'ดูทั้งหมด', todays_deal: 'ดีลวันนี้', hot: 'ฮอต', search_placeholder: 'ค้นหาสินค้า...', add_to_cart: 'ใส่ตะกร้า', compare: 'เปรียบเทียบ', wishlist: 'รายการโปรด', cart: 'ตะกร้า', best_selling: 'ขายดี', flash_sale: 'แฟลชเซล', logout: 'ออกจากระบบ' };
  await prisma.translation.createMany({ data: Object.entries(th).map(([langKey, langValue]) => ({ lang: 'th', langKey, langValue })) });

  // Marketing
  const now = Date.now();
  await prisma.coupon.create({ data: { code: 'WELCOME10', type: 'cart_base', discount: '10', discountType: 'percent', startDate: new Date(now - 864e5), endDate: new Date(now + 365 * 864e5), perUserLimit: 5, details: { minBuy: 20, maxDiscount: 50 } } });
  await prisma.flashDeal.create({
    data: {
      title: 'Weekend Flash Sale', slug: 'weekend-flash-sale', startDate: new Date(now - 864e5), endDate: new Date(now + 7 * 864e5),
      products: { create: created.filter((p) => ['navy-floral-summer-dress', 'baby-clothes-set', 'teal-yoga-mat', 'cordless-led-desk-lamp'].includes(p.slug)).map((p) => ({ productId: p.id, discount: '30', discountType: 'percent' as const })) },
    },
  });

  // Settings + pages
  await prisma.businessSetting.createMany({
    data: [
      { type: 'site_name', value: 'JITD eCommerce' }, { type: 'base_color', value: '#E62E04' },
      { type: 'todays_deal_enabled', value: '1' }, { type: 'system_default_currency', value: 'THB' },
      { type: 'contact_email', value: 'chakkritnb4456@gmail.com' },
      // ข้อมูลชำระเงินโหมดสาธิต — เลขพร้อมเพย์/บัญชีตัวอย่าง ยังไม่ใช่บัญชีจริง ใช้เพื่อสาธิต UI เท่านั้น
      { type: 'promptpay_id', value: '0812345678' },
      { type: 'bank_name', value: 'ธนาคารกรุงไทย (ตัวอย่าง)' },
      { type: 'bank_account_name', value: 'บริษัท JITD eCommerce จำกัด (ตัวอย่าง)' },
      { type: 'bank_account_number', value: '123-4-56789-0' },
    ],
  });
  const pages: [string, string, string][] = [
    ['เกี่ยวกับเรา', 'about', 'JITD eCommerce คือร้านค้าออนไลน์ที่รวบรวมสินค้าคุณภาพหลากหลายหมวดหมู่ไว้ในที่เดียว เรามุ่งมั่นมอบประสบการณ์ช้อปปิ้งที่สะดวก รวดเร็ว และปลอดภัยให้กับลูกค้าทุกท่าน\n\nแก้ไขเนื้อหาหน้านี้ได้จากหน้าผู้ดูแลระบบ (Admin Panel)'],
    ['ข้อกำหนดและเงื่อนไข', 'terms', 'การใช้งานเว็บไซต์ JITD eCommerce ถือว่าท่านยอมรับข้อกำหนดและเงื่อนไขการให้บริการของเรา ซึ่งรวมถึงนโยบายการสั่งซื้อ การชำระเงิน การจัดส่ง และการคืนสินค้า\n\nแก้ไขเนื้อหาหน้านี้ได้จากหน้าผู้ดูแลระบบ (Admin Panel)'],
    ['นโยบายความเป็นส่วนตัว', 'privacy', 'JITD eCommerce ให้ความสำคัญกับความเป็นส่วนตัวของท่าน ข้อมูลส่วนบุคคลที่ท่านให้ไว้จะถูกเก็บรักษาและใช้เพื่อการให้บริการเท่านั้น จะไม่ถูกเปิดเผยต่อบุคคลภายนอกโดยไม่ได้รับความยินยอม เว้นแต่ตามที่กฎหมายกำหนด\n\nแก้ไขเนื้อหาหน้านี้ได้จากหน้าผู้ดูแลระบบ (Admin Panel)'],
  ];
  for (const [title, s, content] of pages) {
    await prisma.page.create({ data: { title, slug: s, content, type: 'system' } });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete: admin@example.com / admin1234, staff@example.com / staff1234, customer@example.com / customer1234');
}

main().finally(() => prisma.$disconnect());
