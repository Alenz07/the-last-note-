import Link from 'next/link';
import { getMyLinks } from '@/lib/api';
import { me as copy } from '@/lib/copy';
import { formatPosition, timeAgo } from '@/lib/format';
import { Page, SiteFooter, SiteHeader } from '@/components/Chrome';

/** Everything left from this device. No account — just the year-long cookie. */
export const dynamic = 'force-dynamic';

export const metadata = { title: copy.title, robots: { index: false } };

const STATUS_LABEL: Record<string, string> = {
  paid: 'Unwritten',
  submitted: 'Sealed',
  skipped: 'Passed',
  removed: 'Removed',
};

export default async function MePage() {
  const links = await getMyLinks();

  return (
    <Page>
      <SiteHeader />

      <section className="mt-6 text-center">
        <h1 className="hero-title text-[2.1rem] text-ink sm:text-[2.5rem]">{copy.title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">{copy.sub}</p>
      </section>

      {links.length === 0 ? (
        <div className="card mt-10 p-8 text-center">
          <p className="text-ink-muted">{copy.empty}</p>
          <Link href="/" className="btn btn-gold mt-6">
            {copy.emptyCta}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {links.map((l) => (
            <li key={l.id} className="card">
              <Link href={`/l/${l.revealToken}`} className="block p-5 focus:outline-none">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.15em] text-ink-faint">{l.chainTitle}</span>
                  <span className="num serif text-xl text-ink">{formatPosition(l.position)}</span>
                </div>
                {l.body ? (
                  <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-ink-muted">{l.body}</p>
                ) : null}
                <p className="mt-3 text-xs text-ink-faint">
                  {STATUS_LABEL[l.status] ?? l.status} · {timeAgo(l.createdAt)}
                  {l.status === 'submitted'
                    ? ` · ${l.readCount === 0 ? 'unread' : l.readCount === 1 ? 'read by 1' : `read by ${l.readCount}`}`
                    : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-center text-sm">
        <Link href="/find" className="text-ink-muted hover:text-ink">
          Lost a note from another device? →
        </Link>
      </p>

      <SiteFooter />
    </Page>
  );
}
