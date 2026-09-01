'use client';

import { errors } from '@/lib/copy';
import { Button } from '@/components/ui/Button';

/** Route-level error boundary for public pages. Quiet, honest, one retry. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page">
      <section className="mt-24">
        <p className="display text-5xl text-ink-faint">·</p>
        <p className="mt-6 text-lg text-ink-muted">{errors.generic}</p>
        <Button variant="ghost" className="mt-10" onClick={reset}>
          {errors.retry}
        </Button>
      </section>
    </main>
  );
}
