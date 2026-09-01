'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChainStats } from '@/lib/chain/types';
import { landing } from '@/lib/copy';
import { formatCount, timeAgo } from '@/lib/format';

/**
 * Polls /api/stats/[slug] every 5 s (paused when the tab is hidden) and
 * returns the latest counters. Use it to make any tile tick.
 */
export function useLiveStats(slug: string, initial: ChainStats, intervalMs = 5000): ChainStats {
  const [stats, setStats] = useState<ChainStats>(initial);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (!alive.current) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        schedule();
        return;
      }
      try {
        const res = await fetch(`/api/stats/${encodeURIComponent(slug)}`, { cache: 'no-store' });
        if (res.ok) {
          const next = (await res.json()) as ChainStats;
          setStats((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
        }
      } catch {
        /* keep last */
      }
      schedule();
    };
    const schedule = () => {
      timer = setTimeout(poll, intervalMs);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        if (timer) clearTimeout(timer);
        void poll();
      }
    };
    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive.current = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [slug, intervalMs]);

  return stats;
}

/** Default rendering: "4,372 links · last link 2 min ago · Indore". */
export function LiveStats({ slug, initial, className = '' }: { slug: string; initial: ChainStats; className?: string }) {
  const s = useLiveStats(slug, initial);
  // keyed on length so the tick animation replays exactly when the number changes
  return (
    <p key={s.length} className={`tick text-sm text-ink-muted num ${className}`}>
      {landing.links(s.length)} · {landing.lastLink(s.lastLinkAt ? timeAgo(s.lastLinkAt) : null, s.lastCity)}
      {s.unsealedCount > 0 ? ` · ${formatCount(s.unsealedCount)} unsealed` : ''}
    </p>
  );
}
