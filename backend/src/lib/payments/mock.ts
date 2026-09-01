import { randomToken } from '../crypto';
import type { CreateOrderInput, CreatedOrder, OrderStatus, PaymentGateway, WebhookEvent } from './types';

/**
 * TEST MODE gateway. No money moves. The checkout sheet in the browser
 * "pays" by calling /api/pay/verify with paymentId `mock_pay_*` and signature `mock`.
 * Never run this with PAYMENT_GATEWAY=mock in front of real users.
 */
export class MockGateway implements PaymentGateway {
  readonly name = 'mock' as const;

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    return {
      orderId: `mock_order_${randomToken(9)}`,
      checkout: {
        name: 'Kadi (TEST MODE)',
        description: `₹${(input.amountPaise / 100).toFixed(0)} · one reveal + one link`,
        currency: 'INR',
      },
    };
  }

  verifyClientSignature({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }): boolean {
    return orderId.startsWith('mock_order_') && paymentId.startsWith('mock_pay_') && signature === 'mock';
  }

  verifyWebhookSignature(_rawBody: string, signature: string | null): boolean {
    return signature === 'mock';
  }

  parseWebhook(rawBody: string): WebhookEvent | null {
    try {
      const j = JSON.parse(rawBody) as { type?: string; orderId?: string; paymentId?: string; payerVpa?: string };
      return {
        type: j.type === 'captured' ? 'captured' : j.type === 'failed' ? 'failed' : 'other',
        orderId: j.orderId ?? null,
        paymentId: j.paymentId ?? null,
        payerVpa: j.payerVpa ?? null,
        raw: j,
      };
    } catch {
      return null;
    }
  }

  async fetchOrderStatus(): Promise<OrderStatus> {
    // Mock orders never settle on their own; reconciliation marks stale ones failed.
    return { status: 'pending', paymentId: null, payerVpa: null };
  }
}
