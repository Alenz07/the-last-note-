import type { RevealedLink, SealedMeta } from '@/lib/types';
import { formatPosition, timeAgo } from '@/lib/format';
import { teaser as copy } from '@/lib/copy';
import { Redacted } from './Redacted';

/** Shared card frame: eyebrow + note number, gold quote, body, meta footer. */
function Frame({
  eyebrow,
  position,
  children,
  footer,
  glow = false,
  className = '',
}: {
  eyebrow?: string;
  position: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  glow?: boolean;
  className?: string;
}) {
  return (
    <article className={`card ${glow ? 'card-glow' : ''} p-6 sm:p-7 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 text-[11px] uppercase tracking-[0.15em]">
        <span className="text-ink-faint">{eyebrow ?? 'Note'}</span>
        <span className="num text-ink-muted">{formatPosition(position)}</span>
      </div>
      <span aria-hidden className="qmark mt-4">
        &ldquo;
      </span>
      {children}
      {footer ? <div className="mt-5 text-[13px] text-ink-faint">{footer}</div> : null}
    </article>
  );
}

/** A note you have not paid for: the shape of the words, never the words. */
export function SealedNote({
  sealed,
  eyebrow,
  glow,
  maxWords,
  className = '',
}: {
  sealed: SealedMeta;
  eyebrow?: string;
  glow?: boolean;
  maxWords?: number;
  className?: string;
}) {
  const ago = sealed.submittedAt ? timeAgo(sealed.submittedAt) : null;
  const extras = [
    copy.meta(sealed.shape.chars, null, null),
    sealed.voiceSeconds ? copy.voice(sealed.voiceSeconds) : null,
    sealed.hasImage ? copy.photo : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Frame
      eyebrow={eyebrow}
      position={sealed.position}
      glow={glow}
      className={className}
      footer={
        <>
          <p>Anonymous · {[sealed.city, ago].filter(Boolean).join(' · ')}</p>
          <p className="mt-1">
            {extras} · {copy.readCount(sealed.readCount)}
          </p>
        </>
      }
    >
      <Redacted shape={sealed.shape} max={maxWords} className="mt-2 text-[16px]" />
    </Frame>
  );
}

/** A note you paid for: the real words, plus private voice/photo/contact. */
export function RevealedNote({ link, foot, className = '' }: { link: RevealedLink; foot?: string | null; className?: string }) {
  const ago = link.submittedAt ? timeAgo(link.submittedAt) : null;
  return (
    <Frame
      position={link.position}
      eyebrow="Revealed"
      className={className}
      footer={
        <>
          <p>Anonymous · {[link.city, ago].filter(Boolean).join(' · ')}</p>
          {foot ? <p className="mt-1">{foot}</p> : null}
        </>
      }
    >
      <p className="serif mt-2 whitespace-pre-wrap text-[1.35rem] leading-relaxed text-ink">{link.body}</p>

      {link.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived, private URL
        <img src={link.imageUrl} alt="" className="mt-5 max-h-[60vh] w-full rounded-xl object-contain" />
      ) : null}

      {link.voiceUrl ? (
        <audio controls preload="metadata" src={link.voiceUrl} className="mt-5 w-full">
          <track kind="captions" />
        </audio>
      ) : null}

      {link.contact ? (
        <div className="mt-5 rounded-xl border border-line-gold/50 bg-surface-2 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.15em] text-gold">They left a way to reach them</p>
          <p className="mt-1 break-words text-[15px] text-ink">{link.contact}</p>
        </div>
      ) : null}
    </Frame>
  );
}
