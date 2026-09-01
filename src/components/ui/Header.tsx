import type { ReactNode } from 'react';
import { SITE } from '@/lib/copy';
import { env } from '@/lib/env';
import { Wordmark } from './Wordmark';

/** Wordmark left, one optional action right, test-mode pill when the gateway is mock. */
export function Header({ right }: { right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3">
        <Wordmark />
        {env.paymentTestMode ? (
          <span className="rounded-full border border-line px-2 py-0.5 text-[11px] uppercase tracking-wider text-ink-muted">
            {SITE.testMode}
          </span>
        ) : null}
      </div>
      {right ? <div className="text-sm text-ink-muted">{right}</div> : null}
    </header>
  );
}
