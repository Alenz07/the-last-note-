import Link from 'next/link';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getTeaser } from '@/lib/chain/queries';
import { og, teaser as copy, nav } from '@/lib/copy';
import { env } from '@/lib/env';
import { EventBeacon, LiveStats, PayButton } from '@/components/flow';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { SealedTile } from '@/components/ui/SealedTile';

/**
 * The teaser is the product's ad: everything about the link except the link.
 * Shared by /c/[slug] (latest) and /c/[slug]/[position] (share landing).
 * Both routes are ISR (revalidate 5) — no cookies()/headers() in here.
 */

export const loadTeaser = cache((slug: string, position?: number) => getTeaser(slug, position));

/** "/c/confess/4372" — positive integer positions only; anything else is a 404. */
export const parsePosition = (raw: string): number | null => (/^[1-9]\d{0,8}$/.test(raw) ? Number(raw) : null);

export async function teaserMetadata(slug: string, position?: number): Promise<Metadata> {
  const data = await loadTeaser(slug, position);
  if (!data) return { title: 'Not found' };
  const { chain, sealed } = data;
  return {
    title: { absolute: og.title(chain.title, sealed?.position ?? null) },
    description: og.description(chain.title, chain.pricePaise),
    alternates: { canonical: position ? `/c/${slug}/${position}` : `/c/${slug}` },
  };
}

export async function Teaser({ slug, position }: { slug: string; position?: number }) {
  const data = await loadTeaser(slug, position);
  if (!data) notFound();
  const { chain, sealed, isReferral } = data;

  const live = chain.status === 'live';
  const unsealsAt = sealed ? sealed.position + chain.unsealAfter : null;
  const alreadyUnsealed = unsealsAt !== null && chain.tail >= unsealsAt;
  const chainHasMedia = chain.allowVoice || chain.allowImage;
  const nextPosition = chain.tail + 1;

  return (
    <main className="page">
      <Header right={<Link href={`/c/${chain.slug}/unsealed`}>{nav.unsealed}</Link>} />

      <section className={`mt-10 tint-${chain.tint}`}>
        <p className="eyebrow">{chain.title}</p>
        <h1 className="hero mt-3 text-[2.4rem] text-ink sm:text-5xl">
          {sealed
            ? chain.revealCount > 1
              ? copy.heroRange(Math.max(1, sealed.position - chain.revealCount + 1), sealed.position)
              : copy.hero(sealed.position)
            : copy.heroFirst}
        </h1>
      </section>

      {sealed ? (
        <section className="mt-8">
          <SealedTile tint={chain.tint} sealed={sealed} label={isReferral ? copy.referral : undefined} />
          <p className="mt-4 text-sm text-ink-muted">
            {alreadyUnsealed ? copy.alreadyUnsealed : copy.unsealLine(unsealsAt!, chainHasMedia)}
          </p>
        </section>
      ) : (
        <p className="mt-6 text-ink-muted">{chain.prompt}</p>
      )}

      <section className="mt-8">
        <LiveStats slug={chain.slug} initial={chain.stats} />
      </section>

      <div className="sticky-cta mt-10">
        {live ? (
          <>
            <PayButton
              chainSlug={chain.slug}
              refPosition={isReferral && sealed ? sealed.position : undefined}
              pricePaise={chain.pricePaise}
              gateway={env.paymentGateway}
              isFirst={!sealed}
              revealCount={chain.revealCount}
            />
            <p className="mt-3 text-center text-sm text-ink-muted">{copy.ctaMicro(nextPosition)}</p>
          </>
        ) : (
          <p className="text-center text-ink-muted">{chain.status === 'paused' ? copy.paused : copy.ended}</p>
        )}
      </div>

      <ol className="mt-14 flex flex-col gap-3 text-ink-muted">
        {copy.howItWorks.map((line, i) => (
          <li key={line} className="flex gap-4">
            <span className="display num text-ink-faint">{i + 1}</span>
            <span>{line}</span>
          </li>
        ))}
      </ol>

      <Footer />
      <EventBeacon name="chain_view" chainSlug={chain.slug} />
    </main>
  );
}
