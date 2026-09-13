import type { Shape } from '@/lib/types';

/** A sealed note drawn as bars sized to its real word lengths — the shape, never the content. */
export function Redacted({ shape, max, className = '' }: { shape: Shape; max?: number; className?: string }) {
  const words = max ? shape.words.slice(0, max) : shape.words;
  return (
    <p aria-label={`${shape.chars} characters, sealed`} className={`redacted ${className}`}>
      {words.map((len, i) => (
        <span key={i} style={{ width: `${len * 0.56}em` }} />
      ))}
    </p>
  );
}
