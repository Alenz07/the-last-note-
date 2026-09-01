/**
 * PaymentGateway — the one seam between Kadi and whoever moves the money.
 * Mock (TEST MODE) today, Razorpay next, Cashfree if Razorpay ever annoys us.
 * Nothing outside src/lib/payments knows which one is live.
 */
export type CreateOrderInput = {
  amountPaise: number;
  /** Our own idempotent reference for this attempt (uuid). */
  receipt: string;
  notes?: Record<string, string>;
};

export type CreatedOrder = {
  orderId: string;
  checkout: {
    keyId?: string;
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

export interface PaymentGateway {
  readonly name: 'mock' | 'razorpay';
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  /** Checkout-callback verification (client → our API). */
  verifyClientSignature(input: { orderId: string; paymentId: string; signature: string }): boolean;
  /** Webhook body verification (gateway → our API). */
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
  parseWebhook(rawBody: string): WebhookEvent | null;
  /** Reconciliation: ask the gateway what really happened to an order. */
  fetchOrderStatus(orderId: string): Promise<OrderStatus>;
}
