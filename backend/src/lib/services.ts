import { getDb, type Db } from '@/db';
import { env } from './env';
import { getKV, type KV } from './kv';
import { getGateway, getMockGateway, type PaymentGateway } from './payments';
import { getSettings, type Settings } from './settings';
import { getStorage, type Storage } from './storage';

/**
 * Everything the chain engine needs, in one bag — so tests can hand it an
 * in-memory DB, a memory KV, a mock gateway and a fake clock.
 */
export type Services = {
  db: Db;
  kv: KV;
  storage: Storage;
  gateway: PaymentGateway;
  settings: Settings;
  appUrl: string;
  now: () => Date;
};

const g = globalThis as unknown as { __kadiSeeded?: Promise<void> };

/** Seed the demo chains once per process on an empty non-production DB. Retries on the next call if it failed. */
export function ensureSeeded(db: Db): Promise<void> {
  if (!env.seedOnEmpty) return Promise.resolve();
  if (!g.__kadiSeeded) {
    g.__kadiSeeded = import('./chain/seed')
      .then(({ seedIfEmpty }) => seedIfEmpty(db))
      .then((r) => {
        if (r.chains) console.log(`[kadi] seeded ${r.chains} chains, ${r.links} demo links`);
      })
      .catch((e) => {
        g.__kadiSeeded = undefined;
        console.warn('[kadi] seed failed, will retry:', (e as Error).message);
      });
  }
  return g.__kadiSeeded;
}

export async function getServices(): Promise<Services> {
  const db = await getDb();
  await ensureSeeded(db);
  // Per request, not per process: free mode is a row someone can flip while
  // the server is running, and the next payment has to respect it.
  const settings = await getSettings(db);
  return {
    db,
    kv: getKV(),
    storage: getStorage(),
    gateway: settings.freeMode ? getMockGateway() : getGateway(),
    settings,
    appUrl: env.appUrl,
    now: () => new Date(),
  };
}
