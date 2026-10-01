import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTeaser } from '@/lib/api';
import { free as freeCopy, revealsLine, teaser as copy } from '@/lib/copy';
import { FREE } from '@/lib/free';
import { FreeBanner } from '@/components/FreeBanner';
import { EventBeacon, LiveStats, PayButton } from '@/components/flow';
import { BackLink, Page, SiteFooter, SiteHeader } from '@/components/Chrome';
import { ChainIcon, EyeIcon, LockIcon, QuillIcon } from '@/components/Icons';
import { SealedNote } from '@/components/NoteCard';

const STEPS = [
  { icon: EyeIcon, text: 'Reveal what the last stranger left.' },
  { icon: QuillIcon, text: 'Leave yours. Up to 1,000 characters, twenty minutes.' },
  { icon: ChainIcon, text: 'The next stranger reads it. You will know when.' },
];

/**
 * The product's advertisement: everything about the note except the note.
 * Shared by /c/[slug] (latest) and /c/[slug]/[position] (share landing).
 */
export async function Teaser({ slug, position }: { slug: string; position?: number }) {
  const data = await getTeaser(slug, position);
  if (!data) notFound();
  const { chain, sealed, isReferral } = data;

  const live = chain.status === 'live';
  const unsealsAt = sealed ? sealed.position + chain.unsealAfter : null;
  const alreadyUnsealed = unsealsAt !== null && chain.tail >= unsealsAt;
  const hasMedia = chain.allowVoice || chain.allowImage;

  return (
    <Page>
      <SiteHeader
        nav={
          <Link href={`/c/${chain.slug}/unsealed`} className="hidden text-sm text-ink-muted hover:text-ink sm:block">
            Unsealed
          </Link>
        }
      />
      <div className="mb-2">
        <BackLink href="/chains" label="All chains" />
      </div>

      <section className="pb-10 pt-8 text-center">
        <p className="eyebrow">{chain.title}</p>
        <h1 className="hero-title mt-3 text-[2.1rem] text-ink sm:text-[2.6rem]">
          {sealed
            ? chain.revealCount > 1
              ? copy.heroRange(Math.max(1, sealed.position - chain.revealCount + 1), sealed.position)
              : copy.hero(sealed.position)
            : copy.heroFirst}
        </h1>
        {isReferral ? <p className="mt-3 text-sm text-gold">{copy.referral}</p> : null}
      </section>

      {sealed ? (
        <>
          <SealedNote sealed={sealed} eyebrow="Sealed note" glow />
          <p className="mt-4 text-center text-sm text-ink-muted">
            {alreadyUnsealed ? copy.alreadyUnsealed : copy.unsealLine(unsealsAt!, hasMedia)}
          </p>
        </>
      ) : (
        <p className="card p-6 text-center text-[1.05rem] leading-relaxed text-ink-muted">{chain.prompt}</p>
      )}

      <div className="mt-6 text-center">
        <LiveStats slug={chain.slug} initial={chain.stats} />
      </div>

      <div className="mt-8">
        {live ? (
          <>
            <FreeBanner className="mb-4" />
            <PayButton
              className="[&>button]:w-full"
              chainSlug={chain.slug}
              refPosition={isReferral && sealed ? sealed.position : undefined}
              pricePaise={chain.pricePaise}
              isFirst={!sealed}
              revealCount={chain.revealCount}
              label={
                FREE
                  ? !sealed
                    ? freeCopy.ctaFirst
                    : chain.revealCount > 1
                      ? freeCopy.ctaMany(chain.revealCount)
                      : freeCopy.cta
                  : undefined
              }
            />
            <p className="mt-3 text-center text-sm leading-relaxed text-ink-muted">
              {revealsLine(chain.pricePaise, chain.allowVoice, chain.allowImage, FREE)}
            </p>
            <p className="mt-2 flex items-center justify-center gap-2 text-center text-sm text-ink-faint">
              <LockIcon size={13} />
              {copy.ctaMicro(chain.tail + 1)}
            </p>
          </>
        ) : (
          <p className="card p-5 text-center text-ink-muted">{chain.status === 'paused' ? copy.paused : copy.ended}</p>
        )}
      </div>

      <ol className="mt-14 flex flex-col gap-6">
        {STEPS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-4">
            <span className="ring h-10 w-10 shrink-0">
              <Icon size={17} />
            </span>
            <span className="text-[15px] leading-relaxed text-ink-muted">{text}</span>
          </li>
        ))}
      </ol>

      <SiteFooter />
      <EventBeacon name="chain_view" chainSlug={chain.slug} />
    </Page>
  );
}

export async function teaserMetadata(slug: string, position?: number) {
  const data = await getTeaser(slug, position);
  if (!data) return { title: 'Not found' };
  const { chain, sealed } = data;
  return {
    title: sealed ? `${copy.hero(sealed.position)} · ${chain.title}` : chain.title,
    description: `${chain.title}, a chain of strangers. ₹${Math.round(chain.pricePaise / 100)} to reveal the last note, then you leave yours.`,
    alternates: { canonical: position ? `/c/${slug}/${position}` : `/c/${slug}` },
  };
}
