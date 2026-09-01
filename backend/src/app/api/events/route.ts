import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { chains } from '@/db/schema';
import { readJson } from '@/lib/api';
import { isEventName, track } from '@/lib/events';
import { rateLimit } from '@/lib/kv';
import { deviceFromRequest, ipFromHeaders } from '@/lib/request';
import { getServices } from '@/lib/services';

/** Browser → funnel. Accepts sendBeacon bodies. Always 204 — never worth a retry. */
export async function POST(req: NextRequest) {
  const j = await readJson<{ name?: unknown; chainSlug?: unknown; props?: unknown }>(req);
  if (!j || !isEventName(j.name)) return new NextResponse(null, { status: 204 });
  const s = await getServices();
  const rl = await rateLimit(s.kv, 'ev', ipFromHeaders(req.headers), 240, 60);
  if (!rl.ok) return new NextResponse(null, { status: 204 });

  let chainId: string | null = null;
  if (typeof j.chainSlug === 'string' && j.chainSlug.length <= 64) {
    const cached = await s.kv.get(`chainid:${j.chainSlug}`);
    if (cached) chainId = cached;
    else {
      const [c] = await s.db.select({ id: chains.id }).from(chains).where(eq(chains.slug, j.chainSlug)).limit(1);
      if (c) {
        chainId = c.id;
        await s.kv.set(`chainid:${j.chainSlug}`, c.id, 600);
      }
    }
  }
  const device = deviceFromRequest(req);
  const props = j.props && typeof j.props === 'object' ? (j.props as Record<string, unknown>) : null;
  await track(s.db, { name: j.name, chainId, deviceId: device.isNew ? null : device.id, props });
  return new NextResponse(null, { status: 204 });
}
