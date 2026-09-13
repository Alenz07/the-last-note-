'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { find as copy, errors } from '@/lib/copy';

/** Recovery: the payment receipt is the account. Paste the id, get the note back. */
export function FindForm() {
  const router = useRouter();
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ref.trim() || busy) return;
        setBusy(true);
        setError(null);
        try {
          const res = await fetch('/api/find', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ paymentRef: ref.trim() }),
          });
          if (res.ok) {
            const j = (await res.json()) as { revealToken: string };
            router.push(`/l/${j.revealToken}`);
            return;
          }
          setError(res.status === 429 ? 'Too many tries. Wait a few minutes.' : copy.notFound);
        } catch {
          setError(errors.generic);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="sr-only" htmlFor="paymentRef">
        {copy.placeholder}
      </label>
      <input
        id="paymentRef"
        className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-[1.05rem] text-ink outline-none placeholder:text-ink-faint focus:border-gold/60"
        placeholder={copy.placeholder}
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        autoComplete="off"
        autoFocus
      />
      <button type="submit" className="btn btn-gold mt-4 w-full" disabled={busy || !ref.trim()}>
        {busy ? 'Looking…' : copy.cta}
      </button>
      {error ? (
        <p className="mt-3 text-center text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
