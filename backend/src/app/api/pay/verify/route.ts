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
  /** Signature gateways (Razorpay, mock) send these; lookup gateways (Cashfree) do not. */
  paymentId: z.string().min(4).max(128).optional(),
  signature: z.string().min(1).max(512).optional(),
});

/**
 * Step 2: the browser says "paid". Confirm that independently, then run the one
 * idempotent capture the webhook and the reconciliation cron also call.
 *
 * How we confirm depends on the gateway:
 *  - 'signature' (Razorpay, mock): verify the HMAC the checkout handed the client.
 *  - 'lookup' (Cashfree): ignore the client entirely and ask the gateway's API.
 */
export async function POST(req: NextRequest) {
  const body = Body.safeParse(await readJson(req));
  if (!body.success) return NextResponse.json({ ok: false, error: 'invalid', message: 'Bad request.' }, { status: 400 });
  const s = await getServices();

  let paymentId: string;
  let payerVpa: string | null = null;

  if (s.gateway.verifyMode === 'lookup') {
    let status;
    try {
      status = await s.gateway.fetchOrderStatus(body.data.orderId);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: 'gateway',
          message: 'Could not reach the payment gateway. If money left your account, your link appears within minutes.',
        },
        { status: 503 },
      );
    }
    if (status.status !== 'captured' || !status.paymentId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'not_paid',
          message:
            status.status === 'failed'
              ? 'That payment did not go through. Nothing was charged.'
              : 'Payment not confirmed yet. If money left your account, your link appears within minutes.',
        },
        { status: 402 },
      );
    }
    paymentId = status.paymentId;
    payerVpa = status.payerVpa;
  } else {
    const { orderId, paymentId: pid, signature } = body.data;
    if (!pid || !signature || !s.gateway.verifyClientSignature({ orderId, paymentId: pid, signature })) {
      return NextResponse.json(
        { ok: false, error: 'bad_signature', message: 'Payment could not be verified.' },
        { status: 400 },
      );
    }
    paymentId = pid;
  }

  try {
    const r = await capturePayment(s, {
      orderId: body.data.orderId,
      paymentId,
      payerVpa,
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
