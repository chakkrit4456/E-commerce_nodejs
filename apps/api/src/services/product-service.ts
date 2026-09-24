import type { Product } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { discountPercent, unitPriceAfterDiscount, type FlashDiscount } from './pricing-service';

export async function activeFlashMap(now = new Date()): Promise<Map<number, FlashDiscount>> {
  const rows = await prisma.flashDealProduct.findMany({
    where: { flashDeal: { status: true, startDate: { lte: now }, endDate: { gte: now } } },
  });
  return new Map(rows.map((r) => [r.productId, { discount: r.discount.toString(), discountType: r.discountType }]));
}

export function toProductDTO(p: Product, flash?: FlashDiscount | null) {
  const price = unitPriceAfterDiscount(p, flash);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    thumbnail: p.thumbnail,
    price: price.toNumber(),
    originalPrice: Number(p.unitPrice),
    discountPercent: discountPercent(p.unitPrice.toString(), price),
    rating: Number(p.rating),
    todaysDeal: p.todaysDeal,
    featured: p.featured,
    currentStock: p.currentStock,
    categoryId: p.categoryId,
    brandId: p.brandId,
    onFlashDeal: !!flash,
  };
}

export async function toProductDTOs(products: Product[]) {
  const flash = await activeFlashMap();
  return products.map((p) => toProductDTO(p, flash.get(p.id)));
}
