import { and, asc, desc, eq, inArray, lte, ne, sql } from 'drizzle-orm';
import type { Db } from '@/db';
import { chains, links, payments, reads, type Chain, type Link } from '@/db/schema';
import { LIMITS } from '../env';
import type { KV } from '../kv';
import { getServices, type Services } from '../services';
import { shapeOf } from './shape';
import {
  asTint,
  type ChainStats,
  type ChainSummary,
  type MyLink,
  type PublicLink,
  type RevealView,
  type RevealedLink,
  type SealedMeta,
} from './types';

/**
 * The chain engine's READ side. Pages call these; they return the plain
 * contract types from ./types and never leak rows, tokens or private media.
 * Every function takes an optional Services bag so tests can inject one.
 */

const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

/* ------------------------------------------------------------------ stats */

export async function computeStats(db: Db, chain: Chain): Promise<ChainStats> {
  const threshold = chain.tail - chain.unsealAfter;
  const [agg] = await db
    .select({
      submitted: sql<number>`count(*) filter (where ${links.status} = 'submitted' and ${links.hidden} = false)`.mapWith(Number),
      unsealed: sql<number>`count(*) filter (where ${links.status} = 'submitted' and ${links.hidden} = false and ${links.position} <= ${threshold})`.mapWith(
        Number,
      ),
    })
    .from(links)
    .where(eq(links.chainId, chain.id));
  const [last] = await db
    .select({ city: links.city, submittedAt: links.submittedAt })
    .from(links)
    .where(and(eq(links.chainId, chain.id), eq(links.status, 'submitted'), eq(links.hidden, false)))
    .orderBy(desc(links.position))
    .limit(1);
  return {
    length: chain.tail,
    submitted: agg?.submitted ?? 0,
    lastCity: last?.city ?? null,
    lastLinkAt: iso(last?.submittedAt),
    unsealedCount: agg?.unsealed ?? 0,
  };
}

/** 3-second KV cache in front of computeStats — this is what the live counters poll. */
export async function getStatsCached(db: Db, kv: KV, chain: Chain): Promise<ChainStats> {
  const key = `stats:${chain.id}`;
  const hit = await kv.get(key);
  if (hit) {
    try {
      return JSON.parse(hit) as ChainStats;
    } catch {
      /* recompute */
    }
  }
  const stats = await computeStats(db, chain);
  await kv.set(key, JSON.stringify(stats), 3);
  return stats;
}

export function toSummary(chain: Chain, stats: ChainStats): ChainSummary {
  return {
    id: chain.id,
    slug: chain.slug,
    title: chain.title,
    tagline: chain.tagline,
    prompt: chain.prompt,
    tint: asTint(chain.tint),
    pricePaise: chain.pricePaise,
    tail: chain.tail,
    status: chain.status,
    revealCount: chain.revealCount,
    revealMode: chain.revealMode,
    unsealAfter: chain.unsealAfter,
    windowMinutes: chain.windowMinutes,
    allowVoice: chain.allowVoice,
    allowImage: chain.allowImage,
    allowContact: chain.allowContact,
    stats,
  };
}

async function summarize(s: Services, chain: Chain): Promise<ChainSummary> {
  return toSummary(chain, await getStatsCached(s.db, s.kv, chain));
}

/* ------------------------------------------------------------------ chains */

export async function getLiveChains(s?: Services): Promise<ChainSummary[]> {
  s ??= await getServices();
  const rows = await s.db.select().from(chains).where(ne(chains.status, 'ended')).orderBy(asc(chains.sort), asc(chains.createdAt));
  return Promise.all(rows.map((c) => summarize(s!, c)));
}

export async function getAllChains(s?: Services): Promise<ChainSummary[]> {
  s ??= await getServices();
  const rows = await s.db.select().from(chains).orderBy(asc(chains.sort), asc(chains.createdAt));
  return Promise.all(rows.map((c) => summarize(s!, c)));
}

export async function getChainBySlug(slug: string, s?: Services): Promise<ChainSummary | null> {
  s ??= await getServices();
  const [c] = await s.db.select().from(chains).where(eq(chains.slug, slug)).limit(1);
  return c ? summarize(s, c) : null;
}

/* ------------------------------------------------------------------ teaser */

function sealedMeta(l: Link): SealedMeta {
  return {
    position: l.position,
    city: l.city,
    submittedAt: iso(l.submittedAt),
    shape: shapeOf(l.body),
    readCount: l.readCount,
    voiceSeconds: l.voiceKey ? l.voiceSeconds : null,
    hasImage: Boolean(l.imageKey),
  };
}

const visibleSubmitted = (chainId: string) => and(eq(links.chainId, chainId), eq(links.status, 'submitted'), eq(links.hidden, false));

