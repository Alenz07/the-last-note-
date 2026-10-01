/**
 * The free window, driven by the one variable that already decides whether
 * money can move. PAYMENT_GATEWAY=mock means no gateway is live, so the site
 * runs free and says so; cashfree or razorpay means it charges.
 *
 * Read at request time, not NEXT_PUBLIC: both containers take it from the
 * shared .env, so opening payments is an env edit and a restart, never a
 * rebuild. One variable, two containers, no code change.
 */
export const FREE = (process.env.PAYMENT_GATEWAY || 'mock') === 'mock';
