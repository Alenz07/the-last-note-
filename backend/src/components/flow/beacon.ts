'use client';

import type { EventName } from '@/lib/events';

/** Fire-and-forget analytics from the browser. Never awaited, never throws. */
export function beacon(name: EventName, chainSlug?: string | null, props?: Record<string, unknown>): void {
  try {
    const body = JSON.stringify({ name, chainSlug: chainSlug ?? null, props: props ?? null });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/api/events', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true });
  } catch {
    /* ignore */
  }
}
