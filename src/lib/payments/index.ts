import { env } from '../env';
import { MockGateway } from './mock';
import { RazorpayGateway } from './razorpay';
import type { PaymentGateway } from './types';

export type { PaymentGateway, CreateOrderInput, CreatedOrder, WebhookEvent, OrderStatus } from './types';
export { MockGateway } from './mock';
export { RazorpayGateway } from './razorpay';

const g = globalThis as unknown as { __kadiGateway?: PaymentGateway };

export function getGateway(): PaymentGateway {
  if (!g.__kadiGateway) {
    g.__kadiGateway =
      env.paymentGateway === 'razorpay'
        ? new RazorpayGateway(env.razorpay.keyId, env.razorpay.keySecret, env.razorpay.webhookSecret, env.appName)
        : new MockGateway();
  }
  return g.__kadiGateway;
}
