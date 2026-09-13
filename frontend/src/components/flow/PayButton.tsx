'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import type { PayIntentResponse } from '@/lib/types';
import { errors, teaser } from '@/lib/copy';
import { beacon } from './beacon';
import { MockCheckoutSheet } from './MockCheckoutSheet';
import { verifyPayment } from './verify';

/* ------------------------------------------------------------------ gateway SDKs */

type RazorpayHandlerResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void };

type CashfreeResult = { error?: { message?: string }; redirect?: boolean };
type CashfreeInstance = { checkout: (opts: Record<string, unknown>) => Promise<CashfreeResult> };
type CashfreeFactory = (opts: { mode: 'sandbox' | 'production' }) => CashfreeInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
    Cashfree?: CashfreeFactory;
  }
}

/** One in-flight promise per script, so double-clicks never inject it twice. */
const scripts = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  let p = scripts.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error('The payment window could not load. Check your connection.'));
      document.head.appendChild(el);
    });
    scripts.set(src, p);
  }
  return p;
}

/* ------------------------------------------------------------------ the button */

/**
 * The one button: /api/pay → the gateway's own checkout → /api/pay/verify → reveal.
 * Which gateway opens is decided by the server at runtime, never by this file.
 */
export function PayButton({
  chainSlug,
  refPosition,
  pricePaise,
  gateway,
  isFirst = false,
  revealCount = 1,
  label,
  className = '',
}: {
  chainSlug: string;
  refPosition?: number | null;
  pricePaise: number;
  /** Display hint only — the real gateway comes back from /api/pay. */
  gateway?: 'mock' | 'razorpay' | 'cashfree';
  isFirst?: boolean;
  revealCount?: number;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<PayIntentResponse | null>(null);

  const text =
    label ??
    (isFirst ? teaser.ctaFirst(pricePaise) : revealCount > 1 ? teaser.ctaMany(revealCount, pricePaise) : teaser.cta(pricePaise));

  const finish = useCallback(
    async (body: { orderId: string; paymentId?: string; signature?: string }) => {
      const j = await verifyPayment(body);
      router.push(j.revealUrl);
    },
    [router],
  );

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    beacon('pay_click', chainSlug, { ref: refPosition ?? null });
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chainSlug, refPosition: refPosition ?? null }),
      });
      if (res.status === 429) {
        const j = (await res.json().catch(() => ({}))) as { retryAfter?: number };
        throw new Error(`Too many tries. Wait ${j.retryAfter ?? 60}s.`);
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(j.message || teaser.payUnavailable);
      }
      const j = (await res.json()) as PayIntentResponse;

      /* ---- TEST MODE: our own sheet, no money ---- */
      if (j.gateway === 'mock') {
        setIntent(j);
        return;
      }

      /* ---- Cashfree: JS SDK v3 modal. No client-side signature — the server
              confirms by asking Cashfree directly, so we just hand it the order. ---- */
      if (j.gateway === 'cashfree') {
        if (!j.checkout.paymentSessionId) throw new Error(teaser.payUnavailable);
        await loadScript('https://sdk.cashfree.com/js/v3/cashfree.js');
        if (!window.Cashfree) throw new Error(teaser.payUnavailable);
        const cashfree = window.Cashfree({ mode: j.checkout.mode ?? 'sandbox' });
        const result = await cashfree.checkout({
          paymentSessionId: j.checkout.paymentSessionId,
          redirectTarget: '_modal',
        });
        // Leaving for a UPI app: /pay/return picks the flow back up.
        if (result?.redirect) return;
        if (result?.error) {
          setError(result.error.message || 'Payment was not completed. Nothing was charged.');
          setBusy(false);
          return;
        }
        await finish({ orderId: j.orderId });
        return;
      }

      /* ---- Razorpay: Checkout.js modal, signature verified server-side ---- */
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!window.Razorpay) throw new Error(teaser.payUnavailable);
      const rz = new window.Razorpay({
        key: j.checkout.keyId,
        amount: j.amountPaise,
        currency: j.checkout.currency,
        name: j.checkout.name,
        description: j.checkout.description,
        order_id: j.orderId,
        theme: { color: '#c9a15a', backdrop_color: '#090a0c' },
        // India-first: UPI on top. Renders empty if the account lacks UPI — harmless.
        config: {
          display: {
            blocks: { upi: { name: 'Pay by UPI', instruments: [{ method: 'upi' }] } },
            sequence: ['block.upi'],
            preferences: { show_default_blocks: true },
          },
        },
        handler: (r: RazorpayHandlerResponse) => {
          void finish({
            orderId: r.razorpay_order_id,
            paymentId: r.razorpay_payment_id,
            signature: r.razorpay_signature,
          }).catch((e: Error) => {
            setError(e.message);
            setBusy(false);
          });
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rz.open();
    } catch (e) {
      setError((e as Error).message || errors.generic);
      setBusy(false);
    }
  }, [chainSlug, refPosition, finish]);

  return (
    <div className={className}>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={start} data-gateway={gateway}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <rect x="5" y="10.5" width="14" height="9" rx="2" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </svg>
        {busy && !intent ? 'One moment…' : text}
      </button>
      {error ? (
        <p className="mt-2 text-center text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {intent ? (
        <MockCheckoutSheet
          amountPaise={intent.amountPaise}
          description={intent.checkout.description}
          onPay={async () => {
            try {
              await finish({
                orderId: intent.orderId,
                paymentId: `mock_pay_${Math.random().toString(36).slice(2, 12)}`,
                signature: 'mock',
              });
            } catch (e) {
              setError((e as Error).message || errors.generic);
              setIntent(null);
              setBusy(false);
            }
          }}
          onFail={() => {
            setIntent(null);
            setBusy(false);
            setError('Payment failed (simulated). Nothing was charged.');
          }}
          onClose={() => {
            setIntent(null);
            setBusy(false);
          }}
        />
      ) : null}
    </div>
  );
}
