import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

/**
 * Shell for /terms /privacy /refunds /content-policy /grievance.
 * Plain, readable, short sections — legal pages are read on phones in a hurry.
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
      <Header />
      <article className="mt-10">
        <h1 className="hero text-[2.2rem] text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-xs text-ink-faint">
          Last updated <time dateTime={updated}>{updated}</time>
        </p>
        {intro ? <p className="mt-6 text-ink-muted">{intro}</p> : null}
        <div className="legal mt-8 flex flex-col gap-8">{children}</div>
      </article>
      <Footer />
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
