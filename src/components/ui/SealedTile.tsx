import type { SealedMeta, Tint } from '@/lib/chain/types';
import { teaser } from '@/lib/copy';
import { timeAgo } from '@/lib/format';
import { LinkTile, TileFoot, TileHead } from './LinkTile';
import { Redacted } from './Redacted';

/**
 * A link you haven't paid for. Shows everything except the content:
 * number, city, when, the shape of the words, voice/photo flags, read count.
 */
export function SealedTile({
  tint,
  sealed,
  label,
  className = '',
}: {
  tint: Tint;
  sealed: SealedMeta;
  /** Eyebrow above the number, e.g. teaser.referral. */
  label?: string;
  className?: string;
}) {
  const ago = sealed.submittedAt ? timeAgo(sealed.submittedAt) : null;
  const meta = [
    teaser.meta(sealed.shape.chars, null, null),
    sealed.voiceSeconds ? teaser.voice(sealed.voiceSeconds) : null,
    sealed.hasImage ? teaser.photo : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <LinkTile tint={tint} className={className}>
      <TileHead position={sealed.position} meta={[sealed.city, ago].filter(Boolean).join(' · ') || null} label={label} />
      <Redacted shape={sealed.shape} className="mt-5 text-[17px]" />
      <TileFoot>
        <span>{meta}</span>
        <span>{teaser.readCount(sealed.readCount)}</span>
      </TileFoot>
    </LinkTile>
  );
}
