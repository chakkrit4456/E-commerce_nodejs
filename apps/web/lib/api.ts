const SERVER_API = process.env.API_URL ?? 'http://localhost:4000';

/** ใช้ใน Server Component: เรียก API ตรง ไม่ cache เพราะราคา/สต็อกเปลี่ยนได้ (cache หน้าแรกทำที่ API แล้ว) */
export async function serverGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_API}/api${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const read = (key: string): string | null => {
  try {
    return JSON.parse(localStorage.getItem('ae-session') ?? '{}').state?.[key] ?? null;
  } catch {
    return null;
  }
};

/** ใช้ใน Client Component: แนบ JWT และ guest id ให้อัตโนมัติ */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = read('token');
  const tempId = read('tempId');
  if (token) headers.Authorization = `Bearer ${token}`;
  if (tempId) headers['x-temp-user-id'] = tempId;
  const res = await fetch(`/api${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.error ?? 'Request failed');
  return json as T;
}

export interface UploadedImage {
  id: number;
  url: string;
  name: string;
  size: number;
}

/** อัปโหลดรูป (multipart) — ต้องล็อกอินเป็นแอดมิน/พนักงาน */
export async function uploadImages(files: File[]): Promise<UploadedImage[]> {
  const body = new FormData();
  files.forEach((f) => body.append('files', f));
  const token = read('token');
  const res = await fetch('/api/admin/uploads', { method: 'POST', body, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.error ?? 'Upload failed');
  return json as UploadedImage[];
}
