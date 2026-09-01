import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type DbHandle } from '@/db';
import { chains, links, payments } from '@/db/schema';
import { MemoryKV } from '../kv';
import { MockGateway } from '../payments/mock';
import type { Services } from '../services';
import type { Storage } from '../storage';
import { capturePayment, createPaymentIntent, ensureDevice, ModerationError, reportLink, submitLink, sweep } from './core';
import { getMyLink, getRevealView, getTeaser, getUnsealedLinks } from './queries';
import { seedChains } from './seed';

class MemStorage implements Storage {
  readonly kind = 'local' as const;
  files = new Map<string, { body: Uint8Array; contentType: string }>();
  async put(key: string, body: Uint8Array, contentType: string) {
    this.files.set(key, { body, contentType });
  }
  async url(key: string) {
    return `mem://${key}`;
  }
  async remove(key: string) {
    this.files.delete(key);
  }
}

let h: DbHandle;
let clock = new Date('2026-08-23T10:00:00Z');
let s: Services;
const dev = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

async function pay(chainSlug: string, deviceN: number, refPosition?: number) {
  await ensureDevice(s.db, dev(deviceN));
  const { order } = await createPaymentIntent(s, { chainSlug, deviceId: dev(deviceN), refPosition, city: `City${deviceN}` });
  return capturePayment(s, { orderId: order.orderId, paymentId: `mock_pay_${order.orderId}`, city: `City${deviceN}` });
}

beforeAll(async () => {
  h = await createTestDb();
  s = {
    db: h.db,
    kv: new MemoryKV(),
    storage: new MemStorage(),
    gateway: new MockGateway(),
    appUrl: 'http://test',
    now: () => clock,
  };
  await seedChains(h.db);
});
afterAll(async () => h.close());

describe('allocation + idempotency', () => {
  it('hands out contiguous unique positions under concurrent captures', async () => {
    const intents = await Promise.all(
      Array.from({ length: 25 }, async (_, i) => {
        await ensureDevice(s.db, dev(100 + i));
        return createPaymentIntent(s, { chainSlug: 'confess', deviceId: dev(100 + i) });
      }),
    );
    const results = await Promise.all(
      intents.map(({ order }) => capturePayment(s, { orderId: order.orderId, paymentId: `mock_pay_${order.orderId}` })),
    );
    const positions = results.map((r) => r.link.position).sort((a, b) => a - b);
    expect(positions).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    const [c] = await s.db.select().from(chains).where(eq(chains.slug, 'confess'));
    expect(c.tail).toBe(25);
  });

  it('captures the same order twice → one link, same token (client + webhook race)', async () => {
    await ensureDevice(s.db, dev(1));
    const { order } = await createPaymentIntent(s, { chainSlug: 'advice', deviceId: dev(1) });
    const [a, b] = await Promise.all([
      capturePayment(s, { orderId: order.orderId, paymentId: 'mock_pay_x' }),
      capturePayment(s, { orderId: order.orderId, paymentId: 'mock_pay_x' }),
    ]);
    expect(a.link.id).toBe(b.link.id);
    expect(a.link.revealToken).toBe(b.link.revealToken);
    expect([a.alreadyCaptured, b.alreadyCaptured].filter(Boolean)).toHaveLength(1);
    const again = await capturePayment(s, { orderId: order.orderId, paymentId: 'mock_pay_x' });
    expect(again.alreadyCaptured).toBe(true);
    const rows = await s.db.select().from(links).where(eq(links.paymentId, a.link.paymentId));
    expect(rows).toHaveLength(1);
  });

  it('rejects unknown orders and bad mock signatures', async () => {
    await expect(capturePayment(s, { orderId: 'mock_order_nope', paymentId: 'mock_pay_1' })).rejects.toThrow(/Unknown order/);
    expect(s.gateway.verifyClientSignature({ orderId: 'mock_order_1', paymentId: 'mock_pay_1', signature: 'nope' })).toBe(false);
    expect(s.gateway.verifyClientSignature({ orderId: 'mock_order_1', paymentId: 'mock_pay_1', signature: 'mock' })).toBe(true);
  });
});

