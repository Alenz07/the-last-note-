import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { devices, links } from '@/db/schema';
import { readJson } from '@/lib/api';
import { ensureDevice } from '@/lib/chain/core';
import { isToken } from '@/lib/crypto';
import { deviceFromRequest, setDeviceCookie } from '@/lib/request';
import { getServices } from '@/lib/services';

const Body = z.object({
  token: z.string().optional().nullable(),
  subscription: z
    .object({
      endpoint: z.url().max(2048),
      keys: z.object({ p256dh: z.string().min(10), auth: z.string().min(5) }),
      expirationTime: z.number().nullable().optional(),
    })
    .passthrough(),
});

/** Attach a push subscription to the device that owns the link (or the cookie device). */
export async function POST(req: NextRequest) {
  const body = Body.safeParse(await readJson(req));
  if (!body.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  const s = await getServices();
  const device = deviceFromRequest(req);

  let deviceId = device.id;
  if (isToken(body.data.token)) {
    const [l] = await s.db.select({ deviceId: links.deviceId }).from(links).where(eq(links.revealToken, body.data.token)).limit(1);
    if (l) deviceId = l.deviceId;
  }
  await ensureDevice(s.db, deviceId);
  await s.db.update(devices).set({ pushSubscription: body.data.subscription }).where(eq(devices.id, deviceId));
  const res = NextResponse.json({ ok: true });
  if (device.isNew && deviceId === device.id) setDeviceCookie(res, device.id);
  return res;
}

export async function DELETE(req: NextRequest) {
  const s = await getServices();
  const device = deviceFromRequest(req);
  if (!device.isNew) await s.db.update(devices).set({ pushSubscription: null }).where(eq(devices.id, device.id));
  return NextResponse.json({ ok: true });
}
