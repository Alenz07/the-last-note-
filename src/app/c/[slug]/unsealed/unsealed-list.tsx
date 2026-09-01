import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUnsealedLinks } from '@/lib/chain/queries';
import { og, unseal as copy } from '@/lib/copy';
import { formatPosition, timeAgo } from '@/lib/format';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { LinkTile, TileBody, TileHead } from '@/components/ui/LinkTile';

/**
 * The proof the chain is real: text of links that have rolled past the unseal
 * horizon, exactly as left. Public, indexable, ISR. Media never appears here.
 * Shared by /c/[slug]/unsealed (page 1) and /c/[slug]/unsealed/[page].
 */

export const PAGE_SIZE = 50;

export async function unsealedMetadata(slug: string, page: number): Promise<Metadata> {
  const data = await getUnsealedLinks(slug, page, PAGE_SIZE);
  if (!data) return { title: 'Not found' };
  return {
    title: `${copy.title} · ${data.chain.title}`,
    description: og.description(data.chain.title, data.chain.pricePaise),
    alternates: { canonical: page === 1 ? `/c/${slug}/unsealed` : `/c/${slug}/unsealed/${page}` },
  };
}

export async function UnsealedList({ slug, page }: { slug: string; page: number }) {
  const data = await getUnsealedLinks(slug, page, PAGE_SIZE);
  if (!data || (page > 1 && data.links.length === 0)) notFound();
  const { chain, links, total } = data;
  const hasOlder = page * PAGE_SIZE < total;

  return (
    <main className="page">
      <Header right={<Link href={`/c/${chain.slug}`}>{chain.title}</Link>} />

      <section className={`mt-10 tint-${chain.tint}`}>
        <p className="eyebrow">{chain.title}</p>
        <h1 className="hero mt-3 text-[2.4rem] text-ink sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-ink-muted">{copy.sub}</p>
      </section>

      {links.length === 0 ? (
        <p className="mt-10 text-ink-muted">{copy.empty(chain.unsealAfter)}</p>
      ) : (
        <ol className="mt-8 flex flex-col gap-3">
          {links.map((link) =>
            link.status === 'submitted' && link.body ? (
              <LinkTile key={link.id} tint={chain.tint} as="li" quiet id={`l${link.position}`}>
                <TileHead
                  position={link.position}
                  size="md"
                  meta={[link.city, link.readCount > 0 ? `read by ${link.readCount}` : null].filter(Boolean).join(' · ') || null}
                />
                <TileBody text={link.body} className="mt-3" />
                {link.submittedAt ? <p className="mt-3 text-xs text-ink-faint">{timeAgo(link.submittedAt)}</p> : null}
              </LinkTile>
            ) : (
              <li key={link.id} id={`l${link.position}`} className="px-5 py-2 text-sm text-ink-faint">
                <span className="num">{formatPosition(link.position)}</span> · {link.status === 'skipped' ? copy.skipped : copy.removed}
              </li>
            ),
          )}
        </ol>
      )}

      <nav className="mt-10 flex justify-between text-sm text-ink-muted">
        {page > 1 ? (
          <Link href={page === 2 ? `/c/${chain.slug}/unsealed` : `/c/${chain.slug}/unsealed/${page - 1}`}>← Newer</Link>
        ) : (
          <span />
        )}
        {hasOlder ? <Link href={`/c/${chain.slug}/unsealed/${page + 1}`}>{copy.more} →</Link> : null}
      </nav>

      <Footer />
    </main>
  );
}
