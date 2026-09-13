import { after, NextResponse, type NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { payments } from '@/db/schema';
import { capturePayment, ChainError } from '@/lib/chain/core';
import { notifyRevealed } from '@/lib/notify';
import { getServices } from '@/lib/services';

/**
 * One webhook body handler for every gateway — which gateway is live is decided
 * by env, not by the URL, so /api/webhooks/cashfree and /api/webhooks/razorpay
 * are two doors into this same function.
 *
 * This is what covers the closed-tab case: the payer paid but never came back
 * to /api/pay/verify. capturePayment() is idempotent, so double delivery from
 * the browser *and* the webhook is harmless.
 */
export async function handlePaymentWebhook(req: NextRequest): Promise<NextResponse> {
  // Raw text, never a parsed object — signatures are computed over exact bytes.
  const raw = await req.text();
  const s = await getServices();

  const signature =
    req.headers.get('x-webhook-signature') ?? // Cashfree
    req.headers.get('x-razorpay-signature') ?? // Razorpay
    req.headers.get('x-kadi-signature'); // mock
  const timestamp = req.headers.get('x-webhook-timestamp'); // Cashfree only

  if (!s.gateway.verifyWebhookSignature(raw, { signature, timestamp })) {
    return NextResponse.json({ ok: false, error: 'bad_signature' }, { status: 400 });
  }

  const ev = s.gateway.parseWebhook(raw);
  if (!ev) return NextResponse.json({ ok: false, error: 'bad_body' }, { status: 400 });

  try {
    if (ev.type === 'captured' && ev.orderId && ev.paymentId) {
      const r = await capturePayment(s, {
        orderId: ev.orderId,
        paymentId: ev.paymentId,
        payerVpa: ev.payerVpa,
        raw: ev.raw,
      });
      if (!r.alreadyCaptured && r.revealedLinks.length) after(() => notifyRevealed(s, r));
    } else if (ev.type === 'failed' && ev.orderId) {
      await s.db
        .update(payments)
        .set({ status: 'failed', raw: ev.raw })
        .where(and(eq(payments.gatewayOrderId, ev.orderId), eq(payments.status, 'created')));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Unknown order: someone else's webhook or a stale retry — ack so it stops.
    if (e instanceof ChainError && e.code === 'order_not_found') {
      return NextResponse.json({ ok: true, ignored: true });
    }
    // 500 makes the gateway retry, which is what we want for transient DB errors.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
