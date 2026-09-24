'use client';

import { useEffect, useState } from 'react';

/** นับถอยหลังเวลาสิ้นสุดแฟลชเซล ใช้ร่วมกันระหว่างหน้าแรกและหน้าแฟลชเซลเฉพาะ */
export default function FlashSaleCountdown({ end }: { end: string }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(end).getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, new Date(end).getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [end]);
  const total = Math.floor(left / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const box = 'flex h-8 min-w-8 items-center justify-center rounded bg-primary px-1 font-bold text-white';

  if (left <= 0) {
    return <span className="rounded bg-line px-2 py-1 text-sm font-semibold text-ink-muted">หมดเวลาแล้ว</span>;
  }
  return (
    <div className="flex items-center gap-1" role="timer" aria-label="เวลาที่เหลือ">
      <span className={box}>{d}ว.</span><span className={box}>{String(h).padStart(2, '0')}</span>:
      <span className={box}>{String(m).padStart(2, '0')}</span>:<span className={box}>{String(s).padStart(2, '0')}</span>
    </div>
  );
}
