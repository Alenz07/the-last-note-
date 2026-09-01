import Link from 'next/link';
import type { ReactNode } from 'react';
import { nav, SITE } from '@/lib/copy';

/**
 * Shell for /terms /privacy /refunds /content-policy /grievance.
 * Self-contained (no product header/footer) so it survives UI rebuilds —
 * Razorpay's website review needs these pages up at all times.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  /** ISO date, e.g. "2026-08-23". */
  updated: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <main className="page">
      <header className="py-2">
        <Link href="/" className="display text-xl text-ink focus:outline-none">
          {SITE.name}
        </Link>
      </header>
      <article className="mt-10">
        <h1 className="display text-[2.2rem] text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-xs text-ink-faint">
          Last updated <time dateTime={updated}>{updated}</time>
        </p>
        {intro ? <p className="mt-6 text-ink-muted">{intro}</p> : null}
        <div className="legal mt-8 flex flex-col gap-8">{children}</div>
      </article>
      <footer className="mt-16 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-6 text-xs text-ink-faint">
        <Link href="/terms">{nav.terms}</Link>
        <Link href="/privacy">{nav.privacy}</Link>
        <Link href="/refunds">{nav.refunds}</Link>
        <Link href="/content-policy">{nav.contentPolicy}</Link>
        <Link href="/grievance">{nav.grievance}</Link>
        <span className="ml-auto">{SITE.footer}</span>
      </footer>
    </main>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="display text-xl text-ink">{heading}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}
