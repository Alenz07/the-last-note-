import type { Shape } from '@/lib/chain/types';

/**
 * A sealed link, drawn as redaction bars sized to its word lengths.
 * Presentational only: receives the shape, never the text.
 */
export function Redacted({ shape, className = '' }: { shape: Shape; className?: string }) {
  return (
    <p aria-label={`${shape.chars} characters, sealed`} className={`redacted ${className}`}>
      {shape.words.map((len, i) => (
        <span key={i} className="redacted-word" style={{ width: `${len * 0.56}em` }} />
      ))}
    </p>
  );
}
