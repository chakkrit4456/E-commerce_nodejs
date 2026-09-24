'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, ApiError } from '@/lib/api';

export default function Footer({ siteName, email }: { siteName: string; email: string }) {
  const [mail, setMail] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/subscribe', { body: { email: mail } });
      toast.success('Subscribed!');
      setMail('');
    } catch (err) {
      toast.error(err instanceof ApiError ? 'Please enter a valid email' : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="mt-10 bg-ink pb-20 pt-10 text-[13px] text-white/70 md:pb-10">
      <div className="container grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="mb-3 font-bold text-white">Newsletter</h3>
          <form onSubmit={subscribe} className="flex gap-2">
            <input type="email" required className="ae-input" placeholder="Your email" value={mail} onChange={(e) => setMail(e.target.value)} aria-label="Email" />
            <button className="ae-btn" disabled={busy}>{busy ? '…' : 'Subscribe'}</button>
          </form>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-white">Information</h3>
          <ul className="space-y-1">
            <li><Link href="/page/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/page/terms" className="hover:text-white">Terms &amp; Conditions</Link></li>
            <li><Link href="/page/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-white">Contact</h3>
          <p>{email}</p>
          <p className="mt-3 text-[12px]">We accept: Cash on delivery</p>
        </div>
      </div>
      <p className="container mt-8 border-t border-white/10 pt-4 text-center text-[12px]">© {new Date().getFullYear()} {siteName}</p>
    </footer>
  );
}
