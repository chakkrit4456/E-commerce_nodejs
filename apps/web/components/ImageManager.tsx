'use client';

import { ImagePlus, Replace, Star, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError, uploadImages } from '@/lib/api';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

/** จัดการรูปสินค้า: อัปโหลดหลายรูป, เปลี่ยนรูป, ลบ, ตั้งเป็นรูปหลัก (รูปแรก = thumbnail) */
export default function ImageManager({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceAt, setReplaceAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const check = (files: File[]): File[] =>
    files.filter((f) => {
      if (!ACCEPT.split(',').includes(f.type)) return toast.error(`${f.name}: only JPG, PNG, WebP or GIF`), false;
      if (f.size > MAX_BYTES) return toast.error(`${f.name}: larger than 5MB`), false;
      return true;
    });

  const add = async (list: FileList | null) => {
    const files = check(Array.from(list ?? [])).slice(0, MAX_IMAGES - photos.length);
    if (!files.length) return;
    setBusy(true);
    try {
      const up = await uploadImages(files);
      onChange([...photos, ...up.map((u) => u.url)]);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (addRef.current) addRef.current.value = '';
    }
  };

  const replace = async (list: FileList | null) => {
    const idx = replaceAt;
    const [file] = check(Array.from(list ?? []));
    if (idx === null || !file) return;
    setBusy(true);
    try {
      const [u] = await uploadImages([file]);
      onChange(photos.map((p, i) => (i === idx ? u.url : p)));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      setReplaceAt(null);
      if (replaceRef.current) replaceRef.current.value = '';
    }
  };

  const iconBtn = 'flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-card hover:bg-primary hover:text-white';

  return (
    <div>
      <span className="ae-label">Images ({photos.length}/{MAX_IMAGES}) — the first image is the main image</span>
      <ul className="flex flex-wrap gap-3">
        {photos.map((src, i) => (
          <li key={`${src}-${i}`} className={`relative h-28 w-28 overflow-hidden rounded-card border-2 ${i === 0 ? 'border-primary' : 'border-line'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 text-[10px] font-bold text-white">Main</span>}
            <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1">
              {i !== 0 && (
                <button type="button" className={iconBtn} title="Set as main" aria-label="Set as main image" onClick={() => onChange([src, ...photos.filter((_, j) => j !== i)])}>
                  <Star size={14} />
                </button>
              )}
              <button type="button" className={iconBtn} title="Replace" aria-label="Replace image" disabled={busy} onClick={() => { setReplaceAt(i); replaceRef.current?.click(); }}>
                <Replace size={14} />
              </button>
              <button type="button" className={iconBtn} title="Remove" aria-label="Remove image" onClick={() => onChange(photos.filter((_, j) => j !== i))}>
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
        {photos.length < MAX_IMAGES && (
          <li>
            <button type="button" disabled={busy} onClick={() => addRef.current?.click()} className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-line text-ink-muted hover:border-primary hover:text-primary disabled:opacity-60">
              {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <ImagePlus size={24} />}
              <span className="text-[12px]">{busy ? 'Uploading…' : 'Upload'}</span>
            </button>
          </li>
        )}
      </ul>
      <input ref={addRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => add(e.target.files)} />
      <input ref={replaceRef} type="file" accept={ACCEPT} hidden onChange={(e) => replace(e.target.files)} />
      <p className="mt-1 text-[12px] text-ink-muted">JPG, PNG, WebP or GIF, up to 5MB each.</p>
    </div>
  );
}
