import { env } from '../env';
import { CashfreeGateway } from './cashfree';
import { MockGateway } from './mock';
import { RazorpayGateway } from './razorpay';
import type { PaymentGateway } from './types';

export type {
  PaymentGateway,
  GatewayName,
  CreateOrderInput,
  CreatedOrder,
  WebhookEvent,
  WebhookHeaders,
  OrderStatus,
} from './types';
export { MockGateway } from './mock';
export { CashfreeGateway } from './cashfree';
export { RazorpayGateway } from './razorpay';

const g = globalThis as unknown as { __kadiGateway?: PaymentGateway; __kadiMockGateway?: MockGateway };

/**
 * The no-money gateway, kept alongside the real one rather than instead of it.
 * Free mode is a settings row an operator flips at runtime, so both have to be
 * reachable in the same process.
 */
export function getMockGateway(): PaymentGateway {
  if (!g.__kadiMockGateway) g.__kadiMockGateway = new MockGateway();
  return g.__kadiMockGateway;
}

/** One gateway per process, chosen by PAYMENT_GATEWAY. Swapping providers is an env change. */
export function getGateway(): PaymentGateway {
  if (!g.__kadiGateway) {
    switch (env.paymentGateway) {
      case 'cashfree':
        g.__kadiGateway = new CashfreeGateway(
          env.cashfree.appId,
          env.cashfree.secretKey,
          env.cashfree.mode,
          env.appName,
          env.siteUrl,
          env.cashfree.placeholderPhone,
        );
        break;
      case 'razorpay':
        g.__kadiGateway = new RazorpayGateway(
          env.razorpay.keyId,
          env.razorpay.keySecret,
          env.razorpay.webhookSecret,
          env.appName,
        );
        break;
      default:
        g.__kadiGateway = new MockGateway();
    }
  }
  return g.__kadiGateway;
}
