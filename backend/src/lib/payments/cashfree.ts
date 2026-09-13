import { hmacBase64, safeEqual } from '../crypto';
import type { CreateOrderInput, CreatedOrder, OrderStatus, PaymentGateway, WebhookEvent, WebhookHeaders } from './types';

/**
 * Cashfree Payment Gateway adapter (Orders API + JS Checkout v3 + webhooks).
 *
 * Two things differ from Razorpay and both are deliberate:
 *  1. We choose the order id, so it doubles as our idempotency key.
 *  2. Cashfree hands the browser no signature, so `verifyMode` is 'lookup':
 *     a payment is only believed after we ask Cashfree's API directly. That is
 *     strictly safer than trusting anything the client posts back.
 */
const API_VERSION = '2026-01-01';

type CfPayment = {
  cf_payment_id?: string | number;
  payment_status?: string;
  payment_group?: string;
  payment_method?: { upi?: { upi_id?: string } };
};

/** Everything other than SUCCESS/PENDING means this attempt is over. */
const TERMINAL = new Set(['FAILED', 'USER_DROPPED', 'CANCELLED', 'VOID']);

export class CashfreeGateway implements PaymentGateway {
  readonly name = 'cashfree' as const;
  readonly verifyMode = 'lookup' as const;
  private readonly base: string;

  constructor(
    private readonly appId: string,
    private readonly secretKey: string,
    private readonly mode: 'sandbox' | 'production',
    private readonly appName: string,
    private readonly siteUrl: string,
    private readonly placeholderPhone: string,
  ) {
    if (!appId || !secretKey) throw new Error('CASHFREE_APP_ID / CASHFREE_SECRET_KEY missing');
    this.base = mode === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
  }

  private headers(): Record<string, string> {
    return {
      'x-api-version': API_VERSION,
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'Content-Type': 'application/json',
    };
  }

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    // Our own id: unique in our DB, and the only reference Cashfree ever gets.
    const orderId = `kadi_${input.receipt.replace(/-/g, '')}`;
    const res = await fetch(`${this.base}/orders`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        order_id: orderId,
        // Cashfree bills in rupees, not paise.
        order_amount: Number((input.amountPaise / 100).toFixed(2)),
        order_currency: 'INR',
        customer_details: {
          // No accounts and no personal data: the order reference *is* the customer.
          customer_id: orderId,
          customer_phone: this.placeholderPhone,
        },
        order_meta: {
          // Mobile UPI leaves the browser and comes back here.
          return_url: `${this.siteUrl}/pay/return?order_id={order_id}`,
          notify_url: `${this.siteUrl}/api/webhooks/cashfree`,
        },
        order_note: input.notes?.chain ? `chain:${input.notes.chain}` : undefined,
        order_tags: input.notes,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`cashfree createOrder ${res.status}: ${await res.text()}`);
    const j = (await res.json()) as { order_id?: string; payment_session_id?: string };
    if (!j.payment_session_id) throw new Error('cashfree createOrder: no payment_session_id in response');
    return {
      orderId: j.order_id || orderId,
      checkout: {
        paymentSessionId: j.payment_session_id,
        mode: this.mode,
        name: this.appName,
        description: `₹${(input.amountPaise / 100).toFixed(0)} · one reveal + one link`,
        currency: 'INR',
      },
    };
  }

  /** Unused: Cashfree gives the browser nothing to verify. Trust comes from fetchOrderStatus(). */
  verifyClientSignature(): boolean {
    return false;
  }

  /** Cashfree signs `x-webhook-timestamp` + the raw body with the secret key, base64. */
  verifyWebhookSignature(rawBody: string, headers: WebhookHeaders): boolean {
    if (!headers.signature || !headers.timestamp) return false;
    return safeEqual(hmacBase64(`${headers.timestamp}${rawBody}`, this.secretKey), headers.signature);
  }

  parseWebhook(rawBody: string): WebhookEvent | null {
    try {
      const j = JSON.parse(rawBody) as {
        type?: string;
        data?: { order?: { order_id?: string }; payment?: CfPayment };
      };
      const p = j.data?.payment;
      const type =
        j.type === 'PAYMENT_SUCCESS_WEBHOOK'
          ? 'captured'
          : j.type === 'PAYMENT_FAILED_WEBHOOK' || j.type === 'PAYMENT_USER_DROPPED_WEBHOOK'
            ? 'failed'
            : 'other';
      return {
        type,
        orderId: j.data?.order?.order_id ?? null,
        paymentId: p?.cf_payment_id != null ? String(p.cf_payment_id) : null,
        payerVpa: p?.payment_method?.upi?.upi_id ?? null,
        raw: j,
      };
    } catch {
      return null;
    }
  }

  async fetchOrderStatus(orderId: string): Promise<OrderStatus> {
    const res = await fetch(`${this.base}/orders/${encodeURIComponent(orderId)}/payments`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(8000),
    });
    // No attempt has been made against this order yet.
    if (res.status === 404) return { status: 'pending', paymentId: null, payerVpa: null };
    if (!res.ok) throw new Error(`cashfree fetchOrderStatus ${res.status}`);
    const body = (await res.json()) as CfPayment[] | { payments?: CfPayment[] };
    const items = Array.isArray(body) ? body : (body.payments ?? []);

    const paid = items.find((p) => p.payment_status === 'SUCCESS');
    if (paid) {
      return {
        status: 'captured',
        paymentId: String(paid.cf_payment_id ?? orderId),
        payerVpa: paid.payment_method?.upi?.upi_id ?? null,
      };
    }
    if (items.length && items.every((p) => TERMINAL.has(p.payment_status ?? ''))) {
      const first = items[0];
      return {
        status: 'failed',
        paymentId: first.cf_payment_id != null ? String(first.cf_payment_id) : null,
        payerVpa: null,
      };
    }
    return { status: 'pending', paymentId: null, payerVpa: null };
  }
}
