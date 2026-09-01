import { hmacHex, safeEqual } from '../crypto';
import type { CreateOrderInput, CreatedOrder, OrderStatus, PaymentGateway, WebhookEvent } from './types';

/**
 * Razorpay adapter (Orders API + Checkout.js + webhooks).
 * Written against the public API docs; flip PAYMENT_GATEWAY=razorpay and add keys to go live.
 * Test keys work without completed KYC.
 */
export class RazorpayGateway implements PaymentGateway {
  readonly name = 'razorpay' as const;
  private readonly base = 'https://api.razorpay.com/v1';

  constructor(
    private readonly keyId: string,
    private readonly keySecret: string,
    private readonly webhookSecret: string,
    private readonly appName: string,
  ) {
    if (!keyId || !keySecret) throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing');
  }

  private auth(): string {
    return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
  }

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    const res = await fetch(`${this.base}/orders`, {
      method: 'POST',
      headers: { Authorization: this.auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: 'INR',
        receipt: input.receipt,
        notes: input.notes ?? {},
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`razorpay createOrder ${res.status}: ${await res.text()}`);
    const j = (await res.json()) as { id: string };
    return {
      orderId: j.id,
      checkout: {
        keyId: this.keyId,
        name: this.appName,
        description: `₹${(input.amountPaise / 100).toFixed(0)} · one reveal + one link`,
        currency: 'INR',
      },
    };
  }

  verifyClientSignature({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }): boolean {
    const expected = hmacHex(`${orderId}|${paymentId}`, this.keySecret);
    return safeEqual(expected, signature);
  }

  verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature || !this.webhookSecret) return false;
    return safeEqual(hmacHex(rawBody, this.webhookSecret), signature);
  }

  parseWebhook(rawBody: string): WebhookEvent | null {
    try {
      const j = JSON.parse(rawBody) as {
        event?: string;
        payload?: { payment?: { entity?: { id?: string; order_id?: string; vpa?: string; status?: string } } };
      };
      const ent = j.payload?.payment?.entity;
      const type = j.event === 'payment.captured' ? 'captured' : j.event === 'payment.failed' ? 'failed' : 'other';
      return {
        type,
        orderId: ent?.order_id ?? null,
        paymentId: ent?.id ?? null,
        payerVpa: ent?.vpa ?? null,
        raw: j,
      };
    } catch {
      return null;
    }
  }

  async fetchOrderStatus(orderId: string): Promise<OrderStatus> {
    const res = await fetch(`${this.base}/orders/${encodeURIComponent(orderId)}/payments`, {
      headers: { Authorization: this.auth() },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`razorpay fetchOrderStatus ${res.status}`);
    const j = (await res.json()) as { items?: { id: string; status: string; vpa?: string }[] };
    const items = j.items ?? [];
    const captured = items.find((p) => p.status === 'captured');
    if (captured) return { status: 'captured', paymentId: captured.id, payerVpa: captured.vpa ?? null };
    if (items.length && items.every((p) => p.status === 'failed')) {
      return { status: 'failed', paymentId: items[0].id, payerVpa: null };
    }
    return { status: 'pending', paymentId: null, payerVpa: null };
  }
}
