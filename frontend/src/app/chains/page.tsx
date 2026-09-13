import Link from 'next/link';
import type { Metadata } from 'next';
import { getChains, getTeaser } from '@/lib/api';
import { chains as copy, landing, revealsLine, teaser } from '@/lib/copy';
import { formatCount, formatPosition, timeAgo } from '@/lib/format';
import type { ChainSummary, SealedMeta } from '@/lib/types';
import { BackLink, Page, SiteFooter, SiteHeader } from '@/components/Chrome';
import { ChainGlyph, LockIcon } from '@/components/Icons';
import { Redacted } from '@/components/Redacted';

/** Pick a chain, then reveal its latest note. Sits between the landing and the teaser. */
export const revalidate = 5;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.sub,
};

export default async function ChainsPage() {
  const list = await getChains();
  const teasers = await Promise.all(list.map((c) => getTeaser(c.slug)));
  const rows = list.map((chain, i) => ({ chain, sealed: teasers[i]?.sealed ?? null }));

  return (
    <Page className="max-w-2xl">
      <SiteHeader />
      <div className="mb-2">
        <BackLink href="/" label="Home" />
      </div>

      <section className="pb-12 pt-8 text-center">
        <h1 className="hero-title text-[2.2rem] text-ink sm:text-[2.7rem]">{copy.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-[1.02rem] leading-relaxed text-ink-muted">{copy.sub}</p>
        <span aria-hidden className="mx-auto mt-8 block h-px w-10 bg-line-gold" />
      </section>

      {rows.length === 0 ? (
        <p className="card p-8 text-center text-ink-muted">{copy.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map(({ chain, sealed }) => (
            <ChainRow key={chain.id} chain={chain} sealed={sealed} />
          ))}
        </ul>
      )}

      <SiteFooter />
    </Page>
  );
}

function ChainRow({ chain, sealed }: { chain: ChainSummary; sealed: SealedMeta | null }) {
  const ago = chain.stats.lastLinkAt ? timeAgo(chain.stats.lastLinkAt) : null;

  return (
    <li className="card p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="ring h-12 w-12 shrink-0">
          <ChainGlyph slug={chain.slug} size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="serif text-[1.35rem] leading-tight text-ink">{chain.title}</h2>
            <span className="num shrink-0 text-sm text-ink-muted">{formatCount(chain.stats.length)} notes</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{chain.tagline}</p>
        </div>
      </div>

      {sealed ? (
        <div className="mt-5 rounded-xl border border-line bg-surface-2/60 p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-ink-faint">
            Latest · {formatPosition(sealed.position)}
          </p>
          <span aria-hidden className="qmark mt-3">
            &ldquo;
          </span>
          <Redacted shape={sealed.shape} max={14} className="mt-1 text-[15px]" />
          <p className="mt-4 text-[13px] text-ink-faint">
            {[
              teaser.meta(sealed.shape.chars, sealed.city, ago),
              sealed.voiceSeconds ? teaser.voice(sealed.voiceSeconds) : null,
              sealed.hasImage ? teaser.photo : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-line bg-surface-2/60 p-4 text-sm text-ink-muted">{copy.waiting}</p>
      )}

      <Link href={`/c/${chain.slug}`} className="btn btn-gold mt-5 w-full">
        <LockIcon />
        {sealed ? copy.reveal(chain.pricePaise) : teaser.ctaFirst(chain.pricePaise)}
      </Link>
      <p className="mt-3 text-center text-xs leading-relaxed text-ink-faint">
        {revealsLine(chain.pricePaise, chain.allowVoice, chain.allowImage)}
      </p>
      <p className="mt-1 text-center text-xs text-ink-faint">
        {landing.lastLink(ago, chain.stats.lastCity)}
      </p>
    </li>
  );
}
