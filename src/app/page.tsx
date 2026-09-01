import Link from 'next/link';
import type { Metadata } from 'next';
import { getLiveChains, getTeaser } from '@/lib/chain/queries';
import { SITE, landing, nav } from '@/lib/copy';
import { ChainTile } from '@/components/ui/ChainTile';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';

// Hot read path: served from the ISR cache, never touches the DB per view.
export const revalidate = 5;

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
};

/** Chains plus a glimpse of each one's latest sealed link. A few cheap queries per 5 s revalidate. */
async function loadLanding() {
  const chains = await getLiveChains();
  const sealed = await Promise.all(chains.map((c) => getTeaser(c.slug).then((t) => t?.sealed ?? null)));
  return chains.map((chain, i) => ({ chain, sealed: sealed[i] }));
}

export default async function LandingPage() {
  const rows = await loadLanding();

  return (
    <main className="page">
      <Header right={<Link href="/me">{nav.myLinks}</Link>} />

      <section className="mt-14">
        <h1 className="hero text-[2.6rem] text-ink sm:text-5xl">{landing.headline}</h1>
        <p className="mt-4 max-w-[30ch] text-lg text-ink-muted">{landing.sub}</p>
      </section>

      <section className="mt-12">
        <h2 className="eyebrow">{landing.chainsEyebrow}</h2>
        {rows.length === 0 ? (
          <p className="mt-4 text-ink-muted">{landing.emptyChains}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {rows.map(({ chain, sealed }) => (
              <ChainTile key={chain.id} chain={chain} sealed={sealed} />
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-sm text-ink-faint">{landing.mediaNote}</p>

      <Footer />
    </main>
  );
}
