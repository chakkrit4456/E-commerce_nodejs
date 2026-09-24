'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, ApiError } from './api';
import { formatPrice } from './format-price';
import { useSession } from './store';
import type { CartData } from './types';

/** แปลข้อความ UI ผ่านพจนานุกรมภาษา (ไม่มี key → ใช้ข้อความอังกฤษเริ่มต้น) */
export function useT(): (key: string, fallback: string) => string {
  const dict = useSession((s) => s.dict);
  return useCallback((key, fallback) => dict[key] ?? fallback, [dict]);
}

export function usePrice(): (amount: number) => string {
  const currency = useSession((s) => s.currency);
  const currencies = useSession((s) => s.currencies);
  return useCallback((amount) => formatPrice(amount, currencies.find((c) => c.code === currency)), [currency, currencies]);
}

/** รอ hydrate จาก localStorage ก่อนแสดงค่าที่ขึ้นกับ session เพื่อไม่ให้ SSR mismatch */
export function useMounted(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function useCartActions() {
  const setCart = useSession((s) => s.setCart);

  const refresh = useCallback(async (): Promise<CartData> => {
    const cart = await api<CartData>('/cart');
    setCart(cart);
    return cart;
  }, [setCart]);

  const add = useCallback(
    async (productId: number, quantity = 1, variation?: string) => {
      try {
        const cart = await api<CartData>('/cart/add', { body: { productId, quantity, variation } });
        setCart(cart);
        toast.success('Added to cart');
        return true;
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : 'Could not add to cart');
        return false;
      }
    },
    [setCart],
  );

  return { add, refresh };
}
