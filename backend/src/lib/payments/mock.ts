import { randomToken } from '../crypto';
import type {
  CreatedOrder,
  OrderStatus,
  PaymentGateway,
  WebhookEvent,
  WebhookHeaders,
} from './types';

/**
 * No gateway. No money moves — the sheet in the browser "pays" by calling
 * /api/pay/verify with paymentId `mock_pay_*` and signature `mock`.
 *
 * This is also what runs the free trial, so the strings below are shown to
 * real people: no TEST MODE shouting, and no price, since nothing is charged.
 */
export class MockGateway implements PaymentGateway {
  readonly name = 'mock' as const;
  readonly verifyMode = 'signature' as const;

  async createOrder(): Promise<CreatedOrder> {
    return {
      orderId: `mock_order_${randomToken(9)}`,
      checkout: {
        name: 'dernote',
        description: 'One note opens, then twenty minutes to write yours.',
        currency: 'INR',
      },
    };
  }

  verifyClientSignature({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }): boolean {
    return orderId.startsWith('mock_order_') && paymentId.startsWith('mock_pay_') && signature === 'mock';
  }

  verifyWebhookSignature(_rawBody: string, headers: WebhookHeaders): boolean {
    return headers.signature === 'mock';
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
