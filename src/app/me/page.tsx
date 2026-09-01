import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getMyLinks } from '@/lib/chain/queries';
import type { MyLink } from '@/lib/chain/types';
import { me as copy, link as linkCopy, nav } from '@/lib/copy';
import { LIMITS } from '@/lib/env';
import { timeAgo } from '@/lib/format';
import { ButtonLink } from '@/components/ui/Button';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { LinkTile, TILE_PAD, TileHead } from '@/components/ui/LinkTile';

/** Everything this device has left. Cookie-scoped; no account. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: copy.title, robots: { index: false, follow: false } };

function statusLine(l: MyLink): string {
  switch (l.status) {
    case 'paid':
      return linkCopy.pending;
    case 'skipped':
      return linkCopy.skipped;
    case 'removed':
      return linkCopy.removed;
    default:
      return l.readCount === 0
        ? linkCopy.unread
        : linkCopy.read(l.readCount, l.lastReadCity, l.lastReadAt ? timeAgo(l.lastReadAt) : null);
  }
}

export default async function MyLinksPage() {
  const deviceId = (await cookies()).get(LIMITS.deviceCookie)?.value;
  const links = deviceId ? await getMyLinks(deviceId) : [];

  return (
    <main className="page">
      <Header right={<Link href="/find">{nav.find}</Link>} />

      <section className="mt-10">
        <h1 className="hero text-[2.4rem] text-ink sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-sm text-ink-muted">{copy.sub}</p>
      </section>

      {links.length === 0 ? (
        <section className="mt-10">
          <p className="text-ink-muted">{copy.empty}</p>
          <ButtonLink href="/" variant="ghost" className="mt-6">
            {copy.emptyCta}
          </ButtonLink>
        </section>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {links.map((l) => (
            <LinkTile key={l.id} tint={l.tint} as="li" quiet padded={false}>
              <Link href={`/l/${l.revealToken}`} className={`block ${TILE_PAD}`}>
                <TileHead position={l.position} size="md" label={l.chainTitle} meta={l.city} />
                <p className="mt-3 text-sm text-ink-muted">{statusLine(l)}</p>
              </Link>
            </LinkTile>
          ))}
        </ul>
      )}

      <Footer />
    </main>
  );
}
