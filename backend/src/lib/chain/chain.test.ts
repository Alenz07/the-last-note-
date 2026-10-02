import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type DbHandle } from '@/db';
import { chains, links, payments } from '@/db/schema';
import { MemoryKV } from '../kv';
import { MockGateway } from '../payments/mock';
import { SETTINGS_DEFAULTS } from '../settings';
import type { Services } from '../services';
import type { Storage } from '../storage';
import { capturePayment, createPaymentIntent, ensureDevice, ModerationError, reportLink, submitLink, sweep, upsertChain } from './core';
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
    settings: SETTINGS_DEFAULTS,
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
    await submitLink(s, { token: first.link.revealToken, body: 'The last bus out of Rohtak left at 11:40 and Meera was on it with a bag that was not hers, holding it the way you hold something you have not opened yet.' });

    const second = await pay('story', 3); // paid, never writes
    expect(second.revealedLinks.map((l) => l.position)).toEqual([1]);

    const third = await pay('story', 4);
    // story = latest mode, revealCount 3 → only #1 is submitted so far
    expect(third.revealedLinks.map((l) => l.position)).toEqual([1]);
    await submitLink(s, { token: third.link.revealToken, body: 'Inside the bag there was one shoe, a wedding card with her own name printed on it, and a phone that would not stop buzzing however long she ignored it.' });

    const fourth = await pay('story', 5);
    expect(fourth.revealedLinks.map((l) => l.position)).toEqual([1, 3]);

    const view = await getRevealView(fourth.link.revealToken, s);
    expect(view?.revealed.map((r) => r.position)).toEqual([1, 3]);
    expect(view?.canWrite).toBe(true);
    expect(view?.isFirst).toBe(false);
  });

  it('referrer mode reveals the shared link when valid, never your own, else falls back to latest', async () => {
    const aBody = 'Call your mother. Not out of guilt, and not because you owe her anything in particular, but because one day the phone will ring and it will not be her on the other end.';
    const a = await pay('advice', 10);
    await submitLink(s, { token: a.link.revealToken, body: aBody });
    const b = await pay('advice', 11);
    await submitLink(s, { token: b.link.revealToken, body: 'Rent a slightly smaller house than the one you can afford. Every other decision in your life gets quieter and easier once the rent stops being the thing you think about first.' });

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
    expect(teaser?.sealed?.shape.words.length).toBe(aBody.split(/\s+/).length);
    expect(teaser?.sealed?.readCount).toBe(2);
  });

  it('never sells you your own note, or one you already paid to read', async () => {
    // Two strangers write, so there is something real to buy.
    const s1 = await pay('confess', 40);
    await submitLink(s, { token: s1.link.revealToken, body: 'The first stranger wrote this one, late at night, and spent longer staring at the empty box than actually typing the words that ended up in it.' });
    const s2 = await pay('confess', 41);
    await submitLink(s, { token: s2.link.revealToken, body: 'The second stranger wrote this one on a bus, thumbs cold, certain nobody would ever pay five rupees to read it, and left it in the chain anyway.' });

    // Device 42 pays: gets the latest stranger's note, then writes its own.
    const first = await pay('confess', 42);
    expect(first.revealedLinks.map((l) => l.id)).toEqual([s2.link.id]);
    await submitLink(s, { token: first.link.revealToken, body: 'Now this one belongs to device forty-two, who read what came before and decided the only honest thing was to leave something equally unguarded behind.' });

    // Pays again. Must NOT be handed its own note back, and must NOT repeat s2.
    const second = await pay('confess', 42);
    const ids = second.revealedLinks.map((l) => l.id);
    expect(ids).not.toContain(first.link.id); // never your own
    expect(ids).not.toContain(s2.link.id); // never one you already bought
    expect(ids).toEqual([s1.link.id]); // the one stranger's note still unread

    // Everything in the chain is now either theirs or already read, so the next
    // payment is refused before any money moves.
    await ensureDevice(s.db, dev(42));
    await expect(createPaymentIntent(s, { chainSlug: 'confess', deviceId: dev(42) })).rejects.toMatchObject({
      code: 'nothing_new',
    });
  });

  it('still lets the very first writer pay into an empty chain', async () => {
    await upsertChain(s.db, {
      slug: 'empty-chain',
      title: 'Empty',
      tagline: '',
      prompt: 'Say something first.',
      tint: 'slate',
      pricePaise: 500,
      unsealAfter: 50,
      unsealMedia: false,
      revealCount: 1,
      revealMode: 'latest',
      windowMinutes: 10,
      allowVoice: true,
      allowImage: true,
      allowContact: true,
      status: 'live',
      sort: 99,
    });
    const opener = await pay('empty-chain', 50);
    expect(opener.revealedLinks).toHaveLength(0);
  });
});

describe('submit', () => {
  it('enforces moderation, the window, and single submission', async () => {
    const r = await pay('confess', 20);
    await expect(submitLink(s, { token: r.link.revealToken, body: 'Here is the only way to reach me quickly if you ever need anything at all, at any hour of the day or night, so please just call 9876543210 whenever.' })).rejects.toBeInstanceOf(ModerationError);

    const voice = { bytes: new Uint8Array([1, 2, 3]), contentType: 'audio/webm', seconds: 12 };
    const image = { bytes: new Uint8Array([4, 5, 6]), contentType: 'image/webp' };
    const ok = await submitLink(s, { token: r.link.revealToken, body: 'I still have the train ticket from the day I should have said yes to her. Seven years of moving house and it is somehow still in my wallet, right now, today.', voice, image });
    expect(ok.link.status).toBe('submitted');
    expect(ok.link.voiceKey).toMatch(/voice\.webm$/);
    expect(ok.link.imageKey).toMatch(/image\.webp$/);
    expect((s.storage as MemStorage).files.size).toBe(2);

    await expect(submitLink(s, { token: r.link.revealToken, body: 'Trying to write into this very same slot a second time, long after it was already sealed, already paid for, and already read by somebody else entirely.' })).rejects.toMatchObject({ code: 'already_submitted' });

    // optional contact: stored, shown to the revealer, never in the public feed
    const c1 = await pay('confess', 24);
    const withContact = await submitLink(s, { token: c1.link.revealToken, body: 'Find me if you actually want to. I have spent a long time being unreachable on purpose and I am no longer certain that it made anything about my life better.', contact: '  +91 98765\t43210 ' });
    expect(withContact.link.contact).toBe('+91 98765 43210');
    const reader = await pay('confess', 25, c1.link.position);
    const view = await getRevealView(reader.link.revealToken, s);
    expect(view?.revealed[0]?.contact).toBe('+91 98765 43210');
    const mine = await getMyLink(c1.link.revealToken, s);
    expect(mine?.contact).toBe('+91 98765 43210');
    const tooShort = await pay('confess', 26);
    expect((await submitLink(s, { token: tooShort.link.revealToken, body: 'I am not leaving any way to reach me this time, and that is the whole point of writing it here instead of saying it out loud to somebody who knows my name.', contact: 'ab' })).link.contact).toBeNull();

    const late = await pay('confess', 21);
    const saved = clock;
    clock = new Date(saved.getTime() + 21 * 60_000); // window is 20 minutes
    await expect(submitLink(s, { token: late.link.revealToken, body: 'Writing this one far too late, well after the writing window had already closed and the chain had quietly moved on without waiting for me at all.' })).rejects.toMatchObject({ code: 'expired' });
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
    await submitLink(s, { token: r.link.revealToken, body: 'Something reportable but not automatically filterable — the kind of note a human has to read and judge, which is exactly why the report button exists at all.' });
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
