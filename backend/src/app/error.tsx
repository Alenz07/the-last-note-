'use client';

import { errors } from '@/lib/copy';

/** Route-level error boundary. Quiet, honest, one retry. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page">
      <section className="mt-24">
        <p className="display text-5xl text-ink-faint">·</p>
        <p className="mt-6 text-lg text-ink-muted">{errors.generic}</p>
        <button type="button" className="btn btn-ghost mt-10" onClick={reset}>
          {errors.retry}
        </button>
      </section>
    </main>
  );
}
