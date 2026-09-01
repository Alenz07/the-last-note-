import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ChainSummary, SealedMeta } from '@/lib/chain/types';
import { SITE, og, teaser } from '@/lib/copy';
import { formatPosition, timeAgo } from '@/lib/format';

/**
 * The share card. Same promise as the teaser: the number, the shape, the city —
 * never the words. Rendered by next/og (Satori): flex-only layout, inline styles.
 * Everything is set in Instrument Serif so the card reads as one piece.
 *
 * Satori resolves same-name faces unreliably, so the two faces are registered
 * as two families and chosen by fontFamily, never by fontStyle. The font has no
 * ₹ glyph — copy.og.* spells the price out.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_FONT = { upright: 'Instrument Serif', italic: 'Instrument Serif Italic' } as const;

type OgFont = { name: string; data: Buffer; style: 'normal'; weight: 400 };
let fontsPromise: Promise<OgFont[]> | null = null;

/** Read once per server process, on first use (no I/O at import time). */
export function ogFonts(): Promise<OgFont[]> {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), 'public/fonts/InstrumentSerif-Regular.ttf')),
    readFile(join(process.cwd(), 'public/fonts/InstrumentSerif-Italic.ttf')),
  ]).then(([regular, italic]) => [
    { name: OG_FONT.upright, data: regular, style: 'normal', weight: 400 },
    { name: OG_FONT.italic, data: italic, style: 'normal', weight: 400 },
  ]);
  return fontsPromise;
}

const TINT_HEX: Record<ChainSummary['tint'], string> = {
  wine: '#7a1f3d',
  teal: '#1f6f6b',
  indigo: '#34348f',
  amber: '#8a5a12',
  moss: '#3f6b2a',
  slate: '#3c4656',
};

const BAR_EM = 34; // px font-size the bars are scaled against
const MAX_BARS = 48;

export function SealedCard({ chain, sealed }: { chain: ChainSummary; sealed: SealedMeta | null }) {
  const tint = TINT_HEX[chain.tint];
  const headline = sealed ? teaser.hero(sealed.position) : teaser.heroFirst;
  const meta = sealed
    ? [
        teaser.meta(sealed.shape.chars, sealed.city, sealed.submittedAt ? timeAgo(sealed.submittedAt) : null),
        sealed.voiceSeconds ? teaser.voice(sealed.voiceSeconds) : null,
        sealed.hasImage ? teaser.photo : null,
        teaser.readCount(sealed.readCount).replace(/\.$/, ''),
      ]
        .filter(Boolean)
        .join(' · ')
    : chain.tagline;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 64,
        backgroundColor: '#090a0c',
        backgroundImage: `radial-gradient(circle at 0% 0%, ${tint} 0%, rgba(11,11,15,0) 55%)`,
        color: '#f2ede3',
        fontFamily: OG_FONT.upright,
      }}
    >
      {/* top row: wordmark · chain title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 34 }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span>{SITE.name}</span>
          <span style={{ width: 10, height: 10, borderRadius: 10, backgroundColor: '#c9a15a', marginLeft: 6 }} />
        </div>
        <span style={{ color: '#a89e8b' }}>{chain.title}</span>
      </div>

      {/* middle: headline + bars */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* The one italic line on the card — the same voice as the site's hero. */}
        <div style={{ display: 'flex', fontSize: 76, lineHeight: 1.05, letterSpacing: -1, fontFamily: OG_FONT.italic }}>
          {headline}
        </div>
        {sealed ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              marginTop: 36,
              maxHeight: BAR_EM * 0.9 * 3 + 36,
              overflow: 'hidden',
            }}
          >
            {sealed.shape.words.slice(0, MAX_BARS).map((len, i) => (
              <div
                key={i}
                style={{
                  width: len * BAR_EM * 0.56,
                  height: BAR_EM * 0.9,
                  borderRadius: 7,
                  backgroundColor: 'rgba(242,239,232,0.16)',
                  marginRight: 16,
                  marginBottom: 14,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* bottom: meta · price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: '#a89e8b' }}>
        <span>{meta}</span>
        <span>{og.foot(chain.pricePaise)}</span>
      </div>
    </div>
  );
}

/** Alt text for the image tag. */
export const sealedCardAlt = (chain: ChainSummary, sealed: SealedMeta | null) =>
  sealed ? `${formatPosition(sealed.position)} left something for you in ${chain.title}` : `${chain.title} on ${SITE.name}`;
