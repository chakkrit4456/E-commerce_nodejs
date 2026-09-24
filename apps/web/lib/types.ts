export interface ProductDTO {
  id: number;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  todaysDeal: boolean;
  featured: boolean;
  currentStock: number;
  categoryId: number;
  brandId: number | null;
  onFlashDeal: boolean;
}

export interface HomeData {
  settings: Record<string, string>;
  categories: { id: number; name: string; slug: string; icon: string | null; children: { id: number; name: string; slug: string }[] }[];
  sliders: { id: number; image: string; link: string }[];
  featuredCategories: { id: number; name: string; slug: string; banner: string | null }[];
  todaysDeal: ProductDTO[];
  banners: { id: number; image: string; link: string; position: string }[];
  bestSelling: ProductDTO[];
  flashDeal: { id: number; title: string; slug: string; endDate: string; products: ProductDTO[] } | null;
}

export interface FlashDealDetail {
  id: number;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  active: boolean;
  products: ProductDTO[];
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  symbolPosition: string;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandSeparator: string;
}

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  slug: string;
  thumbnail: string | null;
  variation: string | null;
  quantity: number;
  price: number;
  lineTotal: number;
  stock: number;
}

export interface CartData {
  items: CartItem[];
  count: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  couponDiscount: number;
  couponError?: string;
  grandTotal: number;
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  userType: 'admin' | 'staff' | 'customer';
}

export interface Paged<T> {
  total: number;
  page: number;
  perPage?: number;
  items: T[];
}
