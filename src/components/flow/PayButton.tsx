'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import type { PayIntentResponse, VerifyResponse } from '@/lib/chain/types';
import { errors, teaser } from '@/lib/copy';
import { beacon } from './beacon';
import { MockCheckoutSheet } from './MockCheckoutSheet';

type RazorpayHandlerResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void };
declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

async function loadRazorpay(): Promise<RazorpayCtor> {
  if (window.Razorpay) return window.Razorpay;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('checkout.js failed to load'));
    document.head.appendChild(s);
  });
  if (!window.Razorpay) throw new Error('Razorpay not available');
  return window.Razorpay;
}

/**
 * The one button. pay → (mock sheet | Razorpay Checkout) → verify → reveal page.
 * Label comes from copy unless overridden.
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
  gateway: 'mock' | 'razorpay';
  isFirst?: boolean;
  revealCount?: number;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<PayIntentResponse | null>(null);

  const text = label ?? (isFirst ? teaser.ctaFirst(pricePaise) : revealCount > 1 ? teaser.ctaMany(revealCount, pricePaise) : teaser.cta(pricePaise));

  const verify = useCallback(
    async (orderId: string, paymentId: string, signature: string) => {
      const res = await fetch('/api/pay/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId, paymentId, signature }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(j.message || errors.generic);
      }
      const j = (await res.json()) as VerifyResponse;
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

      if (j.gateway === 'mock') {
        setIntent(j);
        return;
      }

      const Razorpay = await loadRazorpay();
      const rz = new Razorpay({
        key: j.checkout.keyId,
        amount: j.amountPaise,
        currency: j.checkout.currency,
        name: j.checkout.name,
        description: j.checkout.description,
        order_id: j.orderId,
        theme: { color: '#c9a15a', backdrop_color: '#090a0c' },
        handler: (r: RazorpayHandlerResponse) => {
          void verify(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature).catch((e: Error) => {
            setError(e.message);
            setBusy(false);
          });
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rz.open();
    } catch (e) {
      setError((e as Error).message || errors.generic);
      setBusy(false);
    }
  }, [chainSlug, refPosition, verify]);

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
              const paymentId = `mock_pay_${Math.random().toString(36).slice(2, 12)}`;
              await verify(intent.orderId, paymentId, 'mock');
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
