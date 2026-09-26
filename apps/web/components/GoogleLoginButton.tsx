'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface GoogleId {
  initialize(o: { client_id: string; callback: (r: { credential: string }) => void }): void;
  renderButton(el: HTMLElement, o: Record<string, unknown>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT = 'https://accounts.google.com/gsi/client';

function loadScript(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    if (!s) {
      s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener('load', () => resolve());
    s.addEventListener('error', () => reject(new Error('load failed')));
  });
}

/** ปุ่ม "Sign in with Google" — แสดงเฉพาะเมื่อ API ตั้งค่า GOOGLE_CLIENT_ID แล้ว */
export default function GoogleLoginButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { clientId } = await api<{ clientId: string | null }>('/auth/google/config');
        if (!clientId || cancelled) return;
        await loadScript();
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => cb.current(r.credential) });
        window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', text: 'continue_with', locale: 'th', width: ref.current.offsetWidth || 320 });
        setEnabled(true);
      } catch {
        /* ไม่มี config หรือโหลด Google ไม่ได้ → ซ่อนปุ่ม */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={enabled ? 'space-y-3' : 'hidden'}>
      <div className="flex items-center gap-2 text-[12px] text-ink-muted">
        <span className="h-px flex-1 bg-current opacity-30" />หรือ<span className="h-px flex-1 bg-current opacity-30" />
      </div>
      <div ref={ref} className="flex w-full justify-center" />
    </div>
  );
}
