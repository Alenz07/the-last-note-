import { free as copy } from '@/lib/copy';
import { FREE } from '@/lib/free';

/**
 * Says the price is nil before anyone taps a button expecting to be charged.
 * Renders nothing once PAYMENT_GATEWAY stops being mock.
 */
export function FreeBanner({ className = '' }: { className?: string }) {
  if (!FREE) return null;
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border border-line-gold/60 bg-gold/8 px-4 py-3 text-center ${className}`}
    >
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold">{copy.badge}</span>
      <span className="text-sm leading-relaxed text-ink-muted">{copy.banner}</span>
    </div>
  );
}
