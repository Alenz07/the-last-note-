/**
 * PaymentGateway — the one seam between Kadi and whoever moves the money.
 * Mock (TEST MODE), Cashfree (live default) and Razorpay all satisfy it, and
 * nothing outside src/lib/payments knows which one is running.
 */
export type GatewayName = 'mock' | 'razorpay' | 'cashfree';

export type CreateOrderInput = {
  amountPaise: number;
  /** Our own idempotent reference for this attempt (uuid). */
  receipt: string;
  notes?: Record<string, string>;
};

export type CreatedOrder = {
  orderId: string;
  checkout: {
    /** Razorpay: publishable key for Checkout.js. */
    keyId?: string;
    /** Cashfree: the session the JS SDK opens. */
    paymentSessionId?: string;
    /** Cashfree JS SDK mode. */
    mode?: 'sandbox' | 'production';
    name: string;
    description: string;
    currency: 'INR';
    image?: string;
  };
};

export type WebhookEvent = {
  type: 'captured' | 'failed' | 'other';
  orderId: string | null;
  paymentId: string | null;
  /** UPI VPA when the gateway exposes it. We only ever store sha256 of it. */
  payerVpa: string | null;
  raw: unknown;
};

export type OrderStatus = {
  status: 'captured' | 'failed' | 'pending';
  paymentId: string | null;
  payerVpa: string | null;
};

/** The headers a webhook arrives with. Cashfree signs `timestamp + rawBody`, so it needs both. */
export type WebhookHeaders = { signature: string | null; timestamp: string | null };

export interface PaymentGateway {
  readonly name: GatewayName;
  /**
   * How we trust the browser's "it worked" callback:
   *  - 'signature' — the gateway hands the browser an HMAC we verify offline (Razorpay, mock).
   *  - 'lookup'    — the gateway hands the browser nothing trustworthy, so we ask the
   *                  gateway's API what really happened (Cashfree). Strictly safer.
   */
  readonly verifyMode: 'signature' | 'lookup';
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  /** Checkout-callback verification (client → our API). Only meaningful when verifyMode === 'signature'. */
  verifyClientSignature(input: { orderId: string; paymentId: string; signature: string }): boolean;
  /** Webhook body verification (gateway → our API). */
  verifyWebhookSignature(rawBody: string, headers: WebhookHeaders): boolean;
  parseWebhook(rawBody: string): WebhookEvent | null;
  /** Reconciliation, and the verify step for 'lookup' gateways: ask what really happened. */
  fetchOrderStatus(orderId: string): Promise<OrderStatus>;
}
