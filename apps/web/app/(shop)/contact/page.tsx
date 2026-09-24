'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, ApiError } from '@/lib/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/contact', { body: form });
      toast.success('Message sent. We will get back to you soon.');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="ae-card mx-auto max-w-lg space-y-3 p-6">
      <h1 className="text-xl font-bold text-ink">Contact us</h1>
      <div><label className="ae-label" htmlFor="c-name">Name</label><input id="c-name" className="ae-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><label className="ae-label" htmlFor="c-email">Email</label><input id="c-email" type="email" className="ae-input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div><label className="ae-label" htmlFor="c-msg">Message</label><textarea id="c-msg" className="ae-input h-28 py-2" required minLength={3} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
      <button className="ae-btn" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}
