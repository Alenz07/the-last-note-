import Link from 'next/link';
import { getChains, getTeaser } from '@/lib/api';
import { formatCount, formatPosition, rupees, timeAgo } from '@/lib/format';
import { SITE, SOCIAL } from '@/lib/site';
import { launch as launchCopy } from '@/lib/copy';
import { LaunchCountdown } from '@/components/LaunchCountdown';
import type { ChainSummary, SealedMeta } from '@/lib/types';
import { ArchScene } from '@/components/ArchScene';
import { BoltIcon, ChainGlyph, ChainIcon, DownloadIcon, EyeIcon, LockIcon, MaskIcon, PersonIcon, QuillIcon, ShieldIcon, WhatsAppIcon } from '@/components/Icons';
import { Redacted } from '@/components/Redacted';
import { ContactCard } from '@/components/Social';

export const revalidate = 5;

/* ------------------------------------------------------------------ copy (mockup voice) */
const HERO_SUB = ['You don’t know who.', 'You don’t know why.', 'You can only read what they left behind.'];
const BADGES = ['Anonymous', 'Real', 'Instant'];
const HOW = [
  { icon: QuillIcon, title: 'Write', desc: 'Leave your note anonymously.' },
  { icon: EyeIcon, title: 'Reveal', desc: 'Discover what someone else wrote.' },
  { icon: ChainIcon, title: 'Continue', desc: 'Add your note to the never-ending chain.' },
];
const WHY = [
  { icon: MaskIcon, title: '100% Anonymous', desc: 'No profiles. No tracking. Just honest thoughts.' },
  { icon: PersonIcon, title: 'Real & Unfiltered', desc: 'Real people. Real thoughts. Unfiltered and untouched.' },
  { icon: BoltIcon, title: 'Instant Curiosity', desc: 'One note. One click. Curiosity never ends.' },
  { icon: ShieldIcon, title: 'Safe & Respectful', desc: 'We moderate to keep the space positive and safe.' },
];

