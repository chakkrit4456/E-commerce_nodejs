import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();
const guest = 'guest-test-1';
const addr = { name: 'Guest', phone: '0812345678', address: '1 Main St', city: 'Bangkok', postalCode: '10110' };
let adminToken = '';
let customerToken = '';
let staffToken = '';

const login = async (email: string, password: string): Promise<string> =>
  (await request(app).post('/api/auth/login').send({ email, password })).body.token;

beforeAll(async () => {
  adminToken = await login('admin@example.com', 'admin1234');
  customerToken = await login('customer@example.com', 'customer1234');
  staffToken = await login('staff@example.com', 'staff1234');
});

describe('storefront', () => {
  it('serves home page data matching the design', async () => {
    const r = await request(app).get('/api/home').expect(200);
    expect(r.body.categories).toHaveLength(11);
    expect(r.body.sliders).toHaveLength(3);
    expect(r.body.featuredCategories).toHaveLength(8);
    expect(r.body.banners).toHaveLength(3);
    expect(r.body.todaysDeal.length).toBeGreaterThanOrEqual(4);
    expect(typeof r.body.todaysDeal[0].price).toBe('number');
  });

  it('live search needs >= 2 chars and returns grouped results', async () => {
    expect((await request(app).get('/api/search?q=a')).body.products).toEqual([]);
    const r = await request(app).get('/api/search?q=watch').expect(200);
    expect(r.body.products.length).toBeGreaterThan(0);
  });

  it('filters/sorts product listing and includes child categories', async () => {
    const r = await request(app).get('/api/products?category=kids-toy&sort=price_asc').expect(200);
    const prices = r.body.items.map((i: { price: number }) => i.price);
    expect(prices.length).toBeGreaterThan(0);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it('returns 404 for unknown product and validates list query', async () => {
    await request(app).get('/api/products/nope').expect(404);
    await request(app).get('/api/products?page=0').expect(400);
  });
});

describe('cart, coupon & checkout', () => {
  it('rejects cart without owner id', async () => {
    await request(app).get('/api/cart').expect(400);
  });

  it('adds to cart, computes totals server-side, applies coupon and checks out as guest', async () => {
    const p = (await request(app).get('/api/products/navy-floral-summer-dress')).body;
    const add = await request(app).post('/api/cart/add').set('x-temp-user-id', guest).send({ productId: p.id, quantity: 2 }).expect(201);
    expect(add.body.count).toBe(2);
    expect(add.body.subtotal).toBeCloseTo(p.price * 2, 2);

    const withCoupon = await request(app).get('/api/cart?coupon=WELCOME10').set('x-temp-user-id', guest);
    expect(withCoupon.body.couponDiscount).toBeGreaterThan(0);
    expect((await request(app).get('/api/cart?coupon=BOGUS').set('x-temp-user-id', guest)).body.couponError).toBeTruthy();

    const before = (await request(app).get('/api/products/navy-floral-summer-dress')).body.currentStock;
    const order = await request(app)
      .post('/api/checkout')
      .set('x-temp-user-id', guest)
      .send({ couponCode: 'WELCOME10', shippingAddress: addr })
      .expect(201);
    expect(order.body.code).toMatch(/^\d{8}-\d{6}$/);
    expect((await request(app).get('/api/products/navy-floral-summer-dress')).body.currentStock).toBe(before - 2);
    expect((await request(app).get('/api/cart').set('x-temp-user-id', guest)).body.count).toBe(0);
    await request(app).get(`/api/orders/track/${order.body.code}`).set('x-temp-user-id', guest).expect(200);
    await request(app).get(`/api/orders/track/${order.body.code}`).set('x-temp-user-id', 'someone-else').expect(404);
  });

  it('refuses quantity above stock and empty-cart checkout', async () => {
    const p = (await request(app).get('/api/products/teal-yoga-mat')).body;
    await request(app).post('/api/cart/add').set('x-temp-user-id', 'g2').send({ productId: p.id, quantity: 999 }).expect(400);
    await request(app).post('/api/checkout').set('x-temp-user-id', 'g3').send({ shippingAddress: addr }).expect(400);
  });

  it('merges guest cart into user cart on login', async () => {
    const p = (await request(app).get('/api/products/baby-clothes-set')).body;
    await request(app).post('/api/cart/add').set('x-temp-user-id', 'g-merge').send({ productId: p.id, quantity: 1 }).expect(201);
    const token = (
      await request(app).post('/api/auth/login').send({ email: 'customer@example.com', password: 'customer1234', guestId: 'g-merge' })
    ).body.token;
    const cart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(cart.body.items.some((i: { productId: number }) => i.productId === p.id)).toBe(true);
  });
});

describe('auth & RBAC', () => {
  it('rejects wrong password and duplicate registration', async () => {
    await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'wrong' }).expect(401);
    await request(app).post('/api/auth/register').send({ name: 'Dup', email: 'admin@example.com', password: 'password123' }).expect(409);
  });

  it('blocks non-admins from admin API', async () => {
    await request(app).get('/api/admin/dashboard').expect(401);
    await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${customerToken}`).expect(403);
  });

  it('staff only gets permitted modules', async () => {
    await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${staffToken}`).expect(200);
    await request(app).get('/api/admin/products').set('Authorization', `Bearer ${staffToken}`).expect(403);
  });
});

