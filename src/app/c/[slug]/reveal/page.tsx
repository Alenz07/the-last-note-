import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRevealView } from '@/lib/chain/queries';
import { reveal as copy } from '@/lib/copy';
import { Composer, EventBeacon } from '@/components/flow';
import { ButtonLink } from '@/components/ui/Button';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { RevealedTile } from '@/components/ui/RevealedTile';

/**
 * The moment they paid for. Bearer token in ?t=; nothing here is cacheable.
 * Reveal first, then the slot: the next stranger is waiting.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Your reveal', robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> };

const DELAY = ['', 'unseal-delay', 'unseal-delay-2'];

export default async function RevealPage({ searchParams }: Props) {
  const { t } = await searchParams;
  const view = t ? await getRevealView(t) : null;
  if (!view) notFound();

  const { chain, me, revealed, canWrite, isFirst } = view;
  const myLinkHref = `/l/${me.revealToken}`;
  const chainHasMedia = chain.allowVoice || chain.allowImage;

  return (
    <main className="page">
      <Header right={<Link href={myLinkHref}>Your link</Link>} />

      <section className={`mt-10 tint-${chain.tint}`}>
        <p className="eyebrow">{chain.title}</p>
        <h1 className="hero mt-3 text-[2.4rem] text-ink sm:text-5xl">{copy.youAre(me.position)}</h1>
      </section>

      <section className="mt-8 flex flex-col gap-3">
        {isFirst ? (
          <p className="text-lg text-ink-muted">{copy.firstWriter}</p>
        ) : (
          revealed.map((link, i) => (
            <RevealedTile
              key={link.id}
              tint={chain.tint}
              link={link}
              // readCount already includes this reader
              foot={copy.readBefore(Math.max(0, link.readCount - 1))}
              className={DELAY[Math.min(i, DELAY.length - 1)]}
            />
          ))
        )}
      </section>

      <section className="mt-12">
        {canWrite ? (
          <>
            <h2 className="display text-2xl text-ink">{copy.nowYours}</h2>
            <div className="mt-5">
              <Composer token={me.revealToken} chain={chain} deadlineAt={me.deadlineAt} />
            </div>
            {chainHasMedia ? <p className="mt-4 text-sm text-ink-faint">{copy.mediaNote}</p> : null}
          </>
        ) : (
          <>
            <p className="text-ink-muted">{me.status === 'submitted' ? copy.alreadyWritten : copy.expired}</p>
            <ButtonLink href={myLinkHref} variant="ghost" className="mt-6">
              Your link
            </ButtonLink>
          </>
        )}
      </section>

      <Footer />
      <EventBeacon name="reveal_view" chainSlug={chain.slug} />
    </main>
  );
}
