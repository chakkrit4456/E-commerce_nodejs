import { prisma } from '../lib/prisma';
import { forget, remember } from '../lib/cache';

/** key-value settings พร้อม cache (04-Data-Schema §7 BusinessSetting) */
export async function getSettings(): Promise<Record<string, string>> {
  return remember('settings', 600, async () => {
    const rows = await prisma.businessSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.type, r.value]));
  });
}

export async function getSetting(key: string, fallback = ''): Promise<string> {
  return (await getSettings())[key] ?? fallback;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.businessSetting.upsert({ where: { type: key }, update: { value }, create: { type: key, value } });
  forget('settings');
  forget('home');
}
