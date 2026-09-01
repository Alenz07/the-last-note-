/**
 * Runs once when the Next.js server boots (Node runtime only):
 *  - applies pending migrations (first DB access does this)
 *  - seeds the demo chains on an empty non-production DB
 *  - starts the in-process sweep loop (expire slots, reconcile payments)
 * An external cron can also hit /api/cron/sweep; both are idempotent.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const { env, assertProdConfig } = await import('@/lib/env');
  assertProdConfig();

  try {
    // opens the DB (applies migrations) and seeds demo data if SEED_ON_EMPTY
    const { getServices } = await import('@/lib/services');
    await getServices();
    console.log(`[kadi] ready · db=${env.databaseUrl ? 'postgres' : 'pglite'} · gateway=${env.paymentGateway} · storage=${env.storageDriver}`);
  } catch (e) {
    console.error('[kadi] boot: database not ready (will retry on first request):', (e as Error).message);
  }

  const g = globalThis as unknown as { __kadiSweep?: ReturnType<typeof setInterval> };
  if (!g.__kadiSweep) {
    g.__kadiSweep = setInterval(async () => {
      try {
        const { getServices } = await import('@/lib/services');
        const { sweep } = await import('@/lib/chain/core');
        const r = await sweep(await getServices());
        if (r.skipped || r.captured || r.failed) console.log('[kadi] sweep', r);
      } catch (e) {
        console.warn('[kadi] sweep error', (e as Error).message);
      }
    }, 5 * 60_000);
    g.__kadiSweep.unref?.();
  }
}
