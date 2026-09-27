/**
 * Every public-facing string, in one file, so tone is tuned in one place.
 * Rules (docs/MYSTERY.md): second person, present tense, no exclamation marks,
 * no emoji, show the shape never the content, never promise what isn't true.
 *
 * Flow components (Composer, Countdown, ShareActions, PushOptIn, PayButton…)
 * must read labels from here rather than hard-coding them.
 */
import { formatCount, formatPosition } from './format';

const join = (...parts: Array<string | null | undefined | false>) => parts.filter(Boolean).join(' · ');
const rupees = (paise: number) => `₹${Math.round(paise / 100)}`;

export const SITE = {
  name: 'dernote',
  domain: 'kadi.in',
  tagline: 'A stranger left something for you.',
  description: '₹5 to read what the last stranger left. Then you leave yours for the next one.',
  footer: 'Nothing here is written by us.',
  testMode: 'Test mode — no real money moves.',
} as const;

export const nav = {
  write: 'Write a link',
  home: 'Home',
  chains: 'Chains',
  how: 'How it works',
  myLinks: 'Your links',
  find: 'Lost a link?',
  unsealed: 'Unsealed',
  terms: 'Terms',
  privacy: 'Privacy',
  refunds: 'Refunds',
  contentPolicy: 'Content',
  grievance: 'Grievance',
} as const;

export const landing = {
  headline: SITE.tagline,
  sub: '₹5 to read it. Then you leave yours for the next stranger.',
  mediaNote: 'Voice notes and photos are never unsealed. Only the one who pays gets them.',
  chainsEyebrow: 'Live chains',
  emptyChains: "The first chain hasn't started yet.",
  /** "last link 2 min ago · Indore" */
  lastLink: (ago: string | null, city: string | null) =>
    ago ? join(`last link ${ago}`, city) : 'waiting for the first link',
  links: (n: number) => (n === 1 ? '1 link' : `${formatCount(n)} links`),
  enter: (pricePaise: number) => `Reveal the last link · ${rupees(pricePaise)}`,
  latestEyebrow: 'Latest link',
  badges: ['Anonymous', 'Real', 'Instant'],
  whyTitle: 'Why people stay',
  why: [
    { title: '100% anonymous', desc: 'No accounts, no profiles. A device and a number.' },
    { title: 'Real & unfiltered', desc: 'Written by whoever came before you. Unedited.' },
    { title: 'One link at a time', desc: `Pay ₹5, read one, leave yours. Curiosity never ends.` },
    { title: 'Kept safe', desc: 'Filters and humans keep contact details and abuse out.' },
  ],
  manifesto: {
    lines: ['No profiles.', 'No followers.', 'No likes.'],
    accent: 'Just strangers leaving something behind.',
  },
  totalLine: (n: number) => `${formatCount(n)} links left by strangers so far.`,
} as const;

export const teaser = {
  /** "#4,371 left something for you." — one hero line for both latest and referral mode. */
  hero: (position: number) => `${formatPosition(position)} left something for you.`,
  /** Story chains reveal a run: "#4,369 to #4,371 left something for you." */
  heroRange: (from: number, to: number) =>
    from === to ? teaser.hero(to) : `${formatPosition(from)} to ${formatPosition(to)} left something for you.`,
  /** Fresh chain: nothing to reveal yet. Never fake a preview. */
  heroFirst: "No one has written yet. You'd be first.",
  referral: "They sent you here. It's still sealed.",
  /** "143 characters · Indore · 4 min ago" */
  meta: (chars: number, city: string | null, ago: string | null) =>
    join(`${formatCount(chars)} characters`, city, ago),
  voice: (seconds: number) => `${seconds} second voice note`,
  photo: 'a photo',
  readCount: (n: number) =>
    n === 0 ? 'No one has read it yet.' : n === 1 ? 'Read by one person.' : `Read by ${formatCount(n)} people.`,
  /** "Text unseals for everyone at #4,421. Voice and photos never do." */
  unsealLine: (unsealsAt: number, hasMedia: boolean) =>
    `Text unseals for everyone at ${formatPosition(unsealsAt)}.` + (hasMedia ? ' Voice and photos never do.' : ''),
  alreadyUnsealed: "The text of this one is already public. The rest isn't.",
  cta: (pricePaise: number) => `Read it · ${rupees(pricePaise)}`,
  ctaMany: (n: number, pricePaise: number) => `Read all ${n} · ${rupees(pricePaise)}`,
  ctaFirst: (pricePaise: number) => `Leave the opening line · ${rupees(pricePaise)}`,
  ctaMicro: (myPosition: number) => `You'll be link ${formatPosition(myPosition)}. Then you write yours.`,
  howItWorks: [
    'Pay ₹5. Read what the last stranger left.',
    'Leave yours. Up to 1,000 characters. Twenty minutes.',
    "The next stranger reads it. You'll know when.",
  ],
  paused: 'This chain is paused. Nothing is being read or written right now.',
  ended: 'This chain has ended. What was unsealed stays unsealed.',
  payUnavailable: 'The chain is busy. Try again in a minute.',
} as const;

