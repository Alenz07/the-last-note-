# Kadi — The Chain

Pay ₹5 → read what the last stranger left → leave yours for the next → get your link number → share.
One build = a *chain engine*: every themed chain is a row in the DB, not new code.

> Updated 2026-08-23 after the stack/product review. What changed vs. the first draft: Next.js **16** (not 15), self-hosted on a VPS (not Vercel), PGlite for local dev, media (voice/photo) per link with media **never** unsealed, rolling unseal at 50, referral reveal mode, no login ever, mock payment gateway first. Rationale in [DECISIONS.md](DECISIONS.md); status of each requirement in the last column.

---

## 1. v1 scope

IN: text links (≤280) + optional voice (≤30 s) + optional photo (≤1080 px), ₹5 via gateway (mock now, Razorpay next), multiple themed chains, link numbers, share card + OG image, "your link was read" loop (web push + status page), rolling public unseal of text, moderation basics, admin, funnel analytics, legal pages.

OUT (v2+): accounts/login, WhatsApp notifications, geo "dead drop", trading, payouts (never), public media (never).

---

## 2. Functional requirements

| # | Requirement | Status |
|---|---|---|
| F1 | Landing: live chains with counters (length, last city, minutes since last link) — each tile shows the *shape* of its latest sealed link. | done |
| F2 | Chain teaser: "#N left something for you" — shape (word-length bars, char count, voice seconds, has-photo, read count), never the content — one ₹5 CTA. Share landing `/c/[slug]/[position]` does the same for a specific link. | done |
| F3 | Pay: gateway order → checkout → verify. Mock gateway (TEST MODE badge) today; Razorpay adapter written, untested against live keys. | done (mock) |
| F4 | Reveal: latest *submitted* link (story chains: last 3); if arrived via share link, that link (unless own/hidden). One reveal per payment; reveal stays viewable by token. | done |
| F5 | Submit: after reveal, write text + optional voice/photo. 10-min window (per chain); unsubmitted slot → "passed silently"; numbering never breaks. | done |
| F6 | Link number + share: "You are link #4,372 · Gurgaon", WhatsApp/copy/native share with hook text, dynamic OG image per link. | done |
| F7 | Read-receipt loop: "Read by N · last from City · ago" on status page; web push on read. | done |
| F8 | My links: device cookie (1 yr) → `/me`; `/find` by payment ID as recovery. No signup. | done |
| F9 | Unseal: text becomes public once the chain is `unseal_after` (50) links past it; `/c/[slug]/unsealed`. Media never. | done |
| F10 | Moderation: phone/URL/email/UPI/handle regexes, slur list EN+Hinglish (leetspeak-aware), repeat filter, report button, auto-hide at 3 reports, admin remove/restore/ban, rate limits per device/IP. | done |
| F11 | Admin (env password): chains CRUD, funnel per chain, report queue, link lookup, payments/reconciliation view, sweep/seed buttons. | done |
| F12 | Legal: Terms, Privacy (DPDP), Refunds, Content policy, Grievance (IT Rules) — placeholders via env. | done (fill placeholders) |
| F13 | Funnel events per chain: chain_view → pay_click → pay_created → pay_captured → reveal_view → link_submitted → share_click → notified. | done (DB + admin; PostHog optional) |

---

## 3. Non-functional

| # | Target | Status |
|---|---|---|
| NF1 | Teaser/landing via ISR (5 s) + CDN; 0 DB queries per view; live counters from a 3 s KV cache. | done |
| NF2 | 1,000+ concurrent viewers / ~300 req/s on read pages without DB load. | by design (CF cache); load-test before launch |
| NF3 | 20 payments/s with correct ordering (atomic allocation). | done + tested (25 concurrent → 1..25) |
| NF4 | Idempotent payments: same order captured twice → one link. | done + tested |
| NF5 | Never take money without a reveal: client-verify + webhook + 5-min reconciliation. | done (mock); verify with Razorpay test keys |
| NF6 | Degradation: Redis down → memory fallback; DB down → pages serve stale ISR, pay returns 503. | done |
| NF7 | p95 reveal/submit < 500 ms from India. | measure after deploy |
| NF8 | Rate limits: pay 10/min/device + 40/min/IP, submit 12/min, report 5/min, events 240/min/IP; Cloudflare bot fight at the edge. | done |
| NF9 | Observability: health endpoint, admin funnel + payments view; Sentry/PostHog optional via env. | partial |
| NF10 | Cost: ₹0 during build; ~₹400/month at launch (VPS + domain); R2 egress ₹0. | done (see DEPLOY.md) |

---

## 4. Tech stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router, TypeScript), Tailwind v4, one codebase for pages + API |
| DB | Postgres via Drizzle; **PGlite** embedded for dev/tests (zero setup) |
| Cache / limits / lock | Redis (ioredis) with in-process memory fallback |
| Media | S3-compatible (Cloudflare R2 in prod, disk in dev), private, signed URLs |
| Payments | `PaymentGateway` interface → Mock (now) / Razorpay (written) |
| Push | Web Push (VAPID) |
| Hosting | VPS + docker-compose (app, Postgres, Redis, Caddy) + Cloudflare free |
| Tests | Vitest on in-memory PGlite: allocation, idempotency, reveal selection, window, reports, unseal, moderation |

See §6–§9 of the original draft for the spike architecture, data model, payment flow and legal posture — all implemented as described, with these concrete mappings: `chains.tail` allocation in `capturePayment()`; `links.reveal_token` bearer; `reads` table for the read graph; `payments.gateway_order_id UNIQUE` + `FOR UPDATE` for idempotency; sweep every 5 min (in-process) + `/api/cron/sweep`.

---

## 5. Before public launch (checklist)

1. Domain + Cloudflare (cache rules in DEPLOY.md), VPS, R2 bucket.
2. Razorpay KYC → test keys → run the flow → live keys. Configure webhook.
3. Fill legal placeholders (entity, address, grievance officer) via env.
4. `APP_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET`, VAPID keys in prod env; `SEED_ON_EMPTY=false`.
5. Seed 30 real links per chain (not demo text) — admin or `pnpm db:seed --no-demo` + write them.
6. Optional: Sentry DSN, PostHog key.
7. Launch in 5 WhatsApp groups; watch `/admin` funnel.
