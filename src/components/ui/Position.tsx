import { formatPosition } from '@/lib/format';

/** "#4,372" in tabular numerals. Server-safe; wrap in a client poller to tick. */
export function Position({ n, className = '' }: { n: number; className?: string }) {
  return <span className={`num ${className}`}>{formatPosition(n)}</span>;
}
