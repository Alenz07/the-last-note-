'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { removeLink, restoreLink, setDeviceBan, sweep, upsertChain, type ChainInput } from '@/lib/chain/core';
import { seedChains, seedDemoLinks } from '@/lib/chain/seed';
import { asTint } from '@/lib/chain/types';
import { isUuid } from '@/lib/crypto';
import { getServices } from '@/lib/services';

const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? '').trim().slice(0, max);
const int = (fd: FormData, k: string, dflt: number, min: number, max: number) => {
  const n = Number(fd.get(k));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : dflt;
};
const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true';

export async function saveChainAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, 'id', 64);
  const slug = str(formData, 'slug', 48)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) throw new Error('slug required');
  const input: ChainInput = {
    slug,
    title: str(formData, 'title', 80) || slug,
    tagline: str(formData, 'tagline', 140),
    prompt: str(formData, 'prompt', 280),
    tint: asTint(str(formData, 'tint', 16)),
    pricePaise: int(formData, 'priceRupees', 5, 1, 500) * 100,
    unsealAfter: int(formData, 'unsealAfter', 50, 1, 100000),
    unsealMedia: bool(formData, 'unsealMedia'),
    revealCount: int(formData, 'revealCount', 1, 1, 10),
    revealMode: str(formData, 'revealMode', 16) === 'latest' ? 'latest' : 'referrer',
    windowMinutes: int(formData, 'windowMinutes', 10, 1, 1440),
    allowVoice: bool(formData, 'allowVoice'),
    allowImage: bool(formData, 'allowImage'),
    allowContact: bool(formData, 'allowContact'),
    status: (['live', 'paused', 'ended'] as const).find((s) => s === str(formData, 'status', 8)) ?? 'live',
    sort: int(formData, 'sort', 0, -1000, 1000),
  };
  const s = await getServices();
  await upsertChain(s.db, input, isUuid(id) ? id : undefined);
  revalidatePath('/');
  revalidatePath(`/c/${slug}`);
  revalidatePath('/admin');
  redirect('/admin');
}

export async function runSweepAction(): Promise<void> {
  await requireAdmin();
  await sweep(await getServices());
  revalidatePath('/admin');
}

export async function seedDemoAction(): Promise<void> {
  await requireAdmin();
  const s = await getServices();
  await seedChains(s.db);
  await seedDemoLinks(s.db);
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function removeLinkAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, 'linkId', 64);
  if (!isUuid(id)) return;
  const s = await getServices();
  await removeLink(s.db, id, str(formData, 'resolution', 200) || 'removed by admin');
  if (bool(formData, 'banDevice')) {
    const deviceId = str(formData, 'deviceId', 64);
    if (isUuid(deviceId)) await setDeviceBan(s.db, deviceId, true, 'content removal');
  }
  revalidatePath('/admin/reports');
  revalidatePath(`/admin/links/${id}`);
}

export async function restoreLinkAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, 'linkId', 64);
  if (!isUuid(id)) return;
  const s = await getServices();
  await restoreLink(s.db, id, str(formData, 'resolution', 200) || 'dismissed by admin');
  revalidatePath('/admin/reports');
  revalidatePath(`/admin/links/${id}`);
}

export async function setBanAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const deviceId = str(formData, 'deviceId', 64);
  if (!isUuid(deviceId)) return;
  const s = await getServices();
  await setDeviceBan(s.db, deviceId, bool(formData, 'banned'), str(formData, 'reason', 200) || undefined);
  revalidatePath('/admin/reports');
  const back = str(formData, 'back', 200);
  if (back.startsWith('/admin')) revalidatePath(back);
}

export async function findLinkAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const q = str(formData, 'q', 200);
  const s = await getServices();
  const { findLinkByChainPosition } = await import('@/lib/admin/queries');
  const m = q.match(/^([a-z0-9-]+)[\s/#:]+(\d+)$/i);
  let id: string | null = null;
  if (m) id = await findLinkByChainPosition(s.db, m[1].toLowerCase(), Number(m[2]));
  else if (isUuid(q)) id = q;
  else {
    const { findLinkByPaymentId } = await import('@/lib/chain/queries');
    const r = await findLinkByPaymentId(q, s);
    if (r) {
      const { eq } = await import('drizzle-orm');
      const { links } = await import('@/db/schema');
      const [l] = await s.db.select({ id: links.id }).from(links).where(eq(links.revealToken, r.revealToken)).limit(1);
      id = l?.id ?? null;
    }
  }
  redirect(id ? `/admin/links/${id}` : `/admin/links?notfound=${encodeURIComponent(q)}`);
}
