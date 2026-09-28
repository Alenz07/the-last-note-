'use client';

import { useEffect, useState } from 'react';
import { launch as copy } from '@/lib/copy';

/**
 * Counts down to the moment the chain opens. Mounted client-side only: the page
 * is ISR-cached, so a server-rendered clock would be stale and would mismatch on
 * hydration. Shows dashes for one frame instead, which nobody notices.
 */
export function LaunchCountdown({ target, className = '' }: { target: string; className?: string }) {
  const end = new Date(target).getTime();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(end - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);

  const s = left === null ? null : Math.max(0, Math.floor(left / 1000));
  const cells: Array<[string, string]> = [
    ['days', s === null ? '--' : String(Math.floor(s / 86400)).padStart(2, '0')],
    ['hours', s === null ? '--' : String(Math.floor((s % 86400) / 3600)).padStart(2, '0')],
    ['min', s === null ? '--' : String(Math.floor((s % 3600) / 60)).padStart(2, '0')],
    ['sec', s === null ? '--' : String(s % 60).padStart(2, '0')],
  ];

  if (s !== null && s <= 0) {
    return <p className={`serif text-[1.6rem] text-gold ${className}`}>{copy.open}</p>;
  }

  return (
    <div className={`flex items-end gap-6 sm:gap-8 ${className}`} aria-label="Time until launch">
      {cells.map(([label, value]) => (
        <div key={label} className="text-center">
          <div className="serif num text-[2.4rem] leading-none text-gold sm:text-[3rem]">{value}</div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ink-faint">{label}</div>
        </div>
      ))}
    </div>
  );
}
