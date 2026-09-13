import { SOCIAL, hasSocial } from '@/lib/site';
import { social as copy } from '@/lib/copy';
import { InstagramIcon, WhatsAppIcon } from './Icons';

/**
 * Follow-the-chain links. Renders nothing at all when neither URL is
 * configured, so the site never ships a button that goes nowhere.
 */

/** Quiet inline pair — for footers. */
export function SocialLinks({ className = '' }: { className?: string }) {
  if (!hasSocial) return null;
  return (
    <nav className={`flex items-center justify-center gap-4 ${className}`} aria-label={copy.aria}>
      {SOCIAL.whatsapp ? (
        <a
          href={SOCIAL.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-ink-faint transition-colors hover:text-gold"
        >
          <WhatsAppIcon size={15} />
          <span className="text-xs">WhatsApp</span>
        </a>
      ) : null}
      {SOCIAL.instagram ? (
        <a
          href={SOCIAL.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-ink-faint transition-colors hover:text-gold"
        >
          <InstagramIcon size={15} />
          <span className="text-xs">Instagram</span>
        </a>
      ) : null}
    </nav>
  );
}

/**
 * The card shown right after someone writes their note — the moment they're
 * most invested and most want to know when a stranger opens it.
 */
export function FollowCard({ className = '' }: { className?: string }) {
  if (!hasSocial) return null;
  return (
    <section className={`card p-6 text-center ${className}`}>
      <h2 className="serif text-[1.3rem] leading-tight text-ink">{copy.title}</h2>
      <p className="mx-auto mt-2 max-w-[38ch] text-sm leading-relaxed text-ink-muted">{copy.body}</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {SOCIAL.whatsapp ? (
          <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-line">
            <WhatsAppIcon size={16} />
            {copy.whatsapp}
          </a>
        ) : null}
        {SOCIAL.instagram ? (
          <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-line">
            <InstagramIcon size={16} />
            {copy.instagram}
          </a>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-ink-faint">{copy.privacy}</p>
    </section>
  );
}
