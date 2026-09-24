'use client';

import { Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCartActions, useT } from '@/lib/hooks';
import type { ProductDTO } from '@/lib/types';

export default function BuyBox({ product, variants }: { product: ProductDTO; variants: { id: number; variant: string; qty: number }[] }) {
  const t = useT();
  const router = useRouter();
  const { add } = useCartActions();
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState(variants[0]?.variant);
  const [busy, setBusy] = useState(false);
  const out = product.currentStock < 1;

  const submit = async (buyNow: boolean) => {
    setBusy(true);
    const ok = await add(product.id, qty, variant);
    setBusy(false);
    if (ok && buyNow) router.push('/checkout');
  };

  return (
    <div className="space-y-3">
      {variants.length > 0 && (
        <div>
          <span className="ae-label">ตัวเลือกสินค้า</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button key={v.id} type="button" disabled={v.qty < 1} onClick={() => setVariant(v.variant)} aria-pressed={variant === v.variant}
                className={`min-w-10 rounded-card border px-3 py-1.5 ${variant === v.variant ? 'border-primary text-primary' : 'border-line'} disabled:opacity-40`}>
                {v.variant}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="ae-label !mb-0">จำนวน</span>
        <button type="button" className="ae-btn-outline h-9 w-9 !p-0" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="ลดจำนวน"><Minus size={16} /></button>
        <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
        <button type="button" className="ae-btn-outline h-9 w-9 !p-0" onClick={() => setQty(Math.min(product.currentStock, qty + 1))} aria-label="เพิ่มจำนวน"><Plus size={16} /></button>
      </div>
      <div className="flex gap-2">
        <button className="ae-btn" disabled={out || busy} onClick={() => submit(false)}>{busy ? '…' : t('add_to_cart', 'ใส่ตะกร้า')}</button>
        <button className="ae-btn-outline" disabled={out || busy} onClick={() => submit(true)}>ซื้อทันที</button>
      </div>
    </div>
  );
}
