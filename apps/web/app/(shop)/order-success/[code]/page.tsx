'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { usePrice } from '@/lib/hooks';

interface Order {
  code: string;
  grandTotal: number;
  deliveryStatus: string;
  paymentType: string;
  paymentStatus: string;
  details: { id: number; productName: string; quantity: number; price: number }[];
}

const PAYMENT_LABEL: Record<string, string> = {
  cod: 'เก็บเงินปลายทาง',
  promptpay: 'พร้อมเพย์ (QR Code)',
  bank_transfer: 'โอนผ่านบัญชีธนาคาร',
};

function PromptPayBlock({ code }: { code: string }) {
  const [qr, setQr] = useState<{ qrDataUrl: string; amount: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ qrDataUrl: string; amount: number }>(`/orders/${code}/promptpay-qr`)
      .then(setQr)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'ไม่สามารถสร้าง QR ได้'));
  }, [code]);

  if (error) return <p className="text-danger">{error}</p>;
  if (!qr) return <div className="mx-auto h-40 w-40 animate-pulse rounded bg-body" />;
  return (
    <div className="mx-auto max-w-[240px] space-y-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr.qrDataUrl} alt="QR พร้อมเพย์" className="mx-auto h-56 w-56" />
      <p className="text-[12px] text-ink-muted">สแกนด้วยแอปธนาคารเพื่อชำระ {qr.amount.toLocaleString('th-TH')} บาท</p>
    </div>
  );
}

function BankTransferBlock() {
  const [info, setInfo] = useState<{ bankName: string; bankAccountName: string; bankAccountNumber: string } | null>(null);
  useEffect(() => {
    api<{ bankName: string; bankAccountName: string; bankAccountNumber: string }>('/payment-settings').then(setInfo).catch(() => undefined);
  }, []);
  if (!info) return null;
  return (
    <div className="mx-auto max-w-xs space-y-1 rounded-card bg-body p-3 text-left">
      <p><span className="text-ink-muted">ธนาคาร:</span> {info.bankName}</p>
      <p><span className="text-ink-muted">ชื่อบัญชี:</span> {info.bankAccountName}</p>
      <p><span className="text-ink-muted">เลขบัญชี:</span> <strong>{info.bankAccountNumber}</strong></p>
    </div>
  );
}

function SlipUpload({ code }: { code: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append('slip', file);
      const res = await fetch(`/api/orders/${code}/slip`, { method: 'POST', body });
      if (!res.ok) throw new Error();
      setDone(true);
      toast.success('อัปโหลดสลิปแล้ว รอแอดมินตรวจสอบและยืนยัน');
    } catch {
      toast.error('อัปโหลดสลิปไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p className="text-success">ได้รับสลิปแล้ว — รอแอดมินตรวจสอบและยืนยันการชำระเงิน</p>;
  return (
    <label className="ae-btn-outline mx-auto block w-fit cursor-pointer">
      {busy ? 'กำลังอัปโหลด…' : 'แนบสลิปการโอนเงิน'}
      <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
    </label>
  );
}

export default function OrderSuccess({ params }: { params: { code: string } }) {
  const fmt = usePrice();
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api<Order>(`/orders/track/${params.code}`).then(setOrder).catch(() => setMissing(true));
  }, [params.code]);

  const needsSlip = order && (order.paymentType === 'promptpay' || order.paymentType === 'bank_transfer') && order.paymentStatus !== 'paid';

  return (
    <div className="ae-card mx-auto max-w-xl space-y-3 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-white" aria-hidden><Check size={30} strokeWidth={3} /></div>
      <h1 className="text-xl font-bold text-ink">ขอบคุณสำหรับคำสั่งซื้อ!</h1>
      <p>หมายเลขคำสั่งซื้อของคุณคือ <strong className="text-primary">{params.code}</strong></p>
      {order && (
        <div className="space-y-1 border-t border-line pt-3 text-left">
          {order.details.map((d) => <div key={d.id} className="flex justify-between"><span>{d.productName} × {d.quantity}</span><span>{fmt(Number(d.price) * d.quantity)}</span></div>)}
          <div className="flex justify-between border-t border-line pt-2 font-bold text-ink"><span>ยอดรวม ({PAYMENT_LABEL[order.paymentType] ?? order.paymentType})</span><span>{fmt(Number(order.grandTotal))}</span></div>
        </div>
      )}
      {order?.paymentType === 'promptpay' && order.paymentStatus !== 'paid' && (
        <div className="space-y-3 border-t border-line pt-4">
          <p className="rounded bg-warning/10 px-2 py-1 text-[12px] text-warning">โหมดทดสอบ — ยังไม่มีการเรียกเก็บเงินจริงผ่านระบบอัตโนมัติ</p>
          <PromptPayBlock code={params.code} />
        </div>
      )}
      {order?.paymentType === 'bank_transfer' && order.paymentStatus !== 'paid' && (
        <div className="space-y-3 border-t border-line pt-4">
          <p className="rounded bg-warning/10 px-2 py-1 text-[12px] text-warning">โหมดทดสอบ — ยังไม่มีการเรียกเก็บเงินจริงผ่านระบบอัตโนมัติ</p>
          <BankTransferBlock />
        </div>
      )}
      {needsSlip && <SlipUpload code={params.code} />}
      {order?.paymentStatus === 'paid' && <p className="text-success">ยืนยันการชำระเงินแล้ว</p>}
      {missing && <p className="text-ink-muted">ดูรายละเอียดคำสั่งซื้อได้เฉพาะจากอุปกรณ์ที่ใช้สั่งซื้อเท่านั้น</p>}
      <div className="flex justify-center gap-2 pt-2">
        <Link href="/products" className="ae-btn">เลือกซื้อสินค้าต่อ</Link>
        <Link href="/account" className="ae-btn-outline">คำสั่งซื้อของฉัน</Link>
      </div>
    </div>
  );
}
