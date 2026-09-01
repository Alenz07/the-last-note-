import { after, NextResponse, type NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { payments } from '@/db/schema';
import { capturePayment, ChainError } from '@/lib/chain/core';
import { notifyRevealed } from '@/lib/notify';
import { getServices } from '@/lib/services';

/**
 * Gateway → us. Covers the closed-tab case: the user paid but never came back
 * for /api/pay/verify. Same capturePayment(), so double delivery is harmless.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const s = await getServices();
  const sig = req.headers.get('x-razorpay-signature') ?? req.headers.get('x-kadi-signature');
  if (!s.gateway.verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ ok: false, error: 'bad_signature' }, { status: 400 });
  }
  const ev = s.gateway.parseWebhook(raw);
  if (!ev) return NextResponse.json({ ok: false, error: 'bad_body' }, { status: 400 });

  try {
    if (ev.type === 'captured' && ev.orderId && ev.paymentId) {
      const r = await capturePayment(s, { orderId: ev.orderId, paymentId: ev.paymentId, payerVpa: ev.payerVpa, raw: ev.raw });
      if (!r.alreadyCaptured && r.revealedLinks.length) after(() => notifyRevealed(s, r));
    } else if (ev.type === 'failed' && ev.orderId) {
      await s.db
        .update(payments)
        .set({ status: 'failed', raw: ev.raw })
        .where(and(eq(payments.gatewayOrderId, ev.orderId), eq(payments.status, 'created')));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ChainError && e.code === 'order_not_found') return NextResponse.json({ ok: true, ignored: true });
    // 500 makes the gateway retry — which is what we want for transient DB errors
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
