import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMyLink } from '@/lib/api';
import { link as copy } from '@/lib/copy';
import { formatPosition, timeAgo } from '@/lib/format';
import { Countdown, PushOptIn, ShareActions } from '@/components/flow';
import { Page, SiteFooter, SiteHeader } from '@/components/Chrome';
import { FollowCard } from '@/components/Social';
import { ChainIcon } from '@/components/Icons';

/** Your note: your number, whether a stranger has read it, and how to share it. */
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Your note', robots: { index: false } };

export default async function MyLinkPage({ params }: PageProps<'/l/[token]'>) {
  const { token } = await params;
  const my = await getMyLink(token);
  if (!my) notFound();

  const unsealsAt = my.position + my.chain.unsealAfter;
  const alreadyUnsealed = my.chain.tail >= unsealsAt;
  const lastReadAgo = my.lastReadAt ? timeAgo(my.lastReadAt) : null;

  return (
    <Page>
      <SiteHeader />

      <section className="mt-6 text-center">
        <span className="ring mx-auto mb-5 flex h-14 w-14">
          <ChainIcon size={22} />
        </span>
        <p className="eyebrow">{my.chainTitle}</p>
        <h1 className="hero-title mt-3 text-[2.4rem] text-ink sm:text-[3rem] num">{formatPosition(my.position)}</h1>
        <p className="mt-2 text-sm text-ink-muted">{copy.youAre(my.position, my.city)}</p>
      </section>

      <article className="card mt-8 p-6 sm:p-7">
        {my.status === 'submitted' && my.body ? (
          <>
            <span aria-hidden className="qmark">
              &ldquo;
            </span>
            <p className="serif mt-2 whitespace-pre-wrap text-[1.3rem] leading-relaxed text-ink">{my.body}</p>
            {my.hasVoice || my.hasImage || my.contact ? (
              <p className="mt-4 text-[13px] text-ink-faint">
                {[my.hasVoice ? 'voice note' : null, my.hasImage ? 'photo' : null, my.contact ? 'contact' : null]
                  .filter(Boolean)
                  .join(' · ')}{' '}
                — private to whoever pays to read it
              </p>
            ) : null}
          </>
        ) : my.status === 'paid' ? (
          <div className="text-center">
            <p className="text-lg text-ink">{copy.pending}</p>
            <p className="mt-2 text-sm text-ink-muted">
              <Countdown deadlineAt={my.deadlineAt} /> to seal it.
            </p>
            <Link href={`/c/${my.chainSlug}/reveal?t=${my.revealToken}`} className="btn btn-gold mt-5">
              {copy.write}
            </Link>
          </div>
        ) : (
          <p className="text-center text-ink-muted">{my.status === 'removed' ? copy.removed : copy.skipped}</p>
        )}
      </article>

      {my.status === 'submitted' ? (
        <>
          <div className="card mt-4 p-6 text-center">
            <p className="text-[15px] text-ink">
              {my.readCount > 0 ? copy.read(my.readCount, my.lastReadCity, lastReadAgo) : copy.unread}
            </p>
            <p className="mt-2 text-xs text-ink-faint">
              {alreadyUnsealed ? copy.unsealed : copy.unsealsAt(unsealsAt)}
            </p>
            <PushOptIn className="mt-5" token={my.revealToken} />
          </div>

          <section className="mt-8">
            <h2 className="section-h">Share your note</h2>
            <p className="mx-auto mt-5 max-w-sm text-center text-sm text-ink-muted">{copy.shareHint}</p>
            <ShareActions className="mt-5" url={my.shareUrl} text={my.shareText} chainSlug={my.chainSlug} />
          </section>

          {/* Highest-affinity moment: they've just written and want to know when it's read. */}
          <section className="mt-8">
            <FollowCard />
          </section>
        </>
      ) : null}

      <p className="mt-10 text-center text-sm">
        <Link href="/me" className="text-ink-muted hover:text-ink">
          All your notes →
        </Link>
      </p>

      <SiteFooter />
    </Page>
  );
}
