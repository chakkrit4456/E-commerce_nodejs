'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartData, Currency, User } from './types';

interface SessionState {
  token: string | null;
  user: User | null;
  tempId: string;
  currency: string;
  lang: string;
  compare: number[];
  cartCount: number;
  wishlistCount: number;
  currencies: Currency[];
  dict: Record<string, string>;
  setAuth: (token: string | null, user: User | null) => void;
  setCurrency: (code: string) => void;
  setLang: (lang: string) => void;
  setCurrencies: (c: Currency[]) => void;
  setDict: (d: Record<string, string>) => void;
  setCart: (cart: Pick<CartData, 'count'>) => void;
  setWishlistCount: (n: number) => void;
  toggleCompare: (id: number) => 'added' | 'removed';
}

const newId = (): string => `g-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

export const MAX_COMPARE = 3;

/** state ฝั่ง client (03-User-Flow: badge Compare/Wishlist/Cart + guest tempUserId) */
export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tempId: newId(),
      currency: 'THB',
      lang: 'th',
      compare: [],
      cartCount: 0,
      wishlistCount: 0,
      currencies: [],
      dict: {},
      setAuth: (token, user) => set({ token, user }),
      setCurrency: (currency) => set({ currency }),
      setLang: (lang) => set({ lang }),
      setCurrencies: (currencies) => set({ currencies }),
      setDict: (dict) => set({ dict }),
      setCart: (cart) => set({ cartCount: cart.count }),
      setWishlistCount: (wishlistCount) => set({ wishlistCount }),
      toggleCompare: (id) => {
        const cur = get().compare;
        if (cur.includes(id)) {
          set({ compare: cur.filter((x) => x !== id) });
          return 'removed';
        }
        // เกินจำนวนสูงสุด → แทนที่อันเก่าสุด
        set({ compare: [...cur, id].slice(-MAX_COMPARE) });
        return 'added';
      },
    }),
    {
      name: 'ae-session',
      partialize: (s) => ({ token: s.token, user: s.user, tempId: s.tempId, currency: s.currency, lang: s.lang, compare: s.compare }),
    },
  ),
);
