import { SITE as BRAND } from './site';
import { formatCount, formatPosition, rupees } from './format';

/**
 * Every user-facing string, in the mockup's voice: second person, present
 * tense, no exclamation marks, no emoji. Show the shape, never the content.
 */
const join = (...parts: Array<string | null | undefined | false>) => parts.filter(Boolean).join(' · ');

export const SITE = {
  ...BRAND,
  footer: 'Nothing here is written by us.',
  testMode: 'Test mode — no real money moves.',
} as const;

export const landing = {
  links: (n: number) => (n === 1 ? '1 note' : `${formatCount(n)} notes`),
  lastLink: (ago: string | null, city: string | null) =>
    ago ? join(`last note ${ago}`, city) : 'waiting for the first note',
} as const;

export const social = {
  aria: 'Follow the chain',
  title: 'Know when the chain moves',
  body: 'We post when new notes land — so you know when someone has opened yours, and when there is something new worth reading.',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  privacy: 'A broadcast channel. Nobody sees your number, and nothing you wrote is ever posted.',
} as const;

export const contact = {
  title: 'Come find us',
  body: 'The chain runs on its own, but there are people behind it. Follow along between visits, or just say something.',
  whatsapp: { label: 'WhatsApp', hint: 'The channel — we post when the chain moves' },
  instagram: { label: 'Instagram', hint: 'Notes worth reading twice' },
  email: { label: 'Email', hint: 'Questions, removals, anything at all' },
  note: 'The channel is a broadcast. Nobody sees your number, and nothing you wrote is ever posted.',
} as const;

export const pay = {
  confirming: 'Confirming your payment…',
  confirmingSub: 'This takes a moment. Please don’t close this page.',
  failedTitle: 'That payment didn’t complete.',
  missingOrder: 'We couldn’t tell which payment this was.',
  back: 'Back to the chains',
} as const;

export const launch = {
  eyebrow: 'Opening soon',
  when: 'Friday 2 October · 12:01 AM',
  headline: 'The first note goes in on Friday.',
  body: 'Nobody has written yet. When the chain opens, someone will leave something — and whoever comes next pays five rupees to read it.',
  cta: 'Join the WhatsApp channel',
  note: 'We post there the moment the first note is live. Nobody sees your number.',
  fallback: 'Follow along until it opens.',
  open: 'The chain is open.',
} as const;

export const chains = {
  title: 'Choose a chain',
  sub: 'Every chain is a different kind of note. Pick one, and you read whatever the last stranger left in it.',
  reveal: (pricePaise: number) => `Reveal the latest — ${rupees(pricePaise)}`,
  empty: 'No chains are open right now.',
  waiting: 'Nobody has written in this one yet. You would be first.',
} as const;

/** "₹5 reveals the whole note — the words, the voice note and the photo." */
export function revealsLine(pricePaise: number, allowVoice: boolean, allowImage: boolean): string {
  const parts = ['the words', allowVoice && 'the voice note', allowImage && 'the photo'].filter(Boolean) as string[];
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  return `${rupees(pricePaise)} reveals the whole note — ${list}.`;
}

export const teaser = {
  hero: (position: number) => `${formatPosition(position)} left something for you.`,
  heroRange: (from: number, to: number) =>
    from === to ? teaser.hero(to) : `${formatPosition(from)} to ${formatPosition(to)} left something for you.`,
  heroFirst: 'No one has written yet. You would be first.',
  referral: 'They sent you here. It is still sealed.',
  meta: (chars: number, city: string | null, ago: string | null) => join(`${formatCount(chars)} characters`, city, ago),
  voice: (seconds: number) => `${seconds} second voice note`,
  photo: 'a photo',
  readCount: (n: number) =>
    n === 0 ? 'No one has read it yet.' : n === 1 ? 'Read by one person.' : `Read by ${formatCount(n)} people.`,
  unsealLine: (unsealsAt: number, hasMedia: boolean) =>
    `Text unseals for everyone at ${formatPosition(unsealsAt)}.` + (hasMedia ? ' Voice and photos never do.' : ''),
  alreadyUnsealed: 'The text of this one is already public. The rest is not.',
  cta: (pricePaise: number) => `Reveal this note — ${rupees(pricePaise)}`,
  ctaMany: (n: number, pricePaise: number) => `Reveal all ${n} — ${rupees(pricePaise)}`,
  ctaFirst: (pricePaise: number) => `Leave the opening note — ${rupees(pricePaise)}`,
  ctaMicro: (myPosition: number) => `You will be note ${formatPosition(myPosition)}. Then you write yours.`,
  paused: 'This chain is paused. Nothing is being read or written right now.',
  ended: 'This chain has ended. What was unsealed stays unsealed.',
  payUnavailable: 'The chain is busy. Try again in a minute.',
} as const;

