import { after, NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { errorResponse, readJson } from '@/lib/api';
import { capturePayment } from '@/lib/chain/core';
import type { VerifyResponse } from '@/lib/chain/types';
import { notifyRevealed } from '@/lib/notify';
import { cityFromHeaders, deviceFromRequest, setDeviceCookie } from '@/lib/request';
import { getServices } from '@/lib/services';

const Body = z.object({
  orderId: z.string().min(4).max(128),
  paymentId: z.string().min(4).max(128),
  signature: z.string().min(1).max(512),
});

/**
 * Step 2: the checkout told the browser "paid". Verify the gateway signature,
 * then run the one idempotent capture. The webhook and the cron call the same thing.
 */
export async function POST(req: NextRequest) {
  const body = Body.safeParse(await readJson(req));
  if (!body.success) return NextResponse.json({ ok: false, error: 'invalid', message: 'Bad request.' }, { status: 400 });
  const s = await getServices();

  if (!s.gateway.verifyClientSignature(body.data)) {
    return NextResponse.json({ ok: false, error: 'bad_signature', message: 'Payment could not be verified.' }, { status: 400 });
  }

  try {
    const r = await capturePayment(s, {
      orderId: body.data.orderId,
      paymentId: body.data.paymentId,
      city: cityFromHeaders(req.headers),
      raw: { via: 'client' },
    });
    const data: VerifyResponse = {
      revealToken: r.link.revealToken,
      revealUrl: `/c/${r.chain.slug}/reveal?t=${r.link.revealToken}`,
      alreadyCaptured: r.alreadyCaptured,
    };
    if (!r.alreadyCaptured && r.revealedLinks.length) {
      after(() => notifyRevealed(s, r));
    }
    const res = NextResponse.json(data);
    const device = deviceFromRequest(req);
    if (device.isNew) setDeviceCookie(res, r.link.deviceId);
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}