describe('admin', () => {
  const auth = () => ({ Authorization: `Bearer ${adminToken}` });

  it('dashboard returns KPIs', async () => {
    const r = await request(app).get('/api/admin/dashboard').set(auth()).expect(200);
    expect(r.body.monthlySales).toHaveLength(12);
  });

  it('toggling Todays Deal updates the home page (cache invalidated)', async () => {
    const p = (await request(app).get('/api/products/teal-yoga-mat')).body;
    const home1 = (await request(app).get('/api/home')).body.todaysDeal.length;
    await request(app).put(`/api/admin/products/${p.id}`).set(auth()).send({ todaysDeal: true }).expect(200);
    const home2 = (await request(app).get('/api/home')).body.todaysDeal.length;
    expect(home2).toBe(home1 + 1);
  });

  it('creates a product and validates input', async () => {
    await request(app).post('/api/admin/products').set(auth()).send({ name: '' }).expect(400);
    const cat = (await request(app).get('/api/categories')).body[0];
    const r = await request(app)
      .post('/api/admin/products')
      .set(auth())
      .send({ name: 'Test Item', categoryId: cat.id, unitPrice: 9.5, currentStock: 3 })
      .expect(201);
    expect(r.body.slug).toBe('test-item');
  });

  it('limits featured categories to 8', async () => {
    const ids = (await request(app).get('/api/categories')).body.map((c: { id: number }) => c.id);
    await request(app).put('/api/admin/featured-categories').set(auth()).send({ categoryIds: ids.slice(0, 9) }).expect(400);
    await request(app).put('/api/admin/featured-categories').set(auth()).send({ categoryIds: ids.slice(0, 8) }).expect(200);
  });

  it('order status flow records history and restocks on cancel', async () => {
    const p = (await request(app).get('/api/products/vintage-gottschalk-dollhouse')).body;
    await request(app).post('/api/cart/add').set('x-temp-user-id', 'g-cancel').send({ productId: p.id, quantity: 1 });
    const o = (await request(app).post('/api/checkout').set('x-temp-user-id', 'g-cancel').send({ shippingAddress: addr })).body;
    const stockAfterOrder = (await request(app).get('/api/products/vintage-gottschalk-dollhouse')).body.currentStock;
    await request(app).put(`/api/admin/orders/${o.id}/status`).set(auth()).send({ deliveryStatus: 'confirmed' }).expect(200);
    await request(app).put(`/api/admin/orders/${o.id}/status`).set(auth()).send({ deliveryStatus: 'cancelled' }).expect(200);
    expect((await request(app).get('/api/products/vintage-gottschalk-dollhouse')).body.currentStock).toBe(stockAfterOrder + 1);
    await request(app).put(`/api/admin/orders/${o.id}/status`).set(auth()).send({ deliveryStatus: 'delivered' }).expect(400);
    const detail = (await request(app).get(`/api/admin/orders/${o.id}`).set(auth())).body;
    expect(detail.history.map((h: { status: string }) => h.status)).toEqual(['pending', 'confirmed', 'cancelled']);
  });
});

describe('image uploads', () => {
  const auth = () => ({ Authorization: `Bearer ${adminToken}` });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

  it('requires an admin/staff login', async () => {
    await request(app).post('/api/admin/uploads').attach('files', png, 'a.png').expect(401);
    await request(app).post('/api/admin/uploads').set('Authorization', `Bearer ${customerToken}`).attach('files', png, 'a.png').expect(403);
  });

  it('stores a real image, serves it, and attaches it to a product', async () => {
    const up = await request(app).post('/api/admin/uploads').set(auth()).attach('files', png, 'photo.png').expect(201);
    const url: string = up.body[0].url;
    expect(url).toMatch(/^\/uploads\/[\w-]+\.png$/);
    expect((await request(app).get(url).expect(200)).headers['content-type']).toContain('image/png');

    const p = (await request(app).get('/api/products/baby-clothes-set')).body;
    await request(app).put(`/api/admin/products/${p.id}`).set(auth()).send({ photos: [url] }).expect(200);
    const after = (await request(app).get('/api/products/baby-clothes-set')).body;
    expect(after.thumbnail).toBe(url);
    expect(after.photos).toEqual([url]);
  });

  it('rejects non-images, SVG (XSS) and oversized files even if the extension lies', async () => {
    await request(app).post('/api/admin/uploads').set(auth()).attach('files', Buffer.from('hello'), 'fake.png').expect(400);
    await request(app).post('/api/admin/uploads').set(auth()).attach('files', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'x.svg').expect(400);
    const big = Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024 + 10)]);
    await request(app).post('/api/admin/uploads').set(auth()).attach('files', big, 'big.png').expect(400);
  });

  it('rejects unsafe image URLs on products', async () => {
    const p = (await request(app).get('/api/products/baby-clothes-set')).body;
    await request(app).put(`/api/admin/products/${p.id}`).set(auth()).send({ photos: ['javascript:alert(1)'] }).expect(400);
    await request(app).put(`/api/admin/products/${p.id}`).set(auth()).send({ thumbnail: 'http://insecure.example/x.jpg' }).expect(400);
  });
});
