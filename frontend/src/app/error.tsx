'use client';

import { errors } from '@/lib/copy';

/** Route-level error boundary. Quiet, honest, one retry. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-16 sm:px-6">
      <section className="mt-28 text-center">
        <p className="serif text-[3rem] leading-none text-ink-faint">·</p>
        <p className="mt-6 text-[1.05rem] leading-relaxed text-ink-muted">{errors.generic}</p>
        <button type="button" className="btn btn-line mt-8" onClick={reset}>
          {errors.retry}
        </button>
      </section>
    </main>
  );
}
