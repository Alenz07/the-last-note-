/**
 * Public contract between the chain engine (src/lib) and the pages.
 * Everything here is plain JSON-serialisable data — safe to pass to client components.
 */
export type Tint = 'wine' | 'teal' | 'indigo' | 'amber' | 'moss' | 'slate';
export type ChainStatus = 'live' | 'paused' | 'ended';
export type LinkStatus = 'paid' | 'submitted' | 'skipped' | 'removed';
export type RevealMode = 'referrer' | 'latest';

/** The only thing the public ever sees of a sealed link: its shape. Word lengths (capped) + char count. */
export type Shape = { words: number[]; chars: number };

export type ChainStats = {
  /** tail — total slots ever allocated, i.e. the chain length people see */
  length: number;
  submitted: number;
  lastCity: string | null;
  /** ISO timestamp of the last submitted link */
  lastLinkAt: string | null;
  unsealedCount: number;
};

export type ChainSummary = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  prompt: string;
  tint: Tint;
  pricePaise: number;
  tail: number;
  status: ChainStatus;
  revealCount: number;
  revealMode: RevealMode;
  unsealAfter: number;
  windowMinutes: number;
  allowVoice: boolean;
  allowImage: boolean;
  allowContact: boolean;
  stats: ChainStats;
};

/** What a teaser shows about the link you'd reveal: number, city, when, and its *shape* — never the content. */
export type SealedMeta = {
  position: number;
  city: string | null;
  submittedAt: string | null;
  shape: Shape;
  readCount: number;
  voiceSeconds: number | null;
  hasImage: boolean;
};

export type RevealedLink = {
  id: string;
  position: number;
  city: string | null;
  submittedAt: string | null;
  body: string;
  /** Short-lived signed URL, or null. Render straight into <audio src>. */
  voiceUrl: string | null;
  voiceSeconds: number | null;
  /** Short-lived signed URL, or null. Render straight into <img src>. */
  imageUrl: string | null;
  /** How many people (including you) have read this link. */
  readCount: number;
  /** Writer-volunteered contact (phone / WhatsApp / handle), or null. Private to the revealer. */
  contact: string | null;
};

export type PublicLink = {
  id: string;
  position: number;
  city: string | null;
  submittedAt: string | null;
  status: 'submitted' | 'skipped' | 'removed';
  /** null when skipped/removed */
  body: string | null;
  readCount: number;
};

export type MyLink = {
  id: string;
  chainSlug: string;
  chainTitle: string;
  tint: Tint;
  position: number;
  status: LinkStatus;
  body: string | null;
  city: string | null;
  revealToken: string;
  readCount: number;
  lastReadAt: string | null;
  lastReadCity: string | null;
  createdAt: string;
  submittedAt: string | null;
  deadlineAt: string;
  hasVoice: boolean;
  hasImage: boolean;
  /** The contact you chose to share (your own view only). */
  contact: string | null;
};

export type RevealView = {
  chain: ChainSummary;
  me: {
    id: string;
    position: number;
    status: LinkStatus;
    deadlineAt: string;
    revealToken: string;
    city: string | null;
  };
  /** Oldest first. Empty when the payer is the first link in the chain. */
  revealed: RevealedLink[];
  canWrite: boolean;
  secondsLeft: number;
  isFirst: boolean;
};

export type PayIntentResponse = {
  orderId: string;
  gateway: 'mock' | 'razorpay' | 'cashfree';
  amountPaise: number;
  checkout: {
    /** Razorpay: publishable key for Checkout.js. */
    keyId?: string;
    /** Cashfree: the session its JS SDK opens. */
    paymentSessionId?: string;
    /** Cashfree JS SDK mode. */
    mode?: 'sandbox' | 'production';
    name: string;
    description: string;
    currency: 'INR';
    image?: string;
  };
};

export type VerifyResponse = {
  revealToken: string;
  revealUrl: string;
  alreadyCaptured: boolean;
};

export type ModerationReason = 'empty' | 'too_short' | 'too_long' | 'phone' | 'url' | 'contact' | 'profanity' | 'repeat';

export type SubmitResponse =
  | { ok: true; linkUrl: string; position: number }
  | { ok: false; error: 'moderation'; reason: ModerationReason; message: string }
  | {
      ok: false;
      error: 'expired' | 'invalid' | 'banned' | 'rate_limited' | 'too_large' | 'server' | 'already_submitted';
      message: string;
    };

export const TINTS: Tint[] = ['wine', 'teal', 'indigo', 'amber', 'moss', 'slate'];

export function asTint(v: string | null | undefined): Tint {
  return (TINTS as string[]).includes(v ?? '') ? (v as Tint) : 'slate';
}
