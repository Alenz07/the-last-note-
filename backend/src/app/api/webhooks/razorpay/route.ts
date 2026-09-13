import type { NextRequest } from 'next/server';
import { handlePaymentWebhook } from '@/lib/payments/webhook-handler';

/** Razorpay → us. Kept alongside the Cashfree door so switching gateways needs no URL change. */
export async function POST(req: NextRequest) {
  return handlePaymentWebhook(req);
}
