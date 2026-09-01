'use client';

import { useState } from 'react';
import { SITE } from '@/lib/copy';

/**
 * TEST MODE checkout. Looks enough like a UPI sheet to exercise the whole
 * funnel; screams that no money moves. Replaced by Razorpay Checkout.js when
 * PAYMENT_GATEWAY=razorpay.
 */
export function MockCheckoutSheet({
  amountPaise,
  description,
  onPay,
  onFail,
  onClose,
}: {
  amountPaise: number;
  description: string;
  onPay: () => Promise<void>;
  onFail: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const rupees = (amountPaise / 100).toFixed(0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" role="dialog" aria-modal="true" aria-label="Test mode checkout">
      <div className="w-full max-w-md rounded-t-3xl border border-line bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
          Test mode
        </div>
        <p className="text-sm text-ink-muted">{SITE.testMode}</p>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-ink-muted">{description}</span>
          <span className="display text-3xl">₹{rupees}</span>
        </div>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onPay();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Confirming…' : `Pay ₹${rupees} (simulate UPI success)`}
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onFail}>
            Simulate failure
          </button>
          <button type="button" className="btn btn-quiet" disabled={busy} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
