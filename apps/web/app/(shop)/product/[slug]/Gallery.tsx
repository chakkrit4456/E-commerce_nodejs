'use client';

import { useState } from 'react';
import { imgSrc } from '@/lib/format-price';

export default function Gallery({ photos, name }: { photos: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const list = photos.length ? photos : [''];
  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgSrc(list[active])} alt={name} className="aspect-square w-full rounded-card bg-body object-contain" />
      {list.length > 1 && (
        <ul className="flex flex-wrap gap-2">
          {list.map((src, i) => (
            <li key={src}>
              <button type="button" onClick={() => setActive(i)} aria-label={`แสดงรูปที่ ${i + 1}`} aria-current={i === active} className={`h-16 w-16 overflow-hidden rounded-card border-2 ${i === active ? 'border-primary' : 'border-line'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
