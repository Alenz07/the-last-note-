import type { ReactNode } from 'react';
import type { Tint } from '@/lib/chain/types';
import { formatPosition } from '@/lib/format';

/**
 * The one primitive. Every link on the site — sealed, revealed, mine, public,
 * and the chain cards on the landing — is a LinkTile with different content.
 * Keep it dumb: frame + head + body + foot. Variants live in sibling files.
 * Styles come from `.tile` / `.tint-*` in globals.css.
 */

/** Standard tile inset; tiles whose whole body is a <Link> pass padded={false} and put this on the link. */
export const TILE_PAD = 'p-5 sm:p-6';

export function LinkTile({
  tint,
  quiet = false,
  padded = true,
  as: Tag = 'article',
  id,
  className = '',
  children,
}: {
  tint: Tint;
  /** Flat variant for dense lists (unsealed feed, my links). */
  quiet?: boolean;
  /** Set false when the child (e.g. a full-tile <Link>) carries TILE_PAD itself. */
  padded?: boolean;
  as?: 'article' | 'div' | 'li' | 'section';
  /** Anchor target, e.g. "l4371" so /unsealed#l4371 scrolls to a link. */
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const cls = ['tile', `tint-${tint}`, quiet && 'tile-quiet', padded && TILE_PAD, className].filter(Boolean).join(' ');
  return (
    <Tag id={id} className={cls}>
      {children}
    </Tag>
  );
}

/** "#4,371 · Indore · 4 min ago" — the number big in the display face, the rest muted. */
export function TileHead({
  position,
  meta,
  label,
  size = 'lg',
  className = '',
}: {
  position: number;
  /** Already-joined string, e.g. "Indore · 4 min ago". */
  meta?: string | null;
  /** Optional eyebrow above the number ("You are link", chain title…). */
  label?: string;
  size?: 'lg' | 'md';
  className?: string;
}) {
  const numCls = size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-2xl';
  return (
    <header className={`flex flex-col gap-1 ${className}`}>
      {label ? <span className="eyebrow">{label}</span> : null}
      <div className="flex items-baseline gap-3">
        <span className={`display num leading-none text-ink ${numCls}`}>{formatPosition(position)}</span>
        {meta ? <span className="text-sm text-ink-muted">{meta}</span> : null}
      </div>
    </header>
  );
}

/** Small muted line(s) under the body: "143 characters · Indore", "Read by 2 people." */
export function TileFoot({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <footer className={`mt-4 flex flex-col gap-1 text-sm text-ink-muted ${className}`}>{children}</footer>;
}

/** User-written text, set like a letter: display serif under a cast-gold opening quote. Never renders HTML. */
export function TileBody({ text, quote = true, className = '' }: { text: string; quote?: boolean; className?: string }) {
  return (
    <div className={`mt-4 ${className}`}>
      {quote ? (
        <span aria-hidden className="quote-mark">
          &ldquo;
        </span>
      ) : null}
      <p className="note-serif whitespace-pre-wrap text-ink">{text}</p>
    </div>
  );
}