export const reveal = {
  youAre: (position: number) => `You are note ${formatPosition(position)}.`,
  from: (position: number, city: string | null, ago: string | null) => join(formatPosition(position), city, ago),
  readBefore: (n: number) =>
    n === 0
      ? 'You are the first to read this.'
      : n === 1
        ? 'One person read this before you.'
        : `${formatCount(n)} people read this before you.`,
  firstWriter: 'There is nothing to read. You are writing the opening note.',
  nowYours: 'Leave something behind.',
  subtitle: 'It stays anonymous.',
  timer: (mmss: string) => `${mmss} left`,
  placeholderFallback: 'Write your note anonymously…',
  counter: (used: number, max: number) => `${used} / ${max}`,
  /** Shown until the floor is met, so a disabled button is never a mystery. */
  needMore: (missing: number) => `${missing} more character${missing === 1 ? '' : 's'} to go`,
  readAnother: {
    title: 'Read the one before this',
    body: 'Every payment walks you one step further back down the chain — and you can keep going.',
    cta: (price: string) => `Read the next one back — ${price}`,
  },
  addVoice: 'Add a voice note',
  addPhoto: 'Add a photo',
  mediaNote: 'Voice and photo stay between you and whoever reads it. Never unsealed.',
  contactToggle: 'Let them reach me',
  contactLabel: 'Your contact',
  contactPlaceholder: 'WhatsApp number, Instagram, email…',
  contactHint:
    'Some of the best things here start with a reply — a thank you for advice that helped, a story someone wanted to finish. Only the one stranger who opens your note ever sees this, and it is never made public. Leave it blank if you would rather stay unreachable.',
  submit: 'Submit & continue',
  sealing: 'Sealing…',
  sealed: 'Sealed.',
  expired: 'The window closed. Your slot passed silently. The chain kept moving.',
  alreadyWritten: 'You have already left yours.',
  lockNote: 'Your note will be added to the chain.',
} as const;

export const link = {
  youAre: (position: number, city: string | null) => join(`You are note ${formatPosition(position)}`, city),
  pending: 'Unwritten.',
  write: 'Write it',
  skipped: 'Your slot passed unwritten. The number is still yours.',
  removed: 'This note was removed under the content policy.',
  unread: 'Unread. We will tell you when a stranger opens it.',
  read: (n: number, city: string | null, ago: string | null) =>
    join(n === 1 ? 'Read by one person' : `Read by ${formatCount(n)} people`, city && `last from ${city}`, ago),
  unsealsAt: (position: number) => `Your text unseals for everyone at ${formatPosition(position)}.`,
  unsealed: 'Your text is unsealed. Voice and photo never will be.',
  shareHint: 'Whoever opens your link pays to read it. You will know when they do.',
  share: 'Share your note',
  copy: 'Copy link',
  copied: 'Copied',
  notify: 'Tell me when it is read',
  notifyOn: 'We will tell you.',
  notifyDenied: 'Notifications are off for this site. Your notes page still shows reads.',
  report: 'Report',
  reported: 'Reported. We will look within 72 hours.',
} as const;

export const me = {
  title: 'Your notes',
  sub: 'Tied to this device. Clear your cookies and they are gone — save your note links.',
  empty: 'You have not left anything yet.',
  emptyCta: 'Find a chain',
} as const;

export const find = {
  title: 'Lost a note?',
  sub: 'Paid but the page closed. Paste the payment ID and we will find your slot.',
  placeholder: 'Payment ID',
  cta: 'Find it',
  notFound: 'Nothing under that ID. Check it once more, or write to grievance.',
} as const;

export const unseal = {
  title: 'Unsealed',
  sub: 'Text only, exactly as it was left. Voice and photos stay sealed forever.',
  row: (position: number, city: string | null, readCount: number) =>
    join(formatPosition(position), city, readCount > 0 ? `read by ${formatCount(readCount)}` : null),
  skipped: 'passed silently',
  removed: 'removed',
  empty: (unsealAfter: number) => `Nothing unsealed yet. The first note unseals after ${formatCount(unsealAfter)} more.`,
  older: 'Older',
  newer: 'Newer',
} as const;

export const errors = {
  notFound: 'This page does not exist. Or it did, and it is gone.',
  chainNotFound: 'No chain by that name.',
  moderationHint: 'No phone numbers, links, handles or slurs. Nothing about named people.',
  expired: reveal.expired,
  generic: 'Something broke on our side. Your money is safe. Try again in a minute.',
  retry: 'Try again',
} as const;

export const share = {
  text: (position: number, chainTitle: string, url: string) =>
    `I am note ${formatPosition(position)} in ${chainTitle}, a chain of strangers. What I wrote is sealed. ₹5 opens it. ${url}`,
} as const;
