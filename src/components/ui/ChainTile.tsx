import Link from 'next/link';
import type { ChainSummary, SealedMeta } from '@/lib/chain/types';
import { landing, teaser } from '@/lib/copy';
import { formatPosition, timeAgo } from '@/lib/format';
import { LinkTile, TILE_PAD } from './LinkTile';
import { Redacted } from './Redacted';

/** Only the first line or so of bars on the landing — a glimpse, not the tile. */
const GLIMPSE_WORDS = 14;

/**
 * Landing card for one chain: title, tagline, how long it is, who wrote last,
 * and a glimpse of the shape of the latest sealed link.
 * The whole tile is the link; the teaser page carries the only button.
 */
export function ChainTile({ chain, sealed }: { chain: ChainSummary; sealed: SealedMeta | null }) {
  const { stats } = chain;
  const ago = stats.lastLinkAt ? timeAgo(stats.lastLinkAt) : null;
  const glimpse = sealed ? { ...sealed.shape, words: sealed.shape.words.slice(0, GLIMPSE_WORDS) } : null;

  return (
    <LinkTile tint={chain.tint} as="li" padded={false}>
      <Link href={`/c/${chain.slug}`} className={`block ${TILE_PAD} focus:outline-none`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="display text-2xl text-ink">{chain.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{chain.tagline}</p>
          </div>
          <span className="display num shrink-0 text-3xl leading-none text-ink">{formatPosition(stats.length)}</span>
        </div>

        {glimpse ? (
          <div className="mt-5">
            <p className="text-xs text-ink-muted">{teaser.hero(sealed!.position)}</p>
            <Redacted shape={glimpse} className="mt-2 text-[15px]" />
          </div>
        ) : null}

        <p className="mt-5 flex items-center gap-2 text-sm text-ink-muted">
          <span className="pulse-dot" aria-hidden />
          {landing.lastLink(ago, stats.lastCity)}
        </p>
      </Link>
    </LinkTile>
  );
}