describe('reveal selection', () => {
  it('reveals the latest *submitted* link, skipping paid-but-unwritten slots; first payer reveals nothing', async () => {
    const first = await pay('story', 2);
    expect(first.revealedLinks).toHaveLength(0);
    await submitLink(s, { token: first.link.revealToken, body: 'The last bus out of Rohtak left at 11:40.' });

    const second = await pay('story', 3); // paid, never writes
    expect(second.revealedLinks.map((l) => l.position)).toEqual([1]);

    const third = await pay('story', 4);
    // story = latest mode, revealCount 3 → only #1 is submitted so far
    expect(third.revealedLinks.map((l) => l.position)).toEqual([1]);
    await submitLink(s, { token: third.link.revealToken, body: 'Inside the bag: one shoe.' });

    const fourth = await pay('story', 5);
    expect(fourth.revealedLinks.map((l) => l.position)).toEqual([1, 3]);

    const view = await getRevealView(fourth.link.revealToken, s);
    expect(view?.revealed.map((r) => r.position)).toEqual([1, 3]);
    expect(view?.canWrite).toBe(true);
    expect(view?.isFirst).toBe(false);
  });

  it('referrer mode reveals the shared link when valid, never your own, else falls back to latest', async () => {
    const a = await pay('advice', 10);
    await submitLink(s, { token: a.link.revealToken, body: 'Call your mother.' });
    const b = await pay('advice', 11);
    await submitLink(s, { token: b.link.revealToken, body: 'Rent a smaller house.' });

    const viaShare = await pay('advice', 12, a.link.position);
    expect(viaShare.revealedLinks.map((l) => l.id)).toEqual([a.link.id]);

    const ownLink = await pay('advice', 10, a.link.position); // device 10 wrote #a
    expect(ownLink.revealedLinks.map((l) => l.id)).toEqual([b.link.id]);

    const badRef = await pay('advice', 13, 99999);
    expect(badRef.revealedLinks.map((l) => l.id)).toEqual([b.link.id]);

    const my = await getMyLink(a.link.revealToken, s);
    // b read a (latest mode), then viaShare read a; ownLink and badRef were redirected to b
    expect(my?.readCount).toBe(2);
    expect(my?.lastReadCity).toBe('City12');
    expect(my?.shareUrl).toBe(`http://test/c/advice/${a.link.position}`);
    expect(my?.shareText).toContain(my!.shareUrl);

    const teaser = await getTeaser('advice', a.link.position, s);
    expect(teaser?.isReferral).toBe(true);
    expect(teaser?.sealed?.shape.words.length).toBe(3);
    expect(teaser?.sealed?.readCount).toBe(2);
  });
});

