import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { errorResponse, readJson } from '@/lib/api';
import { ensureDevice, reportLink } from '@/lib/chain/core';
import { rateLimit } from '@/lib/kv';
import { REPORT_REASONS } from '@/lib/moderation';
import { deviceFromRequest, setDeviceCookie } from '@/lib/request';
import { getServices } from '@/lib/services';

const Body = z.object({ linkId: z.uuid(), reason: z.enum(REPORT_REASONS) });

export async function POST(req: NextRequest) {
  const body = Body.safeParse(await readJson(req));
  if (!body.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  const s = await getServices();
  const device = deviceFromRequest(req);
  const rl = await rateLimit(s.kv, 'report', device.id, 5, 60);
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited', retryAfter: rl.retryAfter }, { status: 429 });
  try {
    await ensureDevice(s.db, device.id);
    const r = await reportLink(s, { linkId: body.data.linkId, deviceId: device.id, reason: body.data.reason });
    const res = NextResponse.json({ ok: true, hidden: r.hidden, duplicate: r.duplicate });
    if (device.isNew) setDeviceCookie(res, device.id);
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}
