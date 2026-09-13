import type { VerifyResponse } from '@/lib/types';
import { errors } from '@/lib/copy';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Confirm a payment with our backend and get the reveal URL.
 *
 * A 402 means the gateway hasn't marked the order paid *yet* — with Cashfree
 * the browser can return a beat before the payment settles, so we ask again a
 * few times before giving up. The webhook and the reconciliation cron are the
 * backstops if it never settles, so failing here never loses the payer's money.
 */
export async function verifyPayment(body: {
  orderId: string;
  paymentId?: string;
  signature?: string;
}): Promise<VerifyResponse> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch('/api/pay/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return (await res.json()) as VerifyResponse;

    const j = (await res.json().catch(() => ({}))) as { message?: string };
    if (res.status === 402 && attempt < 4) {
      await sleep(1500);
      continue;
    }
    throw new Error(j.message || errors.generic);
  }
}
