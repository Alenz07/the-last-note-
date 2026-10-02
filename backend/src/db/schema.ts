import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const chainStatusEnum = pgEnum('chain_status', ['live', 'paused', 'ended']);
export const linkStatusEnum = pgEnum('link_status', ['paid', 'submitted', 'skipped', 'removed']);
export const paymentStatusEnum = pgEnum('payment_status', ['created', 'captured', 'failed', 'refunded']);
export const revealModeEnum = pgEnum('reveal_mode', ['referrer', 'latest']);

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One row, forever — the CHECK on the primary key makes a second one
 * impossible. Everything here is something an operator changes at runtime,
 * so it lives in the database instead of the environment: changing it is a
 * save, not a rebuild and a redeploy.
 */
export const settings = pgTable('settings', {
  id: boolean('id').primaryKey().default(true).notNull(),
  freeMode: boolean('free_mode').notNull().default(false),
  freeBanner: text('free_banner').notNull().default('Free this week — ₹5 a note after that.'),
  /** How long the reveal sheet holds before the note opens. */
  revealHoldSeconds: integer('reveal_hold_seconds').notNull().default(10),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

/** A themed chain. Every theme is a row, not code. */
export const chains = pgTable('chains', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  tagline: text('tagline').notNull().default(''),
  prompt: text('prompt').notNull(),
  tint: text('tint').notNull().default('wine'),
  pricePaise: integer('price_paise').notNull().default(500),
  /** Highest allocated position. Incremented atomically on payment capture. */
  tail: integer('tail').notNull().default(0),
  /** A link's text becomes public once tail >= position + unsealAfter. */
  unsealAfter: integer('unseal_after').notNull().default(50),
  unsealMedia: boolean('unseal_media').notNull().default(false),
  /** How many previous links a payer reveals (story chains want 3). */
  revealCount: integer('reveal_count').notNull().default(1),
  revealMode: revealModeEnum('reveal_mode').notNull().default('referrer'),
  windowMinutes: integer('window_minutes').notNull().default(10),
  allowVoice: boolean('allow_voice').notNull().default(true),
  allowImage: boolean('allow_image').notNull().default(true),
  /** Writers may attach an optional contact (phone/WhatsApp/handle) shown only to whoever reveals their link. */
  allowContact: boolean('allow_contact').notNull().default(true),
  status: chainStatusEnum('status').notNull().default('live'),
  sort: integer('sort').notNull().default(0),
  createdAt: ts('created_at').notNull().defaultNow(),
});

/** Anonymous device (1-year cookie). No accounts. */
export const devices = pgTable(
  'devices',
  {
    id: uuid('id').primaryKey(),
    firstSeen: ts('first_seen').notNull().defaultNow(),
    lastSeen: ts('last_seen').notNull().defaultNow(),
    banned: boolean('banned').notNull().default(false),
    banReason: text('ban_reason'),
    /** sha256(UPI VPA) once known from the gateway — the identity that cost money. Never the VPA itself. */
    payerHash: text('payer_hash'),
    pushSubscription: jsonb('push_subscription'),
    city: text('city'),
  },
  (t) => [index('devices_payer_hash_idx').on(t.payerHash)],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chainId: uuid('chain_id')
      .notNull()
      .references(() => chains.id),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    gateway: text('gateway').notNull(),
    gatewayOrderId: text('gateway_order_id').notNull().unique(),
    gatewayPaymentId: text('gateway_payment_id').unique(),
    amountPaise: integer('amount_paise').notNull(),
    status: paymentStatusEnum('status').notNull().default('created'),
    /** Share-link referral: the position the payer was invited to read. */
    refPosition: integer('ref_position'),
    city: text('city'),
    /** Set on capture. Plain uuid (no FK) to avoid a cycle with links.payment_id. */
    linkId: uuid('link_id'),
    raw: jsonb('raw'),
    createdAt: ts('created_at').notNull().defaultNow(),
    capturedAt: ts('captured_at'),
  },
  (t) => [index('payments_status_created_idx').on(t.status, t.createdAt)],
);

export const links = pgTable(
  'links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chainId: uuid('chain_id')
      .notNull()
      .references(() => chains.id),
    /** The spine. Allocated atomically; unique per chain; never reused. */
    position: integer('position').notNull(),
    status: linkStatusEnum('status').notNull().default('paid'),
    /** Auto-hidden after N reports, pending admin review. Hidden links are never revealed or unsealed. */
    hidden: boolean('hidden').notNull().default(false),
    body: text('body'),
    voiceKey: text('voice_key'),
    voiceType: text('voice_type'),
    voiceSeconds: integer('voice_seconds'),
    imageKey: text('image_key'),
    imageType: text('image_type'),
    /** Optional, writer-volunteered way to reach them. Private like media: only the revealer sees it, never unsealed. */
    contact: text('contact'),
    city: text('city'),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id),
    /** Bearer secret: whoever holds it owns this link's reveal + status page. */
    revealToken: text('reveal_token').notNull().unique(),
    /** The edge(s): which link(s) this payer actually read. The read graph is a tree, not a list. */
    revealedLinkIds: uuid('revealed_link_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    readCount: integer('read_count').notNull().default(0),
    reportCount: integer('report_count').notNull().default(0),
    deadlineAt: ts('deadline_at').notNull(),
    submittedAt: ts('submitted_at'),
    removedAt: ts('removed_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('links_chain_position_uq').on(t.chainId, t.position),
    index('links_chain_status_pos_idx').on(t.chainId, t.status, t.position),
    index('links_device_idx').on(t.deviceId),
    index('links_status_deadline_idx').on(t.status, t.deadlineAt),
  ],
);

/** Who read whom. Drives the "N people read your link" loop. */
export const reads = pgTable(
  'reads',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    linkId: uuid('link_id')
      .notNull()
      .references(() => links.id),
    readerLinkId: uuid('reader_link_id')
      .notNull()
      .references(() => links.id),
    readerCity: text('reader_city'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('reads_link_idx').on(t.linkId), uniqueIndex('reads_pair_uq').on(t.linkId, t.readerLinkId)],
);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    linkId: uuid('link_id')
      .notNull()
      .references(() => links.id),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    reason: text('reason').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
    resolvedAt: ts('resolved_at'),
    resolution: text('resolution'),
  },
  (t) => [index('reports_link_idx').on(t.linkId), uniqueIndex('reports_link_device_uq').on(t.linkId, t.deviceId)],
);

/** Product analytics funnel. Cheap append-only table; PostHog mirrors it if configured. */
export const events = pgTable(
  'events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    chainId: uuid('chain_id'),
    deviceId: uuid('device_id'),
    name: text('name').notNull(),
    props: jsonb('props'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('events_chain_name_created_idx').on(t.chainId, t.name, t.createdAt)],
);

export type Chain = typeof chains.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Read = typeof reads.$inferSelect;
