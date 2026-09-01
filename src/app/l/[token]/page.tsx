import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMyLink } from '@/lib/chain/queries';
import { link as copy, nav, teaser } from '@/lib/copy';
import { timeAgo } from '@/lib/format';
import { Countdown, PushOptIn, ShareActions } from '@/components/flow';
import { ButtonLink } from '@/components/ui/Button';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { LinkTile, TileBody, TileFoot, TileHead } from '@/components/ui/LinkTile';

/**
 * "You are link #4,372." The owner's page: their words, who has read them,
 * when the text unseals, and the share card. Bearer token in the path.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Your link', robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }> };

export default async function MyLinkPage({ params }: Props) {
  const { token } = await params;
  const my = await getMyLink(token);
  if (!my) notFound();
  const { chain } = my;

  const unsealsAt = my.position + chain.unsealAfter;
  const isUnsealed = chain.tail >= unsealsAt;
  const revealHref = `/c/${my.chainSlug}/reveal?t=${my.revealToken}`;
  const extras = [my.hasVoice ? 'voice note' : null, my.hasImage ? teaser.photo : null].filter(Boolean).join(' · ');

  return (
    <main className="page">
      <Header right={<Link href="/me">{nav.myLinks}</Link>} />

      <section className="mt-10">
        <LinkTile tint={my.tint}>
          <TileHead position={my.position} label={`You are link · ${my.chainTitle}`} meta={my.city} />

          {my.status === 'submitted' && my.body ? <TileBody text={my.body} /> : null}
          {my.status === 'paid' ? (
            <p className="mt-4 flex gap-2 text-ink-muted">
              <span>{copy.pending}</span>
              <Countdown deadlineAt={my.deadlineAt} className="num text-ink" />
            </p>
          ) : null}
          {my.status === 'skipped' ? <p className="mt-4 text-ink-muted">{copy.skipped}</p> : null}
          {my.status === 'removed' ? <p className="mt-4 text-ink-muted">{copy.removed}</p> : null}

          <TileFoot>
            {extras ? <span>{extras}</span> : null}
            {my.status === 'submitted' ? (
              <>
                <span>
                  {my.readCount === 0
                    ? copy.unread
                    : copy.read(my.readCount, my.lastReadCity, my.lastReadAt ? timeAgo(my.lastReadAt) : null)}
                </span>
                <span>{isUnsealed ? copy.unsealed : copy.unsealsAt(unsealsAt)}</span>
              </>
            ) : null}
          </TileFoot>
        </LinkTile>
      </section>

      {my.status === 'paid' ? (
        <ButtonLink href={revealHref} className="mt-6">
          {copy.write}
        </ButtonLink>
      ) : null}

      {my.status === 'submitted' ? (
        <section className="mt-8 flex flex-col gap-5">
          <p className="text-sm text-ink-muted">{copy.shareHint}</p>
          <ShareActions url={my.shareUrl} text={my.shareText} />
          <PushOptIn token={my.revealToken} />
        </section>
      ) : null}

      <Footer />
    </main>
  );
}
