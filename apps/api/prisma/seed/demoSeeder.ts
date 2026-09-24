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

const TOP_CATEGORIES: [string, string][] = [
  ['Women Clothing & Fashion', 'shirt'],
  ['Men Clothing & Fashion', 'briefcase'],
  ['Computer & Accessories', 'laptop'],
  ['Automobile & Motorcycle', 'car'],
  ['Kids & toy', 'baby'],
  ['Sports & outdoor', 'dumbbell'],
  ['Jewelry & Watches', 'watch'],
  ['Cellphones & Tabs', 'smartphone'],
  ['Beauty, Health & Hair', 'sparkles'],
  ['Home Improvement & Tools', 'wrench'],
  ['Home decoration & Appliance', 'sofa'],
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

  // Categories (11 หมวดบน + ลูกบางส่วน)
  const cat: Record<string, number> = {};
  for (const [i, [name, icon]] of TOP_CATEGORIES.entries()) {
    const c = await prisma.category.create({ data: { name, slug: slug(name), icon, orderLevel: i, level: 0, banner: img('96x96', name.split(' ')[0], 'FDE3DC') } });
    cat[name] = c.id;
  }
  const kids: [string, string][] = [
    ['Women Dress', 'Women Clothing & Fashion'], ['Women Watches', 'Jewelry & Watches'], ['Men Formal', 'Men Clothing & Fashion'],
    ['Mobile Phones', 'Cellphones & Tabs'], ['Baby Dress', 'Kids & toy'], ['Doll', 'Kids & toy'], ['Tools', 'Home Improvement & Tools'],
  ];
  for (const [i, [name, parent]] of kids.entries()) {
    const c = await prisma.category.create({ data: { name, slug: slug(name), parentId: cat[parent], level: 1, orderLevel: i, banner: img('96x96', name.split(' ')[0], 'FDE3DC') } });
    cat[name] = c.id;
  }
  // Featured strip (8)
  const featured = ['Sports & outdoor', 'Mobile Phones', 'Women Watches', 'Women Dress', 'Baby Dress', 'Men Formal', 'Doll', 'Tools'];
  for (const [i, name] of featured.entries()) await prisma.homeFeaturedCategory.create({ data: { categoryId: cat[name], sortOrder: i } });

  // Brands, colors, attributes
  const brandNames = [...new Set(SEED_PRODUCTS.flatMap((p) => (p.brand ? [p.brand] : [])))];
  const brands: Record<string, number> = {};
  for (const name of brandNames) brands[name] = (await prisma.brand.create({ data: { name, slug: slug(name), top: true } })).id;
  await prisma.color.createMany({ data: [{ name: 'Red', code: '#E62E04' }, { name: 'Black', code: '#1B1B28' }] });
  const size = await prisma.attribute.create({ data: { name: 'Size' } });
  await prisma.attributeValue.createMany({ data: ['S', 'M', 'L', 'XL'].map((value) => ({ attributeId: size.id, value })) });

  // Products (ภาพจริงจาก prisma/seed/images → uploads/ + ตาราง uploads)
  const imagesDir = path.join(__dirname, 'images');
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'));
  fs.mkdirSync(uploadDir, { recursive: true });
  const credits: Record<string, { file: string; license: string; author: string; page: string }[]> = JSON.parse(fs.readFileSync(path.join(imagesDir, 'credits.json'), 'utf8'));
  const created: Awaited<ReturnType<typeof prisma.product.create>>[] = [];
  for (const p of SEED_PRODUCTS) {
    const photos: string[] = [];
    for (const c of credits[p.slug] ?? []) {
      const name = `${crypto.randomUUID()}.jpg`;
      const buf = fs.readFileSync(path.join(imagesDir, c.file));
      fs.writeFileSync(path.join(uploadDir, name), buf);
      await prisma.upload.create({ data: { fileOriginalName: c.file, fileName: `/uploads/${name}`, extension: 'jpg', type: 'image', fileSize: buf.length, userId: admin.id } });
      photos.push(`/uploads/${name}`);
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

  // Sliders + Banners
  for (const [i, t] of ['Mega Sale', 'New Arrivals', 'Free Shipping'].entries()) {
    await prisma.slider.create({ data: { image: img('1100x440', t, ['E62E04', '0ABB75', 'FFA707'][i]), link: '/products', sortOrder: i } });
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
      { type: 'site_name', value: 'Active eCommerce' }, { type: 'base_color', value: '#E62E04' },
      { type: 'todays_deal_enabled', value: '1' }, { type: 'system_default_currency', value: 'USD' },
      { type: 'contact_email', value: 'support@example.com' },
    ],
  });
  for (const [title, s] of [['About Us', 'about'], ['Terms & Conditions', 'terms'], ['Privacy Policy', 'privacy']]) {
    await prisma.page.create({ data: { title, slug: s, content: `${title} — edit this page from the admin panel.`, type: 'system' } });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete: admin@example.com / admin1234, staff@example.com / staff1234, customer@example.com / customer1234');
}

main().finally(() => prisma.$disconnect());
