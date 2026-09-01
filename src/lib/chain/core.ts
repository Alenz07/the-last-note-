import { and, desc, eq, inArray, lt, ne, sql } from 'drizzle-orm';
import type { Db } from '@/db';
import { chains, devices, links, payments, reads, reports, type Chain, type Link, type Payment } from '@/db/schema';
import { newId, randomToken, sha256 } from '../crypto';
import { LIMITS } from '../env';
import { track } from '../events';
import { moderate } from '../moderation';
import type { CreatedOrder } from '../payments';
import type { Services } from '../services';
import type { ModerationReason } from './types';

/**
 * The chain engine's WRITE side. Every function here is the single place a
 * given state transition happens — the webhook, the client callback and the
 * reconciliation cron all call the same capturePayment().
 */

export class ChainError extends Error {
  constructor(
    public readonly code:
      | 'chain_unavailable'
      | 'banned'
      | 'order_not_found'
      | 'payment_failed'
      | 'invalid'
      | 'expired'
      | 'already_submitted'
      | 'too_large'
      | 'bad_media'
      | 'gateway',
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
  }
}

export class ModerationError extends Error {
  constructor(
    public readonly reason: ModerationReason,
    message: string,
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------------ devices */

export async function ensureDevice(db: Db, id: string, city?: string | null): Promise<{ banned: boolean }> {
  await db
    .insert(devices)
    .values({ id, city: city ?? null })
    .onConflictDoUpdate({
      target: devices.id,
      set: { lastSeen: new Date(), city: city ?? undefined },
    });
  const [d] = await db.select({ banned: devices.banned }).from(devices).where(eq(devices.id, id)).limit(1);
  return { banned: d?.banned ?? false };
}

/* ------------------------------------------------------------------ payments */

export async function getChainRow(db: Db, slug: string): Promise<Chain | null> {
  const [c] = await db.select().from(chains).where(eq(chains.slug, slug)).limit(1);
  return c ?? null;
}

export async function createPaymentIntent(
  s: Services,
  input: { chainSlug: string; deviceId: string; refPosition?: number | null; city?: string | null },
): Promise<{ payment: Payment; chain: Chain; order: CreatedOrder }> {
  const chain = await getChainRow(s.db, input.chainSlug);
  if (!chain || chain.status !== 'live') throw new ChainError('chain_unavailable', 'This chain is not taking links right now.', 409);

  const { banned } = await ensureDevice(s.db, input.deviceId, input.city);
  if (banned) throw new ChainError('banned', 'This device cannot take part.', 403);

  let order: CreatedOrder;
  try {
    order = await s.gateway.createOrder({
      amountPaise: chain.pricePaise,
      receipt: newId(),
      notes: { chain: chain.slug },
    });
  } catch {
    throw new ChainError('gateway', 'The chain is busy. Try again in a minute.', 503);
  }

  const [payment] = await s.db
    .insert(payments)
    .values({
      chainId: chain.id,
      deviceId: input.deviceId,
      gateway: s.gateway.name,
      gatewayOrderId: order.orderId,
      amountPaise: chain.pricePaise,
      status: 'created',
      refPosition: input.refPosition && input.refPosition > 0 ? Math.floor(input.refPosition) : null,
      city: input.city ?? null,
    })
    .returning();

  void track(s.db, { name: 'pay_created', chainId: chain.id, deviceId: input.deviceId, props: { ref: input.refPosition ?? null } });
  return { payment, chain, order };
}

export type CaptureResult = {
  link: Link;
  chain: Chain;
  alreadyCaptured: boolean;
  /** Oldest first. Empty if the payer is first. */
  revealedLinks: Link[];
};

/**
 * Idempotent. Safe to call from the client callback, the webhook and the cron
 * — concurrently. The payments row lock (FOR UPDATE) is the real guard; the
 * KV lock just stops duplicate work. Inside one transaction:
 *   allocate position → pick what they reveal → insert their link → record reads → mark captured.
 */
export async function capturePayment(
  s: Services,
  input: { orderId: string; paymentId: string; raw?: unknown; payerVpa?: string | null; city?: string | null },
): Promise<CaptureResult> {
  const lockKey = `lock:capture:${input.orderId}`;
  const gotLock = await s.kv.setnx(lockKey, '1', 30);
  try {
    const result = await s.db.transaction(async (tx) => {
      const [p] = await tx.select().from(payments).where(eq(payments.gatewayOrderId, input.orderId)).for('update');
      if (!p) throw new ChainError('order_not_found', 'Unknown order.', 404);

      if (p.status === 'captured' && p.linkId) {
        const [link] = await tx.select().from(links).where(eq(links.id, p.linkId)).limit(1);
        const [chain] = await tx.select().from(chains).where(eq(chains.id, p.chainId)).limit(1);
        if (p.gatewayPaymentId && p.gatewayPaymentId !== input.paymentId) {
          console.warn(`[kadi] order ${p.gatewayOrderId} captured twice with different payment ids (${p.gatewayPaymentId}, ${input.paymentId}) — refund the second from the gateway dashboard`);
        }
        return { link, chain, alreadyCaptured: true, revealedLinks: [] as Link[] };
      }
      if (p.status === 'failed' || p.status === 'refunded') {
        throw new ChainError('payment_failed', 'This payment did not go through.', 409);
      }

      // 1. Atomic position allocation — the spine of the chain.
      const [chain] = await tx
        .update(chains)
        .set({ tail: sql`${chains.tail} + 1` })
        .where(eq(chains.id, p.chainId))
        .returning();
      const position = chain.tail;

      // 2. What do they get to read?
      let revealed: Link[] = [];
      if (chain.revealMode === 'referrer' && p.refPosition) {
        const [r] = await tx
          .select()
          .from(links)
          .where(
            and(
              eq(links.chainId, chain.id),
              eq(links.position, p.refPosition),
              eq(links.status, 'submitted'),
              eq(links.hidden, false),
              ne(links.deviceId, p.deviceId),
            ),
          )
          .limit(1);
        if (r) revealed = [r];
      }
      if (revealed.length === 0) {
        revealed = await tx
          .select()
          .from(links)
          .where(
            and(eq(links.chainId, chain.id), eq(links.status, 'submitted'), eq(links.hidden, false), lt(links.position, position)),
          )
          .orderBy(desc(links.position))
          .limit(Math.max(1, chain.revealCount));
        revealed.reverse();
      }

      // 3. Their slot.
      const now = s.now();
      const city = input.city ?? p.city ?? null;
      const [link] = await tx
        .insert(links)
        .values({
          chainId: chain.id,
          position,
          status: 'paid',
          deviceId: p.deviceId,
          paymentId: p.id,
          revealToken: randomToken(32),
          revealedLinkIds: revealed.map((r) => r.id),
          city,
          deadlineAt: new Date(now.getTime() + chain.windowMinutes * 60_000),
          createdAt: now,
        })
        .returning();

      // 4. The read graph.
      if (revealed.length) {
        await tx
          .insert(reads)
          .values(revealed.map((r) => ({ linkId: r.id, readerLinkId: link.id, readerCity: city })))
          .onConflictDoNothing();
        await tx
          .update(links)
          .set({ readCount: sql`${links.readCount} + 1` })
          .where(inArray(links.id, revealed.map((r) => r.id)));
      }

      // 5. Money recorded last, inside the same transaction.
      await tx
        .update(payments)
        .set({
          status: 'captured',
          gatewayPaymentId: input.paymentId,
          linkId: link.id,
          raw: input.raw ?? p.raw ?? null,
          capturedAt: now,
          city: city ?? p.city,
        })
        .where(eq(payments.id, p.id));

      if (input.payerVpa) {
        await tx.update(devices).set({ payerHash: sha256(input.payerVpa.trim().toLowerCase()) }).where(eq(devices.id, p.deviceId));
      }

      return { link, chain, alreadyCaptured: false, revealedLinks: revealed };
    });

    if (!result.alreadyCaptured) {
      void s.kv.del(`stats:${result.chain.id}`); // counters must not lag a write
      void track(s.db, {
        name: 'pay_captured',
        chainId: result.chain.id,
        deviceId: result.link.deviceId,
        props: { position: result.link.position, revealed: result.revealedLinks.map((r) => r.position) },
      });
    }
    return result;
  } finally {
    if (gotLock) await s.kv.del(lockKey);
  }
}

/* ------------------------------------------------------------------ submit */

const AUDIO_TYPES: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/x-m4a': 'mp4',
  'audio/aac': 'aac',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};
const IMAGE_TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

function baseType(ct: string): string {
  return ct.split(';')[0].trim().toLowerCase();
}

export type MediaInput = { bytes: Uint8Array; contentType: string; seconds?: number | null };

/** Optional contact the writer volunteers: one short line, no control chars, no newlines. */
export function sanitizeContact(v: string | null | undefined): string | null {
  if (!v) return null;
  let out = '';
  for (const ch of v) {
    const code = ch.codePointAt(0) ?? 0;
    out += code < 0x20 || code === 0x7f ? ' ' : ch;
  }
  const c = out.replace(/\s+/g, ' ').trim().slice(0, LIMITS.contactMaxChars);
  return c.length >= 3 ? c : null;
}

export async function submitLink(
  s: Services,
  input: { token: string; body: string; voice?: MediaInput | null; image?: MediaInput | null; contact?: string | null },
): Promise<{ link: Link; chain: Chain }> {
  const [link] = await s.db.select().from(links).where(eq(links.revealToken, input.token)).limit(1);
  if (!link) throw new ChainError('invalid', 'This link does not exist.', 404);
  const [chain] = await s.db.select().from(chains).where(eq(chains.id, link.chainId)).limit(1);

  if (link.status === 'submitted') throw new ChainError('already_submitted', 'You already sealed this link.', 409);
  if (link.status !== 'paid') throw new ChainError('expired', 'Your slot has passed.', 410);

  const now = s.now();
  if (now.getTime() > link.deadlineAt.getTime() + LIMITS.submitGraceSeconds * 1000) {
    await s.db.update(links).set({ status: 'skipped' }).where(and(eq(links.id, link.id), eq(links.status, 'paid')));
    void track(s.db, { name: 'link_skipped', chainId: chain.id, deviceId: link.deviceId, props: { position: link.position, late: true } });
    throw new ChainError('expired', 'The window closed. Your slot passed silently.', 410);
  }

  const [dev] = await s.db.select({ banned: devices.banned }).from(devices).where(eq(devices.id, link.deviceId)).limit(1);
  if (dev?.banned) throw new ChainError('banned', 'This device cannot take part.', 403);

  const mod = moderate(input.body);
  if (!mod.ok) throw new ModerationError(mod.reason, mod.message);

  // Media: validate, then store under keys no one can guess from the outside.
  let voiceKey: string | null = null;
  let voiceType: string | null = null;
  let voiceSeconds: number | null = null;
  let imageKey: string | null = null;
  let imageType: string | null = null;

  if (input.voice && chain.allowVoice) {
    const ct = baseType(input.voice.contentType);
    const ext = AUDIO_TYPES[ct];
    if (!ext) throw new ChainError('bad_media', 'That audio format is not supported.', 415);
    if (input.voice.bytes.byteLength > LIMITS.voiceMaxBytes) throw new ChainError('too_large', 'Voice note is too large.', 413);
    voiceSeconds = Math.min(LIMITS.voiceMaxSeconds, Math.max(1, Math.round(input.voice.seconds ?? 0) || 1));
    voiceKey = `c/${chain.id}/l/${link.id}/voice.${ext}`;
    voiceType = ct;
    await s.storage.put(voiceKey, input.voice.bytes, ct);
  }
  if (input.image && chain.allowImage) {
    const ct = baseType(input.image.contentType);
    const ext = IMAGE_TYPES[ct];
    if (!ext) throw new ChainError('bad_media', 'That image format is not supported.', 415);
    if (input.image.bytes.byteLength > LIMITS.imageMaxBytes) throw new ChainError('too_large', 'Image is too large.', 413);
    imageKey = `c/${chain.id}/l/${link.id}/image.${ext}`;
    imageType = ct;
    await s.storage.put(imageKey, input.image.bytes, ct);
  }

  const contact = chain.allowContact ? sanitizeContact(input.contact) : null;

  const [updated] = await s.db
    .update(links)
    .set({ status: 'submitted', body: mod.body, voiceKey, voiceType, voiceSeconds, imageKey, imageType, contact, submittedAt: now })
    .where(and(eq(links.id, link.id), eq(links.status, 'paid')))
    .returning();
  if (!updated) throw new ChainError('already_submitted', 'You already sealed this link.', 409);

  void s.kv.del(`stats:${chain.id}`);
  void track(s.db, {
    name: 'link_submitted',
    chainId: chain.id,
    deviceId: link.deviceId,
    props: { position: link.position, voice: Boolean(voiceKey), image: Boolean(imageKey), contact: Boolean(contact), chars: mod.body.length },
  });
  return { link: updated, chain };
}

/* ------------------------------------------------------------------ reports */

export async function reportLink(
  s: Services,
  input: { linkId: string; deviceId: string; reason: string },
): Promise<{ reportCount: number; hidden: boolean; duplicate: boolean }> {
  const [exists] = await s.db.select({ id: links.id }).from(links).where(eq(links.id, input.linkId)).limit(1);
  if (!exists) throw new ChainError('invalid', 'This link does not exist.', 404);
  const inserted = await s.db
    .insert(reports)
    .values({ linkId: input.linkId, deviceId: input.deviceId, reason: input.reason.slice(0, 64) })
    .onConflictDoNothing()
    .returning({ id: reports.id });
  if (!inserted.length) {
    const [l] = await s.db.select({ reportCount: links.reportCount, hidden: links.hidden }).from(links).where(eq(links.id, input.linkId)).limit(1);
    return { reportCount: l?.reportCount ?? 0, hidden: l?.hidden ?? false, duplicate: true };
  }
  const [l] = await s.db
    .update(links)
    .set({
      reportCount: sql`${links.reportCount} + 1`,
      hidden: sql`CASE WHEN ${links.reportCount} + 1 >= ${LIMITS.reportsToHide} THEN true ELSE ${links.hidden} END`,
    })
    .where(eq(links.id, input.linkId))
    .returning({ reportCount: links.reportCount, hidden: links.hidden, chainId: links.chainId });
  void track(s.db, { name: 'report', chainId: l?.chainId, deviceId: input.deviceId, props: { linkId: input.linkId, reason: input.reason } });
  return { reportCount: l?.reportCount ?? 1, hidden: l?.hidden ?? false, duplicate: false };
}

/* ------------------------------------------------------------------ sweep / reconcile */

/** Runs every few minutes: expire unsubmitted slots, reconcile stuck payments. */
export async function sweep(s: Services): Promise<{ skipped: number; captured: number; failed: number; checked: number }> {
  const now = s.now();
  const skippedRows = await s.db
    .update(links)
    .set({ status: 'skipped' })
    .where(and(eq(links.status, 'paid'), lt(links.deadlineAt, new Date(now.getTime() - LIMITS.submitGraceSeconds * 1000))))
    .returning({ id: links.id, chainId: links.chainId, deviceId: links.deviceId, position: links.position });
  for (const r of skippedRows) {
    void track(s.db, { name: 'link_skipped', chainId: r.chainId, deviceId: r.deviceId, props: { position: r.position } });
  }

  const stale = await s.db
    .select()
    .from(payments)
    .where(and(eq(payments.status, 'created'), lt(payments.createdAt, new Date(now.getTime() - 15 * 60_000))))
    .orderBy(payments.createdAt)
    .limit(200);

  let captured = 0;
  let failed = 0;
  for (const p of stale) {
    try {
      const st = await s.gateway.fetchOrderStatus(p.gatewayOrderId);
      if (st.status === 'captured' && st.paymentId) {
        await capturePayment(s, { orderId: p.gatewayOrderId, paymentId: st.paymentId, payerVpa: st.payerVpa, raw: { reconciled: true } });
        captured++;
      } else if (st.status === 'failed' || now.getTime() - p.createdAt.getTime() > 24 * 3600_000) {
        await s.db.update(payments).set({ status: 'failed' }).where(and(eq(payments.id, p.id), eq(payments.status, 'created')));
        failed++;
      }
    } catch (e) {
      console.warn('[kadi] reconcile failed for', p.gatewayOrderId, (e as Error).message);
    }
  }
  return { skipped: skippedRows.length, captured, failed, checked: stale.length };
}

/* ------------------------------------------------------------------ admin */

export async function removeLink(db: Db, linkId: string, resolution: string): Promise<void> {
  await db.update(links).set({ status: 'removed', hidden: true, removedAt: new Date() }).where(eq(links.id, linkId));
  await db.update(reports).set({ resolvedAt: new Date(), resolution }).where(and(eq(reports.linkId, linkId), sql`${reports.resolvedAt} IS NULL`));
}

export async function restoreLink(db: Db, linkId: string, resolution: string): Promise<void> {
  await db.update(links).set({ hidden: false }).where(and(eq(links.id, linkId), eq(links.status, 'submitted')));
  await db.update(reports).set({ resolvedAt: new Date(), resolution }).where(and(eq(reports.linkId, linkId), sql`${reports.resolvedAt} IS NULL`));
}

export async function setDeviceBan(db: Db, deviceId: string, banned: boolean, reason?: string): Promise<void> {
  await db.update(devices).set({ banned, banReason: banned ? (reason ?? 'admin') : null }).where(eq(devices.id, deviceId));
}

export type ChainInput = {
  slug: string;
  title: string;
  tagline: string;
  prompt: string;
  tint: string;
  pricePaise: number;
  unsealAfter: number;
  unsealMedia: boolean;
  revealCount: number;
  revealMode: 'referrer' | 'latest';
  windowMinutes: number;
  allowVoice: boolean;
  allowImage: boolean;
  allowContact: boolean;
  status: 'live' | 'paused' | 'ended';
  sort: number;
};

export async function upsertChain(db: Db, input: ChainInput, id?: string): Promise<Chain> {
  if (id) {
    const [c] = await db.update(chains).set(input).where(eq(chains.id, id)).returning();
    return c;
  }
  const [c] = await db.insert(chains).values(input).returning();
  return c;
}
