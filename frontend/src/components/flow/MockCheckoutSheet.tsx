'use client';

import { useEffect, useRef, useState } from 'react';
import { free as copy } from '@/lib/copy';

/** How long the sheet holds before the note opens. */
const SECONDS = 30;

/**
 * The free-trial reveal. Stands exactly where the gateway's sheet stands, so
 * the funnel keeps its shape and switching back to Cashfree is one env var —
 * but it takes no money and says so. The wait is deliberate: the pause before
 * a note opens is part of the product, and it keeps the free flow feeling the
 * same length as the paid one, so nothing gets slower on launch day.
 */
export function MockCheckoutSheet({
  description,
  onPay,
  onClose,
}: {
  amountPaise: number;
  description: string;
  onPay: () => Promise<void>;
  onClose: () => void;
}) {
  const [left, setLeft] = useState(SECONDS);
  const fired = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setLeft((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const done = left === 0;

  useEffect(() => {
    if (!done || fired.current) return;
    fired.current = true;
    void onPay();
  }, [done, onPay]);

  const progress = ((SECONDS - left) / SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" role="dialog" aria-modal="true" aria-label={copy.sheetTitle}>
      <div className="w-full max-w-md rounded-t-3xl border border-line bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <span className="inline-flex items-center rounded-full border border-line-gold/60 bg-gold/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold">
          {copy.badge}
        </span>

        <p className="serif mt-5 text-[1.45rem] leading-snug text-ink">{done ? copy.sheetOpening : copy.sheetTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>

        <div className="mt-7 flex flex-col items-center">
          <span className="num serif text-[3.4rem] leading-none text-gold" aria-live="off">
            {left}
          </span>
          <span className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-faint">{copy.seconds}</span>
          <div className="mt-5 h-px w-full overflow-hidden bg-line">
            <div className="h-full bg-gold transition-[width] duration-1000 ease-linear" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">{copy.sheetNote}</p>

        <button type="button" className="btn btn-quiet mt-3 w-full" disabled={done} onClick={onClose}>
          {copy.cancel}
        </button>
      </div>
    </div>
  );
}
