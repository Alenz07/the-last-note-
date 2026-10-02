import { free as copy } from '@/lib/copy';

/**
 * Says the price is nil before anyone taps a button expecting to be charged.
 * The text comes from settings, so an operator rewrites it without a deploy;
 * an empty string renders nothing.
 */
export function FreeBanner({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border border-line-gold/60 bg-gold/8 px-4 py-3 text-center ${className}`}
    >
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold">{copy.badge}</span>
      <span className="text-sm leading-relaxed text-ink-muted">{text}</span>
    </div>
  );
}
