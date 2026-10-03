import type { Db } from '@/db';
import { events } from '@/db/schema';

export const EVENT_NAMES = [
  'landing_view',
  'chain_view',
  'pay_click',
  'pay_created',
  'pay_captured',
  'reveal_view',
  'link_submitted',
  'link_skipped',
  'share_click',
  'share_opened',
  'notified',
  'returned',
  'report',
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export function isEventName(v: unknown): v is EventName {
  return typeof v === 'string' && (EVENT_NAMES as readonly string[]).includes(v);
}

/** Append-only funnel event. Never throws — analytics must not break the product. */
export async function track(
  db: Db,
  e: { name: EventName; chainId?: string | null; deviceId?: string | null; props?: Record<string, unknown> | null },
): Promise<void> {
  try {
    await db.insert(events).values({
      name: e.name,
      chainId: e.chainId ?? null,
      deviceId: e.deviceId ?? null,
      props: e.props ?? null,
    });
  } catch {
    /* swallow */
  }
}
