import Link from 'next/link';
import { SITE, nav } from '@/lib/copy';

const LEGAL = [
  ['/terms', nav.terms],
  ['/privacy', nav.privacy],
  ['/refunds', nav.refunds],
  ['/content-policy', nav.contentPolicy],
  ['/grievance', nav.grievance],
] as const;

export function Footer() {
  return (
    <footer className="mt-16 flex flex-col gap-3 text-xs text-ink-faint">
      <p>{SITE.footer}</p>
      <nav className="flex flex-wrap gap-x-4 gap-y-1">
        {LEGAL.map(([href, label]) => (
          <Link key={href} href={href} className="hover:text-ink-muted">
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
