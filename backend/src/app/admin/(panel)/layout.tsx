import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { env } from '@/lib/env';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const NAV = [
  ['/admin', 'Dashboard'],
  ['/admin/reports', 'Reports'],
  ['/admin/payments', 'Payments'],
  ['/admin/links', 'Find a link'],
  ['/admin/db', 'Database'],
  ['/admin/settings', 'Settings'],
  ['/admin/chains/new', '+ Chain'],
] as const;

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await requireAdmin();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="display text-2xl">
            dernote <span className="text-ink-muted">/ admin</span>
          </Link>
          {env.paymentTestMode ? (
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
              test mode
            </span>
          ) : null}
        </div>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full px-3 py-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink">
              {label}
            </Link>
          ))}
          <Link href="/" className="rounded-full px-3 py-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink">
            Site ↗
          </Link>
          <form method="post" action="/api/admin/logout">
            <button className="rounded-full px-3 py-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink" type="submit">
              Log out
            </button>
          </form>
        </nav>
      </header>
      <main className="py-6">{children}</main>
    </div>
  );
}
