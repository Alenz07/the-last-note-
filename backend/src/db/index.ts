import path from 'node:path';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT, PgTransaction } from 'drizzle-orm/pg-core';
import { env } from '@/lib/env';
import * as schema from './schema';

/**
 * One Db type for both drivers so the chain engine never knows which it's on:
 *  - DATABASE_URL set  → postgres.js (production, Docker)
 *  - DATABASE_URL empty → embedded PGlite at $DATA_DIR/pg (zero-setup dev)
 * Migrations from ./drizzle are applied on first use, so a fresh clone just works.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export type Tx = PgTransaction<PgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;
export { schema };

export type DbHandle = { db: Db; close: () => Promise<void>; kind: 'postgres' | 'pglite' | 'pglite-memory' };

function migrationsFolder(): string {
  return path.join(process.cwd(), 'drizzle');
}

export async function openPostgres(url: string): Promise<DbHandle> {
  const { default: postgres } = await import('postgres');
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const { migrate } = await import('drizzle-orm/postgres-js/migrator');
  const sql = postgres(url, { max: 10, idle_timeout: 30, connect_timeout: 10, prepare: false });
  const db = drizzle(sql, { schema }) as unknown as Db;
  await migrate(db as never, { migrationsFolder: migrationsFolder() });
  return { db, close: () => sql.end({ timeout: 5 }), kind: 'postgres' };
}

export async function openPglite(dataDir?: string): Promise<DbHandle> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  if (dataDir) {
    const { mkdirSync } = await import('node:fs');
    mkdirSync(dataDir, { recursive: true }); // PGlite's own mkdir is not recursive
  }
  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  await client.waitReady;
  const db = drizzle(client, { schema }) as unknown as Db;
  await migrate(db as never, { migrationsFolder: migrationsFolder() });
  return { db, close: () => client.close(), kind: dataDir ? 'pglite' : 'pglite-memory' };
}

type Holder = { p?: Promise<DbHandle> };
const g = globalThis as unknown as { __kadiDb?: Holder };

export function getDbHandle(): Promise<DbHandle> {
  if (!g.__kadiDb) g.__kadiDb = {};
  if (!g.__kadiDb.p) {
    // `next build` prerenders ISR pages; it must never need a real database (Docker builds have none)
    // and must not touch the dev PGlite dir (single-process). An empty in-memory DB does the job;
    // pages regenerate from the real DB within `revalidate` seconds after boot.
    const open = env.databaseUrl && !env.isBuild
      ? openPostgres(env.databaseUrl)
      : env.isBuild
        ? openPglite()
        : openPglite(path.resolve(process.cwd(), env.dataDir, 'pg'));
    g.__kadiDb.p = open.catch((e) => {
      g.__kadiDb!.p = undefined; // allow retry on next request
      throw e;
    });
  }
  return g.__kadiDb.p;
}

export async function getDb(): Promise<Db> {
  return (await getDbHandle()).db;
}

/** Fresh in-memory database with migrations applied — for tests. */
export async function createTestDb(): Promise<DbHandle> {
  return openPglite();
}