/**
 * What a visitor sees before paying: the chain + the *shape* of the link they'd reveal.
 * With a position (share link) that link is offered if it's still visible; otherwise the latest.
 */
export async function getTeaser(
  slug: string,
  position?: number | null,
  s?: Services,
): Promise<{ chain: ChainSummary; sealed: SealedMeta | null; isReferral: boolean } | null> {
  s ??= await getServices();
  const [c] = await s.db.select().from(chains).where(eq(chains.slug, slug)).limit(1);
  if (!c) return null;
  const chain = await summarize(s, c);

  if (position && position > 0) {
    const [ref] = await s.db
      .select()
      .from(links)
      .where(and(visibleSubmitted(c.id), eq(links.position, Math.floor(position))))
      .limit(1);
    if (ref) return { chain, sealed: sealedMeta(ref), isReferral: true };
  }
  const [latest] = await s.db.select().from(links).where(visibleSubmitted(c.id)).orderBy(desc(links.position)).limit(1);
  return { chain, sealed: latest ? sealedMeta(latest) : null, isReferral: false };
}

export async function getLinkForOg(
  slug: string,
  position: number,
  s?: Services,
): Promise<(SealedMeta & { chain: ChainSummary }) | null> {
  const t = await getTeaser(slug, position, s);
  if (!t || !t.sealed || !t.isReferral) return null;
  return { ...t.sealed, chain: t.chain };
}

/* ------------------------------------------------------------------ reveal */

async function toRevealed(s: Services, l: Link): Promise<RevealedLink> {
  const [voiceUrl, imageUrl] = await Promise.all([
    l.voiceKey ? s.storage.url(l.voiceKey, LIMITS.mediaUrlTtlSeconds) : null,
    l.imageKey ? s.storage.url(l.imageKey, LIMITS.mediaUrlTtlSeconds) : null,
  ]);
  return {
    id: l.id,
    position: l.position,
    city: l.city,
    submittedAt: iso(l.submittedAt),
    body: l.body ?? '',
    voiceUrl,
    voiceSeconds: l.voiceKey ? l.voiceSeconds : null,
    imageUrl,
    readCount: l.readCount,
    contact: l.contact,
  };
}

export async function getRevealView(token: string, s?: Services): Promise<RevealView | null> {
  s ??= await getServices();
  const [me] = await s.db.select().from(links).where(eq(links.revealToken, token)).limit(1);
  if (!me) return null;
  const [c] = await s.db.select().from(chains).where(eq(chains.id, me.chainId)).limit(1);
  const chain = await summarize(s, c);

  let revealed: RevealedLink[] = [];
  if (me.revealedLinkIds.length) {
    const rows = await s.db.select().from(links).where(inArray(links.id, me.revealedLinkIds)).orderBy(asc(links.position));
    // Removed-after-the-fact links still show to the one person who paid for them; hidden ones don't.
    revealed = await Promise.all(rows.filter((r) => r.status === 'submitted' || r.status === 'removed').map((r) => toRevealed(s!, r)));
  }

  const now = s.now().getTime();
  const secondsLeft = Math.max(0, Math.floor((me.deadlineAt.getTime() - now) / 1000));
  const canWrite = me.status === 'paid' && now <= me.deadlineAt.getTime() + LIMITS.submitGraceSeconds * 1000;

  return {
    chain,
    me: {
      id: me.id,
      position: me.position,
      status: me.status,
      deadlineAt: me.deadlineAt.toISOString(),
      revealToken: me.revealToken,
      city: me.city,
    },
    revealed,
    canWrite,
    secondsLeft,
    isFirst: revealed.length === 0,
  };
}

/* ------------------------------------------------------------------ my links */

const lastReadAtSql = sql<string | null>`(select max(${reads.createdAt}) from ${reads} where ${reads.linkId} = ${links.id})`;
const lastReadCitySql = sql<string | null>`(select ${reads.readerCity} from ${reads} where ${reads.linkId} = ${links.id} order by ${reads.createdAt} desc limit 1)`;

function toMyLink(r: {
  link: Link;
  chainSlug: string;
  chainTitle: string;
  tint: string;
  lastReadAt: string | Date | null;
  lastReadCity: string | null;
}): MyLink {
  const l = r.link;
  return {
    id: l.id,
    chainSlug: r.chainSlug,
    chainTitle: r.chainTitle,
    tint: asTint(r.tint),
    position: l.position,
    status: l.status,
    body: l.status === 'submitted' || l.status === 'removed' ? l.body : null,
    city: l.city,
    revealToken: l.revealToken,
    readCount: l.readCount,
    lastReadAt: r.lastReadAt ? new Date(r.lastReadAt).toISOString() : null,
    lastReadCity: r.lastReadCity,
    createdAt: l.createdAt.toISOString(),
    submittedAt: iso(l.submittedAt),
    deadlineAt: l.deadlineAt.toISOString(),
    hasVoice: Boolean(l.voiceKey),
    hasImage: Boolean(l.imageKey),
    contact: l.contact,
  };
}

