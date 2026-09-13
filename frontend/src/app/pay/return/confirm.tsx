'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { pay } from '@/lib/copy';
import { verifyPayment } from '@/components/flow/verify';

/**
 * Where a UPI app drops the payer back after leaving the browser. Cashfree
 * returns only an order id, so we confirm it server-side and move them on to
 * their reveal. Runs once — a double-confirm would be harmless (capture is
 * idempotent) but pointless.
 */
export function ConfirmPayment({ orderId }: { orderId: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(orderId ? null : pay.missingOrder);
  const started = useRef(false);

  useEffect(() => {
    if (!orderId || started.current) return;
    started.current = true;
    verifyPayment({ orderId })
      .then((r) => router.replace(r.revealUrl))
      .catch((e: Error) => setError(e.message));
  }, [orderId, router]);

  if (error) {
    return (
      <div className="card p-8 text-center">
        <h1 className="serif text-2xl text-ink">{pay.failedTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{error}</p>
        <Link href="/chains" className="btn btn-line mt-6 w-full">
          {pay.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-10 text-center">
      <span aria-hidden className="ring mx-auto flex h-12 w-12 animate-pulse items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="5" y="10.5" width="14" height="9" rx="2" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </svg>
      </span>
      <h1 className="serif mt-5 text-2xl text-ink">{pay.confirming}</h1>
      <p className="mt-2 text-sm text-ink-muted">{pay.confirmingSub}</p>
    </div>
  );
}
