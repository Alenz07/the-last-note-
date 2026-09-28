/**
 * Central, typed view of process.env with local-first defaults.
 * Everything works with zero configuration in development; production
 * requires APP_SECRET, ADMIN_PASSWORD and a real DATABASE_URL.
 */
const isProd = process.env.NODE_ENV === 'production';
const siteUrl = (process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').replace(/\/$/, '');

function bool(v: string | undefined, dflt: boolean): boolean {
  if (v === undefined || v === '') return dflt;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

export const env = {
  isProd,
  isBuild: process.env.NEXT_PHASE === 'phase-production-build',
  appName: process.env.APP_NAME || 'dernote',
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
  /**
   * Where the *user-facing* site lives. Same origin as the API in production
   * (Caddy fronts both), but a different port in dev where the frontend runs
   * separately. Payment return URLs must point here, not at the API.
   */
  siteUrl,
  /**
   * Browsers silently DISCARD cookies marked Secure when they arrive over
   * plain HTTP - which logs everyone straight back out. Follow the scheme we
   * are actually served on, not NODE_ENV: a production build on an HTTP-only
   * host still needs usable cookies, and this flips itself the day TLS lands.
   */
  cookieSecure: siteUrl.startsWith('https://'),
  appSecret: process.env.APP_SECRET || 'dev-only-change-me-dev-only-change-me',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  cronSecret: process.env.CRON_SECRET || 'dev-cron',

  databaseUrl: process.env.DATABASE_URL || '',
  dataDir: process.env.DATA_DIR || '.data',
  seedOnEmpty: bool(process.env.SEED_ON_EMPTY, !isProd),

  redisUrl: process.env.REDIS_URL || '',

  storageDriver: (process.env.STORAGE_DRIVER || (process.env.S3_ACCESS_KEY_ID ? 's3' : 'local')) as 'local' | 's3',
  s3: {
    endpoint: process.env.S3_ENDPOINT || '',
    region: process.env.S3_REGION || 'auto',
    bucket: process.env.S3_BUCKET || 'kadi-media',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    forcePathStyle: bool(process.env.S3_FORCE_PATH_STYLE, false),
  },

  paymentGateway: (process.env.PAYMENT_GATEWAY || 'mock') as 'mock' | 'razorpay' | 'cashfree',
  /** True whenever no real money can move — drives the "Test mode" badge. */
  paymentTestMode: (() => {
    const g = process.env.PAYMENT_GATEWAY || 'mock';
    if (g === 'razorpay') return (process.env.RAZORPAY_KEY_ID || '').startsWith('rzp_test_');
    if (g === 'cashfree') return (process.env.CASHFREE_ENV || 'sandbox') !== 'production';
    return true; // mock
  })(),
  cashfree: {
    appId: process.env.CASHFREE_APP_ID || '',
    secretKey: process.env.CASHFREE_SECRET_KEY || '',
    /** 'sandbox' = test money, 'production' = real money. */
    mode: ((process.env.CASHFREE_ENV || 'sandbox') === 'production' ? 'production' : 'sandbox') as
      | 'sandbox'
      | 'production',
    /**
     * Cashfree requires a 10-digit customer phone on every order, but Kadi has
     * no accounts and asks for nothing. A single placeholder stands in for all
     * payers; the payer's real UPI app still collects whatever it needs.
     */
    placeholderPhone: process.env.CASHFREE_PLACEHOLDER_PHONE || '9999999999',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:hello@example.com',
  },
} as const;

/** Hard limits that are product decisions, not config. */
export const LIMITS = {
  /** ~170 words. Long enough for a real paragraph, and enough text per page for search to index. */
  bodyMaxChars: 1000,
  /** ~20 words. Blocks "lol" and "nice" without killing the sharp one-liner. */
  bodyMinChars: 120,
  contactMaxChars: 80,
  voiceMaxSeconds: 30,
  voiceMaxBytes: 1_000_000,
  imageMaxBytes: 1_500_000,
  imageMaxEdgePx: 1080,
  submitGraceSeconds: 20,
  reportsToHide: 3,
  deviceCookie: 'kadi_d',
  adminCookie: 'kadi_admin',
  deviceCookieMaxAge: 60 * 60 * 24 * 365,
  mediaUrlTtlSeconds: 60 * 15,
} as const;

/** Fail loudly on obviously unsafe production config. */
export function assertProdConfig(): void {
  if (!env.isProd || env.isBuild) return;
  const problems: string[] = [];
  if (env.appSecret.startsWith('dev-only')) problems.push('APP_SECRET is the dev default');
  if (env.adminPassword === 'admin') problems.push('ADMIN_PASSWORD is the dev default');
  if (!env.databaseUrl) problems.push('DATABASE_URL is empty (PGlite is not for production)');
  if (problems.length) {
    console.error('[kadi] UNSAFE PRODUCTION CONFIG:\n - ' + problems.join('\n - '));
  }
}
