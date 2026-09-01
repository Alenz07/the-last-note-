import type { Metadata } from 'next';
import { SITE } from '@/lib/copy';

export const revalidate = 5;

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
};

/**
 * Placeholder home. The public UI was intentionally removed and is being
 * rebuilt to the owner's design. Backend, admin and legal pages are live;
 * the previous frontend is preserved in git (commit "Checkpoint before
 * frontend reset").
 */
export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="display text-4xl text-ink">{SITE.name}</h1>
      <p className="text-ink-muted">New interface under construction.</p>
    </main>
  );
}
