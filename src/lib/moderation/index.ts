import { LIMITS } from '../env';
import type { ModerationReason } from '../chain/types';
import { BLOCKED_PHRASES, BLOCKED_WORDS } from './words';

export type ModerationResult =
  | { ok: true; body: string }
  | { ok: false; reason: ModerationReason; message: string };

export const MODERATION_MESSAGES: Record<ModerationReason, string> = {
  empty: 'Write something first.',
  too_long: `Keep it under ${LIMITS.bodyMaxChars} characters.`,
  phone: 'No phone numbers. This stays between strangers.',
  url: 'No links. Words only.',
  contact: 'No handles, emails or UPI IDs. Nobody here can reach you, and that is the point.',
  profanity: 'That word is not allowed. Say it another way.',
  repeat: 'That looks like filler. Say one real thing.',
};

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };

/** Lowercase, leetspeak → letters, collapse 3+ repeats to 1, strip punctuation to spaces. */
export function normalizeForMatch(text: string): string {
  const leet = text.toLowerCase().replace(/[013457@$]/g, (c) => LEET[c] ?? c);
  return leet
    .replace(/(.)\1{2,}/g, '$1')
    .replace(/[^a-zऀ-ॿ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PHONE_RE = /(?:\+?91[\s-]?)?[6-9]\d{9}/;
const LONG_DIGITS_RE = /\d{8,}/;
const URL_RE =
  /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|in|net|org|co|io|me|app|xyz|link|ly|gg|site|online|store|shop|info|biz|tv|to|us|uk|ai|dev|page|wa\.me)\b/i;
const CONTACT_RE = /[a-z0-9._%+-]+@[a-z0-9.-]{2,}/i;
const HANDLE_RE = /(?:^|\s)@[a-z0-9_.]{3,}/i;
// platform keyword as a whole word, then a handle: "insta rahul_123", "ig: rahul", "snap- rahul.k"
const INSTA_RE = /\b(?:insta(?:gram)?|ig|snap(?:chat)?|telegram|tg|whatsapp|wa)\b\s*[:\-]?\s*@?[a-z0-9_.]{3,}/i;

let extra: Set<string> | null = null;
function blockedWords(): Set<string> {
  if (!extra) {
    extra = new Set(BLOCKED_WORDS);
    for (const w of (process.env.EXTRA_BLOCKED_WORDS ?? '').split(',')) {
      const n = normalizeForMatch(w);
      if (n) extra.add(n);
    }
  }
  return extra;
}

export function moderate(input: string, opts: { maxChars?: number } = {}): ModerationResult {
  const maxChars = opts.maxChars ?? LIMITS.bodyMaxChars;
  const body = input.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!body) return fail('empty');
  if ([...body].length > maxChars) return fail('too_long');

  const digitsJoined = body.replace(/(?<=\d)[\s\-.()](?=\d)/g, '');
  if (PHONE_RE.test(digitsJoined) || LONG_DIGITS_RE.test(digitsJoined)) return fail('phone');
  // emails / UPI ids / handles before URLs so "x@y.com" reads as contact, not link
  if (CONTACT_RE.test(body) || HANDLE_RE.test(body) || INSTA_RE.test(body)) return fail('contact');
  if (URL_RE.test(body)) return fail('url');

  const norm = normalizeForMatch(body);
  const words = norm.split(' ').filter(Boolean);
  const blocked = blockedWords();
  for (const w of words) if (blocked.has(w)) return fail('profanity');
  for (const p of BLOCKED_PHRASES) if (norm.includes(p)) return fail('profanity');

  const unique = new Set(words);
  if (words.length >= 6 && unique.size <= 2) return fail('repeat');
  if (/(.)\1{24,}/.test(body)) return fail('repeat');

  return { ok: true, body };
}

function fail(reason: ModerationReason): ModerationResult {
  return { ok: false, reason, message: MODERATION_MESSAGES[reason] };
}

export const REPORT_REASONS = ['contact-info', 'harassment', 'sexual', 'names-a-person', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
