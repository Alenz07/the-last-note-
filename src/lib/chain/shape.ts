import type { Shape } from './types';

const MAX_WORD = 14;

/**
 * The only thing the public ever sees of a sealed link: its shape.
 * Word lengths (capped) + char count. Nothing reversible leaves the server.
 */
export function shapeOf(body: string | null | undefined): Shape {
  const text = (body ?? '').trim();
  if (!text) return { words: [], chars: 0 };
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => Math.min(MAX_WORD, Math.max(1, w.length)));
  return { words, chars: text.length };
}
