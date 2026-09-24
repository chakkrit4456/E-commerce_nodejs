// In-memory TTL cache (แทน Redis ใน dev; interface เดียวกันเพื่อสลับเป็น ioredis ภายหลัง)
const store = new Map<string, { value: unknown; expires: number }>();

export async function remember<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await loader();
  store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  return value;
}

export function forget(prefix: string): void {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}

export function clearAll(): void {
  store.clear();
}
