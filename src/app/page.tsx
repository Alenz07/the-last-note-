import Link from 'next/link';
import type { Metadata } from 'next';
import { getLiveChains, getTeaser } from '@/lib/chain/queries';
import type { ChainSummary, SealedMeta } from '@/lib/chain/types';
import { SITE, landing, nav, teaser } from '@/lib/copy';
import { timeAgo } from '@/lib/format';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { HeroScene } from '@/components/ui/HeroScene';
import { HowItWorks } from '@/components/ui/HowItWorks';
import { chainIcon, BoltIcon, LockIcon, MaskIcon, PersonIcon, ShieldIcon } from '@/components/ui/Icons';
import { LinkTile, TileFoot, TileHead } from '@/components/ui/LinkTile';
import { Redacted } from '@/components/ui/Redacted';

// Hot read path: served from the ISR cache, never touches the DB per view.
export const revalidate = 5;

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
};

const WHY_ICONS = [MaskIcon, PersonIcon, BoltIcon, ShieldIcon];

/** Chains plus a glimpse of each one's latest sealed link. A few cheap queries per 5 s revalidate. */
async function loadLanding() {
  const chains = await getLiveChains();
  const sealed = await Promise.all(chains.map((c) => getTeaser(c.slug).then((t) => t?.sealed ?? null)));
  return chains.map((chain, i) => ({ chain, sealed: sealed[i] }));
}

export default async function LandingPage() {
  const rows = await loadLanding();
  const featured = rows.find((r) => r.sealed) ?? rows[0];
  const totalLinks = rows.reduce((n, r) => n + r.chain.stats.length, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
      <Header
        center={
          <nav className="hidden items-center gap-7 text-sm text-ink-muted md:flex">
            <span className="text-ink">{nav.home}</span>
            <a href="#chains" className="hover:text-ink">{nav.chains}</a>
            <a href="#how" className="hover:text-ink">{nav.how}</a>
            <Link href="/me" className="hover:text-ink">{nav.myLinks}</Link>
          </nav>
        }
        right={
          featured ? (
            <Link href={`/c/${featured.chain.slug}`} className="btn btn-primary !min-h-10 !w-auto !px-4 !text-[0.8rem]">
              {nav.write}
            </Link>
          ) : undefined
        }
      />

      {/* ---------------- hero: headline left, floating sealed note right ---------------- */}
      <HeroScene className="mt-10 pb-14 lg:mt-14">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <div className="pt-4">
            <h1 className="hero text-[2.6rem] text-ink sm:text-5xl lg:text-[3.4rem]">{landing.headline}</h1>
            <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-ink-muted">{landing.sub}</p>

            {featured ? (
              <div className="mt-8 max-w-xs">
                <Link href={`/c/${featured.chain.slug}`} className="btn btn-primary">
                  <LockIcon size={15} />
                  {landing.enter(featured.chain.pricePaise)}
                </Link>
              </div>
            ) : null}

            <p className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-ink-faint">
              {landing.badges.map((b, i) => (
                <span key={b} className="flex items-center gap-3">
                  {i > 0 ? <span aria-hidden className="text-line-gold">✦</span> : null}
                  {b}
                </span>
              ))}
            </p>
          </div>

          {featured?.sealed ? (
            <FloatingSealed chain={featured.chain} sealed={featured.sealed} />
          ) : null}
        </section>
      </HeroScene>

      {/* ---------------- three cards: how · chains · why ---------------- */}
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <section id="how" className="tile tint-slate scroll-mt-6 p-6 sm:p-7">
          <HowItWorks />
        </section>

        <section id="chains" className="tile tint-amber scroll-mt-6 p-6 sm:p-7">
          <h2 className="section-title">{landing.chainsEyebrow}</h2>
          {rows.length === 0 ? (
            <p className="mt-6 text-center text-ink-muted">{landing.emptyChains}</p>
          ) : (
            <ul className="mt-7 grid grid-cols-2 gap-3">
              {rows.map(({ chain }) => {
                const Icon = chainIcon(chain.slug);
                return (
                  <li key={chain.id} className={`tile tile-vivid tint-${chain.tint}`}>
                    <Link href={`/c/${chain.slug}`} className="cat-tile focus:outline-none">
                      <span className="seal-ring h-11 w-11">
                        <Icon size={19} />
                      </span>
                      <span className="display text-lg leading-tight text-ink">{chain.title}</span>
                      <span className="text-xs text-ink-muted num">{landing.links(chain.stats.length)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-6 text-center text-xs text-ink-faint">{landing.mediaNote}</p>
        </section>

        <section className="tile tint-moss p-6 sm:p-7">
          <h2 className="section-title">{landing.whyTitle}</h2>
          <ul className="mt-7 flex flex-col gap-5">
            {landing.why.map((w, i) => {
              const Icon = WHY_ICONS[i] ?? MaskIcon;
              return (
                <li key={w.title} className="flex gap-4">
                  <span className="seal-ring h-10 w-10 shrink-0">
                    <Icon size={17} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">{w.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{w.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* ---------------- manifesto ---------------- */}
      <section className="tile mt-4 p-8 text-center sm:p-12">
        <span aria-hidden className="quote-mark mx-auto">
          &ldquo;
        </span>
        <p className="display mx-auto mt-2 max-w-md text-2xl leading-snug text-ink sm:text-3xl">
          {landing.manifesto.lines.join(' ')}
          <span className="block text-accent">{landing.manifesto.accent}</span>
        </p>
        {totalLinks > 0 ? <p className="mt-6 text-sm text-ink-muted num">{landing.totalLine(totalLinks)}</p> : null}
      </section>

      <Footer />
    </main>
  );
}

/** The mockup's floating latest-note card — ours shows the sealed shape, because content costs ₹5. */
function FloatingSealed({ chain, sealed }: { chain: ChainSummary; sealed: SealedMeta }) {
  const ago = sealed.submittedAt ? timeAgo(sealed.submittedAt) : null;
  return (
    <Link href={`/c/${chain.slug}`} className="block focus:outline-none lg:mt-6">
      <LinkTile tint={chain.tint} as="div" className="float-card">
        <TileHead
          position={sealed.position}
          label={`${landing.latestEyebrow} · ${chain.title}`}
          meta={[sealed.city, ago].filter(Boolean).join(' · ') || null}
          size="md"
        />
        <Redacted shape={{ ...sealed.shape, words: sealed.shape.words.slice(0, 18) }} className="mt-5 text-[16px]" />
        <TileFoot>
          <span>
            {teaser.meta(sealed.shape.chars, null, null)}
            {sealed.voiceSeconds ? ` · ${teaser.voice(sealed.voiceSeconds)}` : ''}
          </span>
          <span>{teaser.readCount(sealed.readCount)}</span>
        </TileFoot>
      </LinkTile>
    </Link>
  );
}
