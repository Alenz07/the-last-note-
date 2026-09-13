/**
 * Limits mirrored from the backend (backend/src/lib/env.ts). The backend is
 * the enforcer; these exist so the UI can show counters and stop obvious
 * out-of-range submissions before a round trip.
 */
export const LIMITS = {
  /** ~170 words. Long enough for a real paragraph, and enough text per page for search to index. */
  bodyMaxChars: 1000,
  /** ~20 words. Blocks "lol" and "nice" without killing the sharp one-liner. */
  bodyMinChars: 120,
  contactMaxChars: 80,
  voiceMaxSeconds: 30,
  voiceMaxBytes: 1_000_000,
  imageMaxBytes: 1_500_000,
  imageMaxEdgePx: 1080,
} as const;
