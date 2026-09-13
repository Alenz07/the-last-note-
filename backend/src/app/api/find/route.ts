import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { readJson } from '@/lib/api';
import { findLinkByPaymentId } from '@/lib/chain/queries';
import { rateLimit } from '@/lib/kv';
import { ipFromHeaders } from '@/lib/request';
import { getServices } from '@/lib/services';

const Body = z.object({ paymentRef: z.string().min(4).max(80) });

/**
 * "I paid but lost the page." The payment receipt is the account — look the
 * slot up by gateway payment/order id. Rate-limited: it's a lookup by secret-ish id.
 */
export async function POST(req: NextRequest) {
  const body = Body.safeParse(await readJson(req));
  if (!body.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const s = await getServices();
  const rl = await rateLimit(s.kv, 'find', ipFromHeaders(req.headers), 10, 300);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited', retryAfter: rl.retryAfter }, { status: 429 });
  }
  const found = await findLinkByPaymentId(body.data.paymentRef, s);
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(found, { headers: { 'Cache-Control': 'private, no-store' } });
}
