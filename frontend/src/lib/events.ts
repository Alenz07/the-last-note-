/** Funnel event names accepted by the backend's /api/events. */
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
