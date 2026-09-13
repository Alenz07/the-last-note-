import { SOCIAL, hasSocial } from '@/lib/site';
import { contact as contactCopy, social as copy } from '@/lib/copy';
import { InstagramIcon, MailIcon, WhatsAppIcon } from './Icons';

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

/**
 * The public contact row under the landing page's three cards. Each channel
 * renders only when its env var is set, so an unconfigured one leaves no gap
 * and no dead link - Instagram simply appears the day a URL is added.
 */
export function ContactCard({ className = '' }: { className?: string }) {
  const items = [
    SOCIAL.whatsapp && { key: 'wa', href: SOCIAL.whatsapp, Icon: WhatsAppIcon, external: true, ...contactCopy.whatsapp },
    SOCIAL.instagram && { key: 'ig', href: SOCIAL.instagram, Icon: InstagramIcon, external: true, ...contactCopy.instagram },
    SOCIAL.email && {
      key: 'mail',
      href: `mailto:${SOCIAL.email}`,
      Icon: MailIcon,
      external: false,
      label: contactCopy.email.label,
      // the address itself is more useful here than a description of it
      hint: SOCIAL.email,
    },
  ].filter(Boolean) as Array<{ key: string; href: string; Icon: typeof MailIcon; external: boolean; label: string; hint: string }>;

  if (items.length === 0) return null;
  // Tailwind needs whole class names in the source, so these are spelled out.
  const cols = items.length >= 3 ? 'sm:grid-cols-3' : items.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1';

  return (
    <section className={`card p-7 sm:p-9 ${className}`} aria-label={copy.aria}>
      <h2 className="section-h">{contactCopy.title}</h2>
      <p className="mx-auto mt-3 max-w-[46ch] text-center text-sm leading-relaxed text-ink-muted">{contactCopy.body}</p>

      <ul className={`mt-8 grid gap-3 ${cols}`}>
        {items.map(({ key, href, Icon, external, label, hint }) => (
          <li key={key}>
            <a
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="card flex h-full items-center gap-4 px-5 py-4 transition-colors hover:border-gold focus:outline-none"
            >
              <span className="ring h-11 w-11 shrink-0">
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-gold">{label}</span>
                <span className="mt-0.5 block break-words text-sm leading-relaxed text-ink-muted">{hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      {SOCIAL.whatsapp ? <p className="mt-6 text-center text-xs text-ink-faint">{contactCopy.note}</p> : null}
    </section>
  );
}
