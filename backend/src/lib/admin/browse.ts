import { getTableColumns, getTableName, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { schema, type Db } from '@/db';

/**
 * Read-only table browser for /admin/db. Works on PGlite and Postgres alike.
 * Table names are taken from the Drizzle schema, never from user input.
 */
const TABLE_LIST: PgTable[] = [schema.chains, schema.links, schema.payments, schema.devices, schema.reads, schema.reports, schema.events];
const TABLES: Record<string, PgTable> = Object.fromEntries(TABLE_LIST.map((t) => [getTableName(t), t]));

export function tableNames(): string[] {
  return Object.keys(TABLES).sort();
}

export function tableColumns(name: string): { name: string; type: string }[] {
  const t = TABLES[name];
  if (!t) return [];
  return Object.values(getTableColumns(t)).map((c) => ({ name: c.name, type: c.getSQLType() }));
}

function rowsOf(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  return ((res as { rows?: Record<string, unknown>[] }).rows ?? []) as Record<string, unknown>[];
}

export async function tableCounts(db: Db): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const name of tableNames()) {
    const r = rowsOf(await db.execute(sql`select count(*)::int as n from ${sql.identifier(name)}`));
    out[name] = Number(r[0]?.n ?? 0);
  }
  return out;
}

export async function tableRows(
  db: Db,
  name: string,
  page = 1,
  pageSize = 50,
): Promise<{ columns: { name: string; type: string }[]; rows: Record<string, unknown>[]; total: number; page: number; pageSize: number } | null> {
  if (!TABLES[name]) return null;
  const columns = tableColumns(name);
  const orderCol = columns.find((c) => c.name === 'created_at')?.name ?? columns.find((c) => c.name === 'position')?.name ?? columns[0]?.name;
  const size = Math.min(200, Math.max(1, pageSize));
  const p = Math.max(1, page);
  const [countRes, rowsRes] = await Promise.all([
    db.execute(sql`select count(*)::int as n from ${sql.identifier(name)}`),
    db.execute(
      sql`select * from ${sql.identifier(name)} order by ${sql.identifier(orderCol)} desc limit ${size} offset ${(p - 1) * size}`,
    ),
  ]);
  return { columns, rows: rowsOf(rowsRes), total: Number(rowsOf(countRes)[0]?.n ?? 0), page: p, pageSize: size };
}

/** Render any cell value as a short string. */
export function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  // Was toISOString(), i.e. UTC. An operator judging whether a twenty-minute
  // window had expired was reading a clock five and a half hours behind them.
  if (v instanceof Date) {
    return (
      v.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata',
      }) + ' IST'
    );
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
