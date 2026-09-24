'use client';

import { usePrice } from '@/lib/hooks';

export function Price({ value, original, className = '' }: { value: number; original?: number; className?: string }) {
  const fmt = usePrice();
  return (
    <span className={className}>
      <span className="font-bold text-primary">{fmt(value)}</span>
      {original !== undefined && original > value && (
        <del className="ml-1 text-[11px] font-normal text-ink-muted">{fmt(original)}</del>
      )}
    </span>
  );
}
