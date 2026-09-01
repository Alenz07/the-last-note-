'use client';

import { useEffect, useState } from 'react';
import { reveal } from '@/lib/copy';
import { mmss } from '@/lib/format';

export function secondsUntil(deadlineAt: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((new Date(deadlineAt).getTime() - now) / 1000));
}

/** "9:41 left" — ticks every second. Hydration-safe: renders a placeholder until mounted. */
export function Countdown({
  deadlineAt,
  className = '',
  onExpire,
}: {
  deadlineAt: string;
  className?: string;
  onExpire?: () => void;
}) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    let fired = false;
    const tick = () => {
      const s = secondsUntil(deadlineAt);
      setLeft(s);
      if (s === 0 && !fired) {
        fired = true;
        onExpire?.();
      }
    };
    // first paint happens on the next frame so server/client markup agree
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [deadlineAt, onExpire]);

  return (
    <span className={`num ${className}`} aria-live="polite">
      {left === null ? reveal.timer('–:––') : reveal.timer(mmss(left))}
    </span>
  );
}
