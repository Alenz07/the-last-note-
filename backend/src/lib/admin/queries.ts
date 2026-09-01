import { and, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import type { Db } from '@/db';
import { chains, devices, events, links, payments, reports, type Chain, type Link, type Payment } from '@/db/schema';

/** Admin-only reads. Never imported by public pages. */

export const FUNNEL_STEPS = ['chain_view', 'pay_click', 'pay_created', 'pay_captured', 'reveal_view', 'link_submitted', 'share_click', 'notified'] as const;

export async function getFunnel(db: Db, chainId: string, days = 7): Promise<Record<string, number>> {
  const since = new Date(Date.now() - days * 86400_000);
  const rows = await db
    .select({ name: events.name, n: sql<number>`count(*)`.mapWith(Number) })
    .from(events)
    .where(and(eq(events.chainId, chainId), gt(events.createdAt, since)))
    .groupBy(events.name);
  const out: Record<string, number> = {};
  for (const s of FUNNEL_STEPS) out[s] = 0;
  for (const r of rows) out[r.name] = r.n;
  return out;
}

export type OpenReportItem = { id: string; reason: string; createdAt: Date; deviceId: string };
export type OpenReport = {
  link: Link;
  chain: Pick<Chain, 'slug' | 'title'>;
  reports: OpenReportItem[];
  deviceBanned: boolean;
};

export async function getOpenReports(db: Db, limit = 100): Promise<OpenReport[]> {
  const open = await db
    .select({ linkId: reports.linkId, n: sql<number>`count(*)`.mapWith(Number) })
    .from(reports)
    .where(isNull(reports.resolvedAt))
    .groupBy(reports.linkId)
    .orderBy(desc(sql`max(${reports.createdAt})`))
    .limit(limit);
  if (!open.length) return [];
  const ids = open.map((o) => o.linkId);
  const rows = await db
    .select({ link: links, slug: chains.slug, title: chains.title, banned: devices.banned })
    .from(links)
    .innerJoin(chains, eq(chains.id, links.chainId))
    .innerJoin(devices, eq(devices.id, links.deviceId))
    .where(inArray(links.id, ids));
  const reps = await db
    .select({ id: reports.id, linkId: reports.linkId, reason: reports.reason, createdAt: reports.createdAt, deviceId: reports.deviceId })
    .from(reports)
    .where(and(inArray(reports.linkId, ids), isNull(reports.resolvedAt)));

  const byId = new Map(rows.map((r) => [r.link.id, r]));
  const out: OpenReport[] = [];
  for (const id of ids) {
    const r = byId.get(id);
    if (!r) continue;
    out.push({
      link: r.link,
      chain: { slug: r.slug, title: r.title },
      deviceBanned: r.banned,
      reports: reps.filter((x) => x.linkId === id).map(({ id, reason, createdAt, deviceId }) => ({ id, reason, createdAt, deviceId })),
    });
  }
  return out;
}

export async function getLinkDetail(db: Db, id: string) {
  const [row] = await db
    .select({ link: links, chain: chains, device: devices, payment: payments })
    .from(links)
    .innerJoin(chains, eq(chains.id, links.chainId))
    .innerJoin(devices, eq(devices.id, links.deviceId))
    .innerJoin(payments, eq(payments.id, links.paymentId))
    .where(eq(links.id, id))
    .limit(1);
  if (!row) return null;
  const reps = await db.select().from(reports).where(eq(reports.linkId, id)).orderBy(desc(reports.createdAt));
  const otherLinks = await db
    .select({ id: links.id, position: links.position, status: links.status, chainSlug: chains.slug, createdAt: links.createdAt })
    .from(links)
    .innerJoin(chains, eq(chains.id, links.chainId))
    .where(eq(links.deviceId, row.device.id))
    .orderBy(desc(links.createdAt))
    .limit(20);
  return { ...row, reports: reps, otherLinks };
}

export async function findLinkByChainPosition(db: Db, slug: string, position: number): Promise<string | null> {
  const [r] = await db
    .select({ id: links.id })
    .from(links)
    .innerJoin(chains, eq(chains.id, links.chainId))
    .where(and(eq(chains.slug, slug), eq(links.position, position)))
    .limit(1);
  return r?.id ?? null;
}

export async function getRecentPayments(db: Db, limit = 100): Promise<(Payment & { chainSlug: string; position: number | null })[]> {
  const rows = await db
    .select({ p: payments, chainSlug: chains.slug, position: links.position })
    .from(payments)
    .innerJoin(chains, eq(chains.id, payments.chainId))
    .leftJoin(links, eq(links.id, payments.linkId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.p, chainSlug: r.chainSlug, position: r.position }));
}

export async function getPaymentTotals(db: Db, days = 30) {
  const since = new Date(Date.now() - days * 86400_000);
  const [r] = await db
    .select({
      captured: sql<number>`count(*) filter (where ${payments.status} = 'captured')`.mapWith(Number),
      created: sql<number>`count(*) filter (where ${payments.status} = 'created')`.mapWith(Number),
      failed: sql<number>`count(*) filter (where ${payments.status} = 'failed')`.mapWith(Number),
      paise: sql<number>`coalesce(sum(${payments.amountPaise}) filter (where ${payments.status} = 'captured'), 0)`.mapWith(Number),
    })
    .from(payments)
    .where(gt(payments.createdAt, since));
  return r;
}
