'use client';

import { useEffect } from 'react';
import type { EventName } from '@/lib/events';
import { beacon } from './beacon';

/** Drop into a page to record one funnel event on mount. Renders nothing. */
export function EventBeacon({ name, chainSlug, props }: { name: EventName; chainSlug?: string | null; props?: Record<string, unknown> }) {
  useEffect(() => {
    beacon(name, chainSlug, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, chainSlug]);
  return null;
}
