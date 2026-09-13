import Link from 'next/link';
import type { ReactNode } from 'react';
import { SITE } from '@/lib/copy';
import { QuillIcon } from './Icons';
import { SocialLinks } from './Social';

/** Wordmark + optional centre nav + one action. Shared by every page. */
export function SiteHeader({ nav, action }: { nav?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <Link href="/" className="focus:outline-none">
        <span className="wordmark text-lg text-ink">{SITE.name}</span>
        <span className="mt-0.5 hidden text-[11px] text-ink-faint sm:block">{SITE.tagline}</span>
      </Link>
      {nav}
      {action}
    </header>
  );
}

export function WriteAction({ href }: { href: string }) {
  return (
    <Link href={href} className="btn btn-gold !min-h-10 !px-4 !text-[0.78rem]">
      <QuillIcon size={14} /> Write a note
    </Link>
  );
}

/** Quiet back link used on inner screens, matching the mockup's ← in the corner. */
export function BackLink({ href, label = 'Back' }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 19 8 12l7-7" />
      </svg>
      {label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-14 flex flex-col items-center gap-3 border-t border-line pt-7 text-xs text-ink-faint">
      <span className="wordmark text-sm text-ink-muted">{SITE.name}</span>
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
        <Link href="/me" className="hover:text-ink-muted">Your notes</Link>
        <Link href="/find" className="hover:text-ink-muted">Lost a note?</Link>
        <Link href="/terms" className="hover:text-ink-muted">Terms</Link>
        <Link href="/privacy" className="hover:text-ink-muted">Privacy</Link>
        <Link href="/refunds" className="hover:text-ink-muted">Refunds</Link>
        <Link href="/content-policy" className="hover:text-ink-muted">Content</Link>
        <Link href="/grievance" className="hover:text-ink-muted">Contact</Link>
      </nav>
      <SocialLinks className="mt-1" />
      <span>© 2026 {SITE.name}. {SITE.footer}</span>
    </footer>
  );
}

/** Narrow centred column — every screen except the landing uses this. */
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-xl px-5 pb-16 sm:px-6 ${className}`}>{children}</main>;
}
