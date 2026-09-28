/**
 * Brand in ONE place. Switching the product name (dernote ← dernière note)
 * is an edit to this file and nothing else.
 */
export const SITE = {
  name: 'dernote',
  tagline: 'A stranger’s words. Your moment. Their tomorrow.',
  description: 'Someone left something here. You don’t know who. ₹5 to read it — then you leave yours for the next stranger.',
  /** ISO timestamp. While it is in the future the site shows a countdown and takes no money. */
  launchAt: process.env.NEXT_PUBLIC_LAUNCH_AT || '',
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
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
} as const;

export const hasSocial = Boolean(SOCIAL.whatsapp || SOCIAL.instagram || SOCIAL.email);
