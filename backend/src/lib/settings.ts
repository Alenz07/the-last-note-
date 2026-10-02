import { getDb, type Db } from '@/db';
import { settings as table } from '@/db/schema';

/** The knobs an operator turns without a deploy. One row in `settings`. */
export type Settings = {
  freeMode: boolean;
  freeBanner: string;
  revealHoldSeconds: number;
};

/**
 * What we fall back to if the row or the database is unreachable. freeMode is
 * false on purpose: failing closed means charging, and giving the product away
 * by accident is the worse of the two failures.
 */
export const SETTINGS_DEFAULTS: Settings = {
  freeMode: false,
  freeBanner: 'Free this week — ₹5 a note after that.',
  revealHoldSeconds: 10,
};

/**
 * Read on nearly every request and changed about once a week, so it is worth
 * caching — but an operator flipping free mode wants to see it on the site in
 * seconds, not after a restart. Five seconds buys both.
 */
const TTL_MS = 5_000;
const g = globalThis as unknown as { __kadiSettings?: { at: number; value: Settings } };

function shape(row: typeof table.$inferSelect | undefined): Settings {
  if (!row) return SETTINGS_DEFAULTS;
  return {
    freeMode: row.freeMode,
    freeBanner: row.freeBanner,
    revealHoldSeconds: row.revealHoldSeconds,
  };
}

export async function getSettings(db?: Db): Promise<Settings> {
  const hit = g.__kadiSettings;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  try {
    const d = db ?? (await getDb());
    const [row] = await d.select().from(table).limit(1);
    const value = shape(row);
    g.__kadiSettings = { at: Date.now(), value };
    return value;
  } catch {
    // Never take the site down over a settings read. Stale beats broken.
    return hit?.value ?? SETTINGS_DEFAULTS;
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const db = await getDb();
  const [row] = await db
    .insert(table)
    .values({ id: true, ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({ target: table.id, set: { ...patch, updatedAt: new Date() } })
    .returning();
  const value = shape(row);
  g.__kadiSettings = { at: Date.now(), value };
  return value;
}

/** Drop the cache so the very next read hits the database. */
export function invalidateSettings(): void {
  g.__kadiSettings = undefined;
}
