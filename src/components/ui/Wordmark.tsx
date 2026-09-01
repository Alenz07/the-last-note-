import Link from 'next/link';
import { SITE } from '@/lib/copy';

/** "Kadi" in the display face with the seal dot. Links home unless `static`. */
export function Wordmark({ className = '', asLink = true }: { className?: string; asLink?: boolean }) {
  const mark = (
    <span className={`inline-flex items-baseline gap-1 font-display text-2xl text-ink ${className}`}>
      {SITE.name}
      <span aria-hidden className="inline-block h-1.5 w-1.5 translate-y-[-0.15em] rounded-full bg-accent" />
    </span>
  );
  return asLink ? (
    <Link href="/" aria-label={SITE.name} className="focus:outline-none">
      {mark}
    </Link>
  ) : (
    mark
  );
}
