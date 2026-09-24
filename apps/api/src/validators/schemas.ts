import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  guestId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  guestId: z.string().optional(),
});

export const cartAddSchema = z.object({
  productId: z.number().int().positive(),
  variation: z.string().optional(),
  quantity: z.number().int().min(1).max(999).default(1),
});

export const cartUpdateSchema = z.object({
  id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(999),
});

export const cartRemoveSchema = z.object({ id: z.number().int().positive() });

export const listQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular', 'rating']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(60).default(24),
});

export const addressSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  address: z.string().min(3),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().default('TH'),
  postalCode: z.string().min(3),
});

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  paymentType: z.enum(['cod']).default('cod'),
  couponCode: z.string().optional(),
  currencyCode: z.string().default('USD'),
  notes: z.string().max(500).optional(),
  guestEmail: z.string().email().optional(),
});

// รูปต้องมาจากไฟล์ที่อัปโหลด (/uploads/..), placeholder ภายใน หรือ URL https
export const imageUrl = z.string().max(500).regex(/^(\/uploads\/[\w.-]+|\/api\/img\/\S+|https:\/\/\S+)$/, 'Invalid image URL');

export const productInputSchema = z.object({
  name: z.string().min(1).max(255),
  categoryId: z.number().int().positive(),
  brandId: z.number().int().positive().nullish(),
  thumbnail: imageUrl.nullish(),
  photos: z.array(imageUrl).max(10).optional(),
  tags: z.string().default(''),
  description: z.string().default(''),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['amount', 'percent']).default('amount'),
  tax: z.number().min(0).default(0),
  taxType: z.enum(['amount', 'percent']).default('percent'),
  currentStock: z.number().int().min(0).default(0),
  shippingType: z.enum(['free', 'flat_rate', 'zone']).default('free'),
  shippingCost: z.number().min(0).default(0),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
  todaysDeal: z.boolean().default(false),
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
});
export const productPatchSchema = productInputSchema.partial();
