import { Header } from '@/components/ui/Header';

/**
 * Shown while the reveal query runs: a sealed tile still shimmering.
 * The bars here are placeholders, not a real shape — they resolve into the tile.
 */
const PLACEHOLDER = [6, 3, 8, 4, 5, 9, 2, 7, 4, 6, 3, 5, 8, 4];

export default function RevealLoading() {
  return (
    <main className="page" aria-busy>
      <Header />
      <section className="mt-10">
        <div className="h-3 w-24 rounded bg-surface-2" />
        <div className="mt-4 h-11 w-3/4 rounded bg-surface-2" />
      </section>
      <section className="mt-8 tile tint-slate p-5 sm:p-6">
        <div className="h-10 w-32 rounded bg-surface-2" />
        <p className="redacted mt-5 text-[17px]">
          {PLACEHOLDER.map((len, i) => (
            <span key={i} className="redacted-word" style={{ width: `${len * 0.56}em` }} />
          ))}
        </p>
      </section>
    </main>
  );
}
