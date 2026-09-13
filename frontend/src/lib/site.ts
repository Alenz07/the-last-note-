/**
 * Brand in ONE place. Switching the product name (The Last Note ↔ Kadi)
 * is an edit to this file and nothing else.
 */
export const SITE = {
  name: 'The Last Note',
  tagline: 'Someone was here before you.',
  description: 'Someone left something here. You don’t know who. ₹5 to read it — then you leave yours for the next stranger.',
} as const;

/**
 * Where people follow the chain between visits. Both are optional: leave the
 * env var empty and the link simply doesn't render, so nothing ever ships as a
 * dead button.
 *
 * WhatsApp should be a CHANNEL, not a group — a group exposes every member's
 * phone number to every other member, which contradicts the whole product.
 */
export const SOCIAL = {
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL || '',
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
} as const;

export const hasSocial = Boolean(SOCIAL.whatsapp || SOCIAL.instagram);
