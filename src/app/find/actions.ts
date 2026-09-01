'use server';

import { redirect } from 'next/navigation';
import { findLinkByPaymentId } from '@/lib/chain/queries';

/** Paste a payment ID → land on the link it bought. No JS needed on the client. */
export async function findLink(formData: FormData) {
  const raw = formData.get('paymentId');
  const paymentId = typeof raw === 'string' ? raw.trim().slice(0, 80) : '';
  const found = paymentId ? await findLinkByPaymentId(paymentId) : null;
  redirect(found ? `/l/${found.revealToken}` : '/find?e=1');
}
