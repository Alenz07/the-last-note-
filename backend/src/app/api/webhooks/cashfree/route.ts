import type { NextRequest } from 'next/server';
import { handlePaymentWebhook } from '@/lib/payments/webhook-handler';

/** Cashfree → us. Set this as the webhook URL in the Cashfree dashboard. */
export async function POST(req: NextRequest) {
  return handlePaymentWebhook(req);
}