describe('submit', () => {
  it('enforces moderation, the window, and single submission', async () => {
    const r = await pay('confess', 20);
    await expect(submitLink(s, { token: r.link.revealToken, body: 'call 9876543210' })).rejects.toBeInstanceOf(ModerationError);

    const voice = { bytes: new Uint8Array([1, 2, 3]), contentType: 'audio/webm', seconds: 12 };
    const image = { bytes: new Uint8Array([4, 5, 6]), contentType: 'image/webp' };
    const ok = await submitLink(s, { token: r.link.revealToken, body: 'I still have the ticket.', voice, image });
    expect(ok.link.status).toBe('submitted');
    expect(ok.link.voiceKey).toMatch(/voice\.webm$/);
    expect(ok.link.imageKey).toMatch(/image\.webp$/);
    expect((s.storage as MemStorage).files.size).toBe(2);

    await expect(submitLink(s, { token: r.link.revealToken, body: 'again' })).rejects.toMatchObject({ code: 'already_submitted' });

    // optional contact: stored, shown to the revealer, never in the public feed
    const c1 = await pay('confess', 24);
    const withContact = await submitLink(s, { token: c1.link.revealToken, body: 'Find me if you want.', contact: '  +91 98765\t43210 ' });
    expect(withContact.link.contact).toBe('+91 98765 43210');
    const reader = await pay('confess', 25, c1.link.position);
    const view = await getRevealView(reader.link.revealToken, s);
    expect(view?.revealed[0]?.contact).toBe('+91 98765 43210');
    const mine = await getMyLink(c1.link.revealToken, s);
    expect(mine?.contact).toBe('+91 98765 43210');
    const tooShort = await pay('confess', 26);
    expect((await submitLink(s, { token: tooShort.link.revealToken, body: 'No contact really.', contact: 'ab' })).link.contact).toBeNull();

    const late = await pay('confess', 21);
    const saved = clock;
    clock = new Date(saved.getTime() + 11 * 60_000);
    await expect(submitLink(s, { token: late.link.revealToken, body: 'too late' })).rejects.toMatchObject({ code: 'expired' });
    const [row] = await s.db.select().from(links).where(eq(links.id, late.link.id));
    expect(row.status).toBe('skipped');
    clock = saved;
  });

  it('sweep skips expired paid slots and fails stale mock orders', async () => {
    const r = await pay('confess', 22);
    await ensureDevice(s.db, dev(23));
    const { order } = await createPaymentIntent(s, { chainSlug: 'confess', deviceId: dev(23) });
    const saved = clock;
    // createPaymentIntent stamps created_at with DB wall-clock; pin it to the fake clock so the 24h
    // reconciliation window is deterministic (production compares DB-time to DB-time, always consistent).
    await s.db.update(payments).set({ createdAt: saved }).where(eq(payments.gatewayOrderId, order.orderId));
    clock = new Date(saved.getTime() + 25 * 3600_000);
    const res = await sweep(s);
    expect(res.skipped).toBeGreaterThanOrEqual(1);
    const [row] = await s.db.select().from(links).where(eq(links.id, r.link.id));
    expect(row.status).toBe('skipped');
    const [p] = await s.db.select().from(payments).where(eq(payments.gatewayOrderId, order.orderId));
    expect(p.status).toBe('failed');
    clock = saved;
  });
});

describe('reports + unseal', () => {
  it('hides after 3 distinct reports and keeps hidden links out of reveal/unseal', async () => {
    const r = await pay('confess', 30);
    await submitLink(s, { token: r.link.revealToken, body: 'Something reportable but not filterable.' });
    for (const d of [31, 32]) {
      await ensureDevice(s.db, dev(d));
      expect((await reportLink(s, { linkId: r.link.id, deviceId: dev(d), reason: 'spam' })).hidden).toBe(false);
    }
    await ensureDevice(s.db, dev(33));
    expect((await reportLink(s, { linkId: r.link.id, deviceId: dev(33), reason: 'spam' })).hidden).toBe(true);
    expect((await reportLink(s, { linkId: r.link.id, deviceId: dev(33), reason: 'spam' })).duplicate).toBe(true);

    const next = await pay('confess', 34);
    expect(next.revealedLinks.map((l) => l.id)).not.toContain(r.link.id);
  });

  it('unseals text rolling after unsealAfter more links', async () => {
    await s.db.update(chains).set({ unsealAfter: 2 }).where(eq(chains.slug, 'advice'));
    const u = await getUnsealedLinks('advice', 1, 50, s);
    expect(u).not.toBeNull();
    const [c] = await s.db.select().from(chains).where(eq(chains.slug, 'advice'));
    expect(u!.threshold).toBe(c.tail - 2);
    for (const l of u!.links) expect(l.position).toBeLessThanOrEqual(c.tail - 2);
    const withBody = u!.links.filter((l) => l.status === 'submitted');
    expect(withBody.length).toBeGreaterThan(0);
    expect(withBody.every((l) => typeof l.body === 'string')).toBe(true);
    // public rows never carry contact or media
    for (const l of u!.links) expect(Object.keys(l)).not.toContain('contact');
  });
});