export default async function Landing() {
  const chains = await getChains();
  const teasers = await Promise.all(chains.map((c) => getTeaser(c.slug)));
  const featured = teasers.find((t) => t?.sealed) ?? teasers[0] ?? null;
  // submitted, not length: a slot that was paid for but never written into is
  // not a note, and counting it would advertise silence as content.
  const totalNotes = chains.reduce((n, c) => n + c.stats.submitted, 0);
  const price = featured ? rupees(featured.chain.pricePaise) : '₹5';
  // Always choose a chain first — the hero never drops you into one.
  const enterHref = '/chains';
  // Before launch the chains are paused server-side, so the pay button would
  // only lead to an error. Show the countdown and the channel instead.
  // Clearing NEXT_PUBLIC_LAUNCH_AT and rebuilding is what opens the site - the
  // clock itself lives in the client component, since this page is ISR-cached.
  const preLaunch = Boolean(SITE.launchAt);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-14 sm:px-8">
      {/* ---------------- nav ---------------- */}
      <header className="flex items-center justify-between gap-4 py-5">
        <Link href="/" className="focus:outline-none">
          <span className="wordmark text-lg text-ink">{SITE.name}</span>
          <span className="mt-0.5 hidden text-[11px] text-ink-faint sm:block">{SITE.tagline}</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-ink-muted md:flex">
          <span className="border-b border-gold pb-0.5 text-ink">Home</span>
          <Link href="/chains" className="hover:text-ink">Chains</Link>
          {/* Downloads the manual — a plain <a> so Next doesn't prefetch a PDF. */}
          <a href="/manual" className="hover:text-ink">How it works</a>
          <a href="#why" className="hover:text-ink">About</a>
        </nav>
        {preLaunch && SOCIAL.whatsapp ? (
          <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-gold !min-h-10 !px-4 !text-[0.78rem]">
            <WhatsAppIcon size={14} /> Join the channel
          </a>
        ) : (
          <Link href="/chains" className="btn btn-gold !min-h-10 !px-4 !text-[0.78rem]">
            <QuillIcon size={14} /> Write a note
          </Link>
        )}
      </header>

      {/* ---------------- hero ---------------- */}
      <ArchScene className="mt-8 pb-16 sm:mt-12">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="pt-6">
            <h1 className="hero-title text-[2.7rem] text-ink sm:text-[3.4rem]">Someone left something&nbsp;here.</h1>
            <div className="mt-6 space-y-1 text-[1.05rem] leading-relaxed text-ink-muted">
              {HERO_SUB.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
            {preLaunch ? (
              <div className="mt-9">
                <p className="eyebrow">{launchCopy.eyebrow}</p>
                <LaunchCountdown target={SITE.launchAt} className="mt-4" />
                <p className="serif mt-5 text-[1.35rem] leading-tight text-ink">{launchCopy.when}</p>
                <p className="mt-7 max-w-[44ch] text-[15px] leading-relaxed text-ink-muted">{launchCopy.body}</p>
                {SOCIAL.whatsapp ? (
                  <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-6">
                    <WhatsAppIcon size={15} /> {launchCopy.cta}
                  </a>
                ) : null}
                <p className="mt-3 max-w-[40ch] text-xs leading-relaxed text-ink-faint">{launchCopy.note}</p>
              </div>
            ) : (
              <div className="mt-9">
                <Link href={enterHref} className="btn btn-gold">
                  <LockIcon /> Reveal the next note — {price}
                </Link>
              </div>
            )}
            <p className="mt-7 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              {BADGES.map((b, i) => (
                <span key={b} className="flex items-center gap-3">
                  {i > 0 ? <span aria-hidden className="text-line-gold">✦</span> : null}
                  {b}
                </span>
              ))}
            </p>
          </div>

          {featured?.sealed ? <LatestNoteCard chain={featured.chain} sealed={featured.sealed} /> : null}
        </section>
      </ArchScene>

      {!preLaunch && totalNotes > 0 ? (
        <p className="mt-2 text-center text-sm text-ink-muted num">
          {formatCount(totalNotes)} notes left by strangers — and counting.
        </p>
      ) : null}

      {/* ---------------- how · chains · why ---------------- */}
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <section id="how" className="card scroll-mt-8 p-7">
          <h2 className="section-h">How it works</h2>
          <ol className="mx-auto mt-8 flex max-w-xs flex-col">
            {HOW.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="relative flex gap-4 pb-8 last:pb-0">
                {i < HOW.length - 1 ? <span aria-hidden className="absolute bottom-0 left-[1.35rem] top-12 w-px bg-line" /> : null}
                <span className="ring h-11 w-11 shrink-0">
                  <Icon size={19} />
                </span>
                <div className="pt-0.5">
                  <h3 className="text-[0.78rem] font-semibold uppercase tracking-[0.15em] text-gold">{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="card mt-6 px-4 py-3 text-center text-sm leading-relaxed text-ink-muted">
            It’s anonymous. It’s real.
            <br />
            It’s just people being honest.
          </p>
          <a href="/manual" className="btn btn-line mt-4 w-full">
            <DownloadIcon size={15} /> Download the manual
          </a>
          <p className="mt-2 text-center text-xs text-ink-faint">
            PDF · every step, every edge case, and the rules.
          </p>
        </section>

        <section id="chains" className="card scroll-mt-8 p-7">
          <Link href="/chains" className="focus:outline-none">
            <h2 className="section-h">Explore chains</h2>
          </Link>
          {chains.length === 0 ? (
            <p className="mt-8 text-center text-sm text-ink-muted">The first chain hasn’t started yet.</p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {chains.map((c) => (
                <ChainCard key={c.id} chain={c} />
              ))}
            </ul>
          )}
          <p className="mt-7 text-center text-xs text-ink-faint">More chains coming soon…</p>
        </section>

        <section id="why" className="card scroll-mt-8 p-7">
          <h2 className="section-h">Why people love it</h2>
          <ul className="mt-8 flex flex-col gap-6">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-4">
                <span className="ring h-10 w-10 shrink-0">
                  <Icon size={17} />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-gold">{title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ---------------- contact ---------------- */}
      <ContactCard className="mt-4" />

      {/* ---------------- manifesto ---------------- */}
      <section className="card mt-4 p-9 text-center sm:p-12">
        <span aria-hidden className="qmark mx-auto">
          &ldquo;
        </span>
        <p className="serif mx-auto mt-3 max-w-md text-[1.7rem] leading-snug text-ink sm:text-[2rem]">
          No profiles. No followers. No likes.
          <span className="block text-gold">Just people leaving something behind.</span>
        </p>
      </section>

      {/* ---------------- footer ---------------- */}
      <footer className="mt-10 flex flex-col items-center gap-3 border-t border-line pt-7 text-xs text-ink-faint">
        <span className="wordmark text-sm text-ink-muted">{SITE.name}</span>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
          <Link href="/terms" className="hover:text-ink-muted">Terms</Link>
          <Link href="/privacy" className="hover:text-ink-muted">Privacy</Link>
          <Link href="/refunds" className="hover:text-ink-muted">Refunds</Link>
          <Link href="/content-policy" className="hover:text-ink-muted">Content</Link>
          <Link href="/grievance" className="hover:text-ink-muted">Contact</Link>
        </nav>
        <span>© 2026 {SITE.name}. Nothing here is written by us.</span>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ pieces */

function LatestNoteCard({ chain, sealed }: { chain: ChainSummary; sealed: SealedMeta }) {
  const ago = sealed.submittedAt ? timeAgo(sealed.submittedAt) : null;
  return (
    <Link href={`/c/${chain.slug}`} className="block focus:outline-none lg:mt-4">
      <article className="card card-glow p-6 sm:p-7">
        <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.15em]">
          <span className="text-ink-faint">Latest note · {chain.title}</span>
          <span className="num text-ink-muted">{formatPosition(sealed.position)}</span>
        </div>
        <span aria-hidden className="qmark mt-4">
          &ldquo;
        </span>
        <Redacted shape={sealed.shape} max={18} className="mt-2 text-[16px]" />
        <p className="mt-5 text-[13px] text-ink-faint">
          Anonymous · {[sealed.city, ago].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-5 border-t border-line pt-4 text-center text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-gold">
          Reveal this note — {rupees(chain.pricePaise)}
        </div>
      </article>
    </Link>
  );
}

function ChainCard({ chain }: { chain: ChainSummary }) {
  return (
    <li className="card overflow-hidden">
      <Link href={`/c/${chain.slug}`} className="flex flex-col items-center gap-2 px-3 py-5 text-center focus:outline-none">
        <span className="ring h-11 w-11">
          <ChainGlyph slug={chain.slug} size={19} />
        </span>
        <span className="serif text-[1.1rem] leading-tight text-ink">{chain.title}</span>
        <span className="num text-xs text-ink-muted">{formatCount(chain.stats.length)} notes</span>
      </Link>
    </li>
  );
}