export const reveal = {
  youAre: (position: number) => `You are link ${formatPosition(position)}.`,
  /** "#4,371 · Indore · 4 min ago" */
  from: (position: number, city: string | null, ago: string | null) => join(formatPosition(position), city, ago),
  readBefore: (n: number) =>
    n === 0
      ? "You're the first to read this."
      : n === 1
        ? 'One person read this before you.'
        : `${formatCount(n)} people read this before you.`,
  firstWriter: "There's nothing to read. You're writing the opening line.",
  nowYours: 'Now leave yours. The next stranger is waiting.',
  timer: (mmss: string) => `${mmss} left`,
  placeholderFallback: "Say the thing you haven't said.",
  counter: (used: number, max: number) => `${used}/${max}`,
  addVoice: 'Add a voice note',
  addPhoto: 'Add a photo',
  mediaNote: 'Voice and photo stay between you and whoever reads it. Never unsealed.',
  /** Optional contact field — the one place contact details are allowed. */
  contactToggle: 'Let them reach you (optional)',
  contactLabel: 'Your number, WhatsApp or handle',
  contactPlaceholder: '98765 43210 · @yourhandle · you@mail.com',
  contactHint: 'Only the one person who reads your link will see this. Never public. Your own contact only.',
  /** Shown under a revealed link that carries a contact. */
  contactShared: 'They left a way to reach them:',
  submit: 'Seal it',
  sealing: 'Sealing…',
  sealed: 'Sealed.',
  expired: 'The window closed. Your slot passed silently. The chain kept moving.',
  alreadyWritten: "You've already left yours.",
} as const;

export const link = {
  /** "You are link #4,372 · Gurgaon" */
  youAre: (position: number, city: string | null) => join(`You are link ${formatPosition(position)}`, city),
  /** Followed by a live Countdown ("9:41 left"). */
  pending: 'Unwritten.',
  write: 'Write it',
  skipped: 'Your slot passed unwritten. The number is still yours.',
  removed: 'This link was removed under the content policy.',
  unread: "Unread. We'll tell you when a stranger opens it.",
  /** "Read by 3 people · last from Pune · 2 min ago" */
  read: (n: number, city: string | null, ago: string | null) =>
    join(n === 1 ? 'Read by one person' : `Read by ${formatCount(n)} people`, city && `last from ${city}`, ago),
  unsealsAt: (position: number) => `Your text unseals for everyone at ${formatPosition(position)}.`,
  unsealed: 'Your text is unsealed. Voice and photo never will be.',
  shareHint: "Whoever opens your link pays ₹5 to read it. You'll know when they do.",
  share: 'Share your number',
  copy: 'Copy link',
  copied: 'Copied',
  notify: "Tell me when it's read",
  notifyOn: "We'll tell you.",
  notifyDenied: 'Notifications are off for this site. Your links page still shows reads.',
  report: 'Report',
  reported: "Reported. We'll look within 72 hours.",
} as const;

export const me = {
  title: 'Your links',
  sub: "Tied to this device. Clear your cookies and they're gone — save the link pages.",
  empty: "You haven't left anything yet.",
  emptyCta: 'Find a chain',
} as const;

export const find = {
  title: 'Lost a link?',
  sub: "Paid but the page closed. Paste the payment ID and we'll find your slot.",
  placeholder: 'Payment ID',
  cta: 'Find it',
  notFound: 'Nothing under that ID. Check it once more, or write to grievance.',
} as const;

export const push = {
  readTitle: 'Someone read your link.',
  readBody: (city: string | null, total: number) =>
    join(`A stranger${city ? ` in ${city}` : ''} just read it`, total > 1 ? `${formatCount(total)} so far` : null) + '.',
} as const;

export const unseal = {
  title: 'Unsealed',
  sub: 'Text only, exactly as it was left. Voice and photos stay sealed forever.',
  /** "#4,371 · Indore · read by 3" */
  row: (position: number, city: string | null, readCount: number) =>
    join(formatPosition(position), city, readCount > 0 ? `read by ${formatCount(readCount)}` : null),
  skipped: 'passed silently',
  removed: 'removed',
  empty: (unsealAfter: number) => `Nothing unsealed yet. The first link unseals after ${formatCount(unsealAfter)} more.`,
  more: 'Older',
} as const;

export const errors = {
  notFound: "This link doesn't exist. Or it did, and it's gone.",
  chainNotFound: 'No chain by that name.',
  moderationTitle: "That can't go in the chain.",
  moderationHint: 'No phone numbers, links, handles or slurs. Nothing about named people.',
  expired: reveal.expired,
  generic: 'Something broke on our side. Your money is safe. Try again in a minute.',
  retry: 'Try again',
} as const;

/** Share text: short, personal, the link carries the rest. Used by getMyLink() and ShareActions. */
export const share = {
  text: (position: number, chainTitle: string, url: string) =>
    `I'm link ${formatPosition(position)} in ${chainTitle}, a chain of strangers. What I wrote is sealed. ₹5 opens it. ${url}`,
  textFirst: (chainTitle: string, url: string) =>
    `I just started ${chainTitle}, a chain of strangers. What I wrote is sealed. ₹5 opens it. ${url}`,
} as const;

const SMALL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
/** "five rupees" — for surfaces whose font has no ₹ glyph (the OG card). */
export const rupeesInWords = (paise: number) => {
  const n = Math.round(paise / 100);
  return `${n <= 20 ? SMALL[n] : n} rupee${n === 1 ? '' : 's'}`;
};

/** Meta tags + OG card text. */
export const og = {
  /** Page <title> for the teaser / share landing. */
  title: (chainTitle: string, position: number | null) =>
    position === null
      ? `${chainTitle} · ${SITE.name}`
      : `${formatPosition(position)} left something for you · ${chainTitle}`,
  description: (chainTitle: string, pricePaise: number) =>
    `${chainTitle}, a chain of strangers. ${rupees(pricePaise)} to read the last link, then you leave yours.`,
  /** Line under the bars on the card. Words, not ₹ — Instrument Serif has no rupee glyph. */
  foot: (pricePaise: number) => `${SITE.domain} · ${rupeesInWords(pricePaise)} to read it`,
} as const;
