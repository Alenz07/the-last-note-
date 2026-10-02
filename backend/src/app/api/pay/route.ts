import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { errorResponse, readJson } from '@/lib/api';
import { createPaymentIntent } from '@/lib/chain/core';
import type { PayIntentResponse } from '@/lib/chain/types';
import { rateLimit } from '@/lib/kv';
import { cityFromHeaders, deviceFromRequest, ipFromHeaders, setDeviceCookie } from '@/lib/request';
import { getServices } from '@/lib/services';

const Body = z.object({
  chainSlug: z.string().min(1).max(64),
  refPosition: z.number().int().positive().max(1_000_000_000).nullable().optional(),
});

/** Step 1 of paying: create a gateway order + our `payments(created)` row. */
export async function POST(req: NextRequest) {
  const body = Body.safeParse(await readJson(req));
  if (!body.success) return NextResponse.json({ ok: false, error: 'invalid', message: 'Bad request.' }, { status: 400 });

  const device = deviceFromRequest(req);
  const ip = ipFromHeaders(req.headers);
  const s = await getServices();

  const [perDevice, perIp] = await Promise.all([
    rateLimit(s.kv, 'pay:d', device.id, 10, 60),
    rateLimit(s.kv, 'pay:ip', ip, 40, 60),
  ]);
  if (!perDevice.ok || !perIp.ok) {
    const retryAfter = Math.max(perDevice.retryAfter, perIp.retryAfter);
    return NextResponse.json({ ok: false, error: 'rate_limited', retryAfter }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  try {
    const { payment, order } = await createPaymentIntent(s, {
      chainSlug: body.data.chainSlug,
      deviceId: device.id,
      refPosition: body.data.refPosition ?? null,
      city: cityFromHeaders(req.headers),
    });
    const data: PayIntentResponse = {
      orderId: order.orderId,
      gateway: s.gateway.name,
      amountPaise: payment.amountPaise,
      checkout: order.checkout,
      holdSeconds: s.settings.revealHoldSeconds,
    };
    const res = NextResponse.json(data);
    if (device.isNew) setDeviceCookie(res, device.id);
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}
