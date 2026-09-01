import type { RevealedLink, Tint } from '@/lib/chain/types';
import { reveal as copy } from '@/lib/copy';
import { timeAgo } from '@/lib/format';
import { LinkTile, TileBody, TileFoot, TileHead } from './LinkTile';

/** A 10-digit Indian mobile (with optional +91 / spaces) becomes a tappable WhatsApp link. */
function contactHref(contact: string): string | null {
  const digits = contact.replace(/[\s\-().]/g, '').replace(/^\+?91/, '');
  if (/^[6-9]\d{9}$/.test(digits)) return `https://wa.me/91${digits}`;
  if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(contact)) return `mailto:${contact}`;
  if (/^@?[a-z0-9_.]{3,30}$/i.test(contact)) return `https://instagram.com/${contact.replace(/^@/, '')}`;
  return null;
}

/**
 * A link you paid for. Text, plus private media / contact if the writer attached any.
 * Media URLs are short-lived signed URLs from the server; render them directly.
 */
export function RevealedTile({
  tint,
  link,
  foot,
  className = '',
}: {
  tint: Tint;
  link: RevealedLink;
  /** Optional line under the body, e.g. reveal.readBefore(n). */
  foot?: string | null;
  className?: string;
}) {
  const ago = link.submittedAt ? timeAgo(link.submittedAt) : null;
  const href = link.contact ? contactHref(link.contact) : null;
  return (
    <LinkTile tint={tint} className={`unseal ${className}`}>
      <TileHead position={link.position} meta={[link.city, ago].filter(Boolean).join(' · ') || null} />
      <TileBody text={link.body} />
      {link.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived, private URL
        <img src={link.imageUrl} alt="" className="mt-4 max-h-[60vh] w-full rounded-xl object-contain" />
      ) : null}
      {link.voiceUrl ? (
        <audio controls preload="metadata" src={link.voiceUrl} className="mt-4 w-full">
          <track kind="captions" />
        </audio>
      ) : null}
      {link.contact ? (
        <p className="mt-4 text-sm text-ink-muted">
          {copy.contactShared}{' '}
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-2 hover:underline">
              {link.contact}
            </a>
          ) : (
            <span className="text-ink">{link.contact}</span>
          )}
        </p>
      ) : null}
      {foot ? <TileFoot>{foot}</TileFoot> : null}
    </LinkTile>
  );
}
