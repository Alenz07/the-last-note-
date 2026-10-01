import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getUnsealed } from '@/lib/api';
import { unseal as copy } from '@/lib/copy';
import { formatCount, timeAgo } from '@/lib/format';
import { BackLink, Page, SiteFooter, SiteHeader } from '@/components/Chrome';

/**
 * The public archive — text only, and only once the chain has moved well past it.
 *
 * Dynamic, not ISR: the page number comes from ?page=, and a statically
 * rendered page cannot read the query string — declaring revalidate here made
 * every request throw DYNAMIC_SERVER_USAGE and return a bare 500. The fetch
 * underneath is still cached for 60s, so the backend sees the same load.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/c/[slug]/unsealed'>): Promise<Metadata> {
  const { slug } = await params;
  const data = await getUnsealed(slug);
  if (!data) return { title: 'Not found' };
  return {
    title: `${copy.title} · ${data.chain.title}`,
    description: `${formatCount(data.total)} notes from ${data.chain.title}, unsealed for everyone. ${copy.sub}`,
  };
}

export default async function UnsealedPage({ params, searchParams }: PageProps<'/c/[slug]/unsealed'>) {
  const { slug } = await params;
  const { page } = await searchParams;
  const n = typeof page === 'string' && /^[1-9]\d{0,5}$/.test(page) ? Number(page) : 1;

  const data = await getUnsealed(slug, n);
  if (!data) notFound();
  const { chain, links, total, pageSize } = data;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Page className="max-w-2xl">
      <SiteHeader />
      <div className="mb-2">
        <BackLink href={`/c/${chain.slug}`} label={chain.title} />
      </div>

      <section className="mt-6 text-center">
        <h1 className="hero-title text-[2.1rem] text-ink sm:text-[2.5rem]">{copy.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">{copy.sub}</p>
        {total > 0 ? <p className="mt-2 text-xs text-ink-faint num">{formatCount(total)} so far</p> : null}
      </section>

      {links.length === 0 ? (
        <div className="card mt-10 p-8 text-center">
          <p className="text-ink-muted">{copy.empty(chain.unsealAfter)}</p>
          <Link href={`/c/${chain.slug}`} className="btn btn-gold mt-6">
            Reveal the latest note
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {links.map((l) => (
            <li key={l.id} id={`n${l.position}`} className="card scroll-mt-6 p-5 sm:p-6">
              {l.status === 'submitted' && l.body ? (
                <>
                  <span aria-hidden className="qmark">
                    &ldquo;
                  </span>
                  <p className="serif mt-2 whitespace-pre-wrap text-[1.2rem] leading-relaxed text-ink">{l.body}</p>
                </>
              ) : (
                <p className="serif text-[1.05rem] italic text-ink-faint">
                  {l.status === 'skipped' ? copy.skipped : copy.removed}
                </p>
              )}
              <p className="mt-4 text-xs text-ink-faint">
                {copy.row(l.position, l.city, l.readCount)}
                {l.submittedAt ? ` · ${timeAgo(l.submittedAt)}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 ? (
        <nav className="mt-8 flex items-center justify-between text-sm">
          {n > 1 ? (
            <Link href={`/c/${chain.slug}/unsealed?page=${n - 1}`} className="btn btn-line !min-h-10 !px-4">
              {copy.newer}
            </Link>
          ) : (
            <span />
          )}
          <span className="num text-ink-faint">
            {n} / {pages}
          </span>
          {n < pages ? (
            <Link href={`/c/${chain.slug}/unsealed?page=${n + 1}`} className="btn btn-line !min-h-10 !px-4">
              {copy.older}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <SiteFooter />
    </Page>
  );
}
