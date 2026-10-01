import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRevealView } from '@/lib/api';
import { reveal as copy, errors } from '@/lib/copy';
import { Composer, EventBeacon, PayButton, ReportButton } from '@/components/flow';
import { free as freeCopy } from '@/lib/copy';
import { FREE } from '@/lib/free';
import { Page, SiteFooter, SiteHeader } from '@/components/Chrome';
import { FollowCard } from '@/components/Social';
import { LockIcon, QuillIcon } from '@/components/Icons';
import { RevealedNote } from '@/components/NoteCard';

/** What ₹5 bought, then the ten minutes to write yours. Never cached. */
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Your reveal', robots: { index: false } };

export default async function RevealPage({ searchParams }: PageProps<'/c/[slug]/reveal'>) {
  const { t } = await searchParams;
  const token = typeof t === 'string' ? t : null;
  if (!token) notFound();

  const view = await getRevealView(token);
  if (!view) notFound();
  const { chain, me, revealed, canWrite, isFirst } = view;

  return (
    <Page>
      <SiteHeader />

      <section className="mt-4 text-center">
        <p className="eyebrow">{chain.title}</p>
        <h1 className="hero-title mt-3 text-[1.9rem] text-ink sm:text-[2.3rem]">
          {isFirst ? copy.firstWriter : 'Someone left this for you.'}
        </h1>
        <p className="mt-3 text-sm text-ink-muted">{copy.youAre(me.position)}</p>
      </section>

      {revealed.length > 0 ? (
        <div className="mt-8 flex flex-col gap-4">
          {revealed.map((link) => (
            <div key={link.id}>
              <RevealedNote link={link} foot={copy.readBefore(Math.max(0, link.readCount - 1))} />
              <div className="mt-2 text-right">
                <ReportButton linkId={link.id} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Paying again walks one step further back — already how capture works,
          since notes you have read are excluded. This just makes it visible. */}
      {revealed.length > 0 ? (
        <section className="card mt-6 p-6 text-center">
          <h2 className="serif text-[1.25rem] leading-tight text-ink">{copy.readAnother.title}</h2>
          <p className="mx-auto mt-2 max-w-[40ch] text-sm leading-relaxed text-ink-muted">{copy.readAnother.body}</p>
          <PayButton
            className="mt-5 [&>button]:w-full"
            chainSlug={chain.slug}
            pricePaise={chain.pricePaise}
            revealCount={chain.revealCount}
            label={FREE ? freeCopy.cta : copy.readAnother.cta(`₹${Math.round(chain.pricePaise / 100)}`)}
          />
        </section>
      ) : null}

      <section className="mt-12">
        <div className="text-center">
          <span className="ring mx-auto mb-4 flex h-14 w-14">
            <QuillIcon size={22} />
          </span>
          <h2 className="serif text-[1.6rem] text-ink">{copy.nowYours}</h2>
          <p className="mt-1 text-sm text-ink-muted">{copy.subtitle}</p>
        </div>

        {canWrite ? (
          <Composer className="mt-6" token={me.revealToken} chain={chain} deadlineAt={me.deadlineAt} />
        ) : me.status === 'submitted' ? (
          <div className="card mt-6 p-6 text-center">
            <p className="text-ink">{copy.alreadyWritten}</p>
            <Link href={`/l/${me.revealToken}`} className="btn btn-line mt-5">
              See your note
            </Link>
          </div>
        ) : (
          <div className="card mt-6 p-6 text-center">
            <p className="text-ink-muted">{copy.expired}</p>
            <Link href={`/c/${chain.slug}`} className="btn btn-line mt-5">
              {errors.retry}
            </Link>
          </div>
        )}

        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-ink-faint">
          <LockIcon size={12} />
          {copy.lockNote}
        </p>
      </section>

      {/* Below the composer, never above it. Someone mid-write has twenty
          minutes on a clock, and a button that opens WhatsApp takes them out
          of the browser entirely — the ones who do not come back leave a
          passed slot where a note should have been. Down here it is only
          reached by people who have finished, or who were never writing. */}
      <FollowCard className="mt-12" />

      <SiteFooter />
      <EventBeacon name="reveal_view" chainSlug={chain.slug} />
    </Page>
  );
}
