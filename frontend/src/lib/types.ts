/**
 * Mirror of the backend contract (backend/src/lib/chain/types.ts) — only the
 * pieces the frontend consumes. Additive backend changes never break this.
 */
export type Tint = 'wine' | 'teal' | 'indigo' | 'amber' | 'moss' | 'slate';

export type Shape = { words: number[]; chars: number };

export type ChainStats = {
  length: number;
  submitted: number;
  lastCity: string | null;
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
  status: 'live' | 'paused' | 'ended';
  revealCount: number;
  revealMode: 'referrer' | 'latest';
  unsealAfter: number;
  windowMinutes: number;
  allowVoice: boolean;
  allowImage: boolean;
  allowContact: boolean;
  stats: ChainStats;
};

export type SealedMeta = {
  position: number;
  city: string | null;
  submittedAt: string | null;
  shape: Shape;
  readCount: number;
  voiceSeconds: number | null;
  hasImage: boolean;
};

export type TeaserData = { chain: ChainSummary; sealed: SealedMeta | null; isReferral: boolean };

export type RevealedLink = {
  id: string;
  position: number;
  city: string | null;
  submittedAt: string | null;
  body: string;
  voiceUrl: string | null;
  voiceSeconds: number | null;
  imageUrl: string | null;
  readCount: number;
  contact: string | null;
};

export type LinkStatus = 'paid' | 'submitted' | 'skipped' | 'removed';

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
  revealed: RevealedLink[];
  canWrite: boolean;
  secondsLeft: number;
  isFirst: boolean;
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
  contact: string | null;
};

/** getMyLink() adds the share payload and the chain it belongs to. */
export type MyLinkFull = MyLink & {
  shareUrl: string;
  shareText: string;
  revealedPosition: number | null;
  chain: ChainSummary;
};

export type PublicLink = {
  id: string;
  position: number;
  city: string | null;
  submittedAt: string | null;
  status: 'submitted' | 'skipped' | 'removed';
  body: string | null;
  readCount: number;
};

export type UnsealedPage = {
  chain: ChainSummary;
  links: PublicLink[];
  total: number;
  page: number;
  pageSize: number;
  threshold: number;
};

export type PayIntentResponse = {
  orderId: string;
  gateway: 'mock' | 'razorpay' | 'cashfree';
  amountPaise: number;
  checkout: {
    /** Razorpay */
    keyId?: string;
    /** Cashfree */
    paymentSessionId?: string;
    mode?: 'sandbox' | 'production';
    name: string;
    description: string;
    currency: 'INR';
    image?: string;
  };
};

export type VerifyResponse = { revealToken: string; revealUrl: string; alreadyCaptured: boolean };

export type ModerationReason = 'empty' | 'too_short' | 'too_long' | 'phone' | 'url' | 'contact' | 'profanity' | 'repeat';

export type SubmitResponse =
  | { ok: true; linkUrl: string; position: number }
  | { ok: false; error: 'moderation'; reason: ModerationReason; message: string }
  | { ok: false; error: 'expired' | 'invalid' | 'banned' | 'rate_limited' | 'too_large' | 'server' | 'already_submitted'; message: string };
