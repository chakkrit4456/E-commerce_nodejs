'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/lib/store';
import type { User } from '@/lib/types';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const { tempId, setAuth } = useSession();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = isLogin ? { email: form.email, password: form.password, guestId: tempId } : { ...form, guestId: tempId };
      const r = await api<{ token: string; user: User }>(`/auth/${mode}`, { body });
      setAuth(r.token, r.user);
      toast.success(`Welcome, ${r.user.name}`);
      router.push(r.user.userType === 'customer' ? '/account' : '/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="ae-card mx-auto max-w-md space-y-3 p-6">
      <h1 className="text-xl font-bold text-ink">{isLogin ? 'Login to your account' : 'Create an account'}</h1>
      {!isLogin && (
        <div><label className="ae-label" htmlFor="name">Name</label><input id="name" className="ae-input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      )}
      <div><label className="ae-label" htmlFor="email">Email</label><input id="email" type="email" className="ae-input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div><label className="ae-label" htmlFor="password">Password</label><input id="password" type="password" className="ae-input" required minLength={isLogin ? 1 : 8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />{!isLogin && <p className="mt-1 text-[12px] text-ink-muted">At least 8 characters</p>}</div>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <button className="ae-btn w-full" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Login' : 'Register'}</button>
      <p className="text-center text-ink-muted">
        {isLogin ? <>No account? <Link href="/register" className="text-primary">Register</Link></> : <>Already registered? <Link href="/login" className="text-primary">Login</Link></>}
      </p>
    </form>
  );
}