const myLinkSelect = {
  link: links,
  chainSlug: chains.slug,
  chainTitle: chains.title,
  tint: chains.tint,
  lastReadAt: lastReadAtSql,
  lastReadCity: lastReadCitySql,
};

export async function getMyLink(
  token: string,
  s?: Services,
): Promise<(MyLink & { shareUrl: string; shareText: string; revealedPosition: number | null; chain: ChainSummary }) | null> {
  s ??= await getServices();
  const [row] = await s.db
    .select(myLinkSelect)
    .from(links)
    .innerJoin(chains, eq(chains.id, links.chainId))
    .where(eq(links.revealToken, token))
    .limit(1);
  if (!row) return null;
  const my = toMyLink(row);
  const [c] = await s.db.select().from(chains).where(eq(chains.id, row.link.chainId)).limit(1);
  const chain = await summarize(s, c);

  let revealedPosition: number | null = null;
  if (row.link.revealedLinkIds.length) {
    const [r] = await s.db
      .select({ position: links.position })
      .from(links)
      .where(inArray(links.id, row.link.revealedLinkIds))
      .orderBy(desc(links.position))
      .limit(1);
    revealedPosition = r?.position ?? null;
  }
  const shareUrl = `${s.appUrl}/c/${chain.slug}/${my.position}`;
  const { share } = await import('../copy');
  const shareText = revealedPosition === null ? share.textFirst(chain.title, shareUrl) : share.text(my.position, chain.title, shareUrl);
  return { ...my, shareUrl, shareText, revealedPosition, chain };
}

export async function getMyLinks(deviceId: string, s?: Services): Promise<MyLink[]> {
  s ??= await getServices();
  const rows = await s.db
    .select(myLinkSelect)
    .from(links)
    .innerJoin(chains, eq(chains.id, links.chainId))
    .where(eq(links.deviceId, deviceId))
    .orderBy(desc(links.createdAt))
    .limit(100);
  return rows.map(toMyLink);
}

export async function findLinkByPaymentId(
  paymentRef: string,
  s?: Services,
): Promise<{ revealToken: string; chainSlug: string; position: number } | null> {
  s ??= await getServices();
  const ref = paymentRef.trim();
  if (!ref || ref.length > 80) return null;
  const [p] = await s.db
    .select({ linkId: payments.linkId })
    .from(payments)
    .where(sql`${payments.gatewayPaymentId} = ${ref} or ${payments.gatewayOrderId} = ${ref}`)
    .limit(1);
  if (!p?.linkId) return null;
  const [row] = await s.db
    .select({ revealToken: links.revealToken, position: links.position, chainSlug: chains.slug })
    .from(links)
    .innerJoin(chains, eq(chains.id, links.chainId))
    .where(eq(links.id, p.linkId))
    .limit(1);
  return row ?? null;
}

/* ------------------------------------------------------------------ unsealed */

export async function getUnsealedLinks(
  slug: string,
  page = 1,
  pageSize = 50,
  s?: Services,
): Promise<{ chain: ChainSummary; links: PublicLink[]; total: number; page: number; pageSize: number; threshold: number } | null> {
  s ??= await getServices();
  const [c] = await s.db.select().from(chains).where(eq(chains.slug, slug)).limit(1);
  if (!c) return null;
  const chain = await summarize(s, c);
  const threshold = c.tail - c.unsealAfter;
  const size = Math.min(100, Math.max(1, pageSize));
  const p = Math.max(1, page);
  if (threshold < 1) return { chain, links: [], total: 0, page: p, pageSize: size, threshold };

  const where = and(eq(links.chainId, c.id), lte(links.position, threshold), ne(links.status, 'paid'));
  const [{ total }] = await s.db.select({ total: sql<number>`count(*)`.mapWith(Number) }).from(links).where(where);
  const rows = await s.db
    .select()
    .from(links)
    .where(where)
    .orderBy(desc(links.position))
    .limit(size)
    .offset((p - 1) * size);

  const out: PublicLink[] = rows.map((l) => {
    const status: PublicLink['status'] = l.status === 'submitted' && !l.hidden ? 'submitted' : l.status === 'skipped' ? 'skipped' : 'removed';
    return {
      id: l.id,
      position: l.position,
      city: l.city,
      submittedAt: iso(l.submittedAt),
      status,
      body: status === 'submitted' ? l.body : null,
      readCount: l.readCount,
    };
  });
  return { chain, links: out, total, page: p, pageSize: size, threshold };
}
