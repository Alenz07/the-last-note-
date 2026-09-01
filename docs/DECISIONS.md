# Decisions

Short record of the calls that shape the build, so nobody re-litigates them by accident. Dates are when they were made.

## Product (2026-08-23)

| Decision | Why |
|---|---|
| **No login, ever, in v1.** Anonymous 1-year device cookie; ownership of a link = holding its secret URL. | Every screen between "curious" and "paid ₹5" loses people. UPI already identifies the payer. Anonymity *is* the product. DPDP: less data, less liability. Recovery path: **/find** by payment ID. |
| **Each link = text ≤280 + optional voice ≤30 s + optional photo ≤1080 px.** | Voice is the strongest "a real stranger" signal; photos sell Story chains. Client-side compressed so storage ≈ free. |
| **Media stays private forever. Only text unseals.** | Text is regex-filterable in 5 ms; images are not. Publishing user images within 50 links is an IT-Rules/criminal exposure we don't want. It also makes the ₹5 worth *more*: the voice note going to exactly one stranger is the mystery. |
| **Rolling unseal:** a link's text is public once the chain has 50 more links after it (`chains.unseal_after`). | Proves the chain is real, gives Google something, creates "pay ₹5 now or wait for 50 more people". |
| **Reveal = referrer link if you arrived via a share link, else latest submitted.** Story chains always reveal the last 3. | Makes sharing self-interested ("come read MINE") and makes the read-receipt loop fire more than once per link. The read graph is a tree, recorded in `reads`. |
| **Paid-but-unwritten slots pass silently after 10 min.** Numbering never breaks. | Reveal only ever selects *submitted* links, so nobody is blocked by a slow writer. |
| **₹5 is a platform fee. No money ever flows to users.** | Prize Chits & Money Circulation Schemes (Banning) Act, 1978. |
| **Three launch chains:** Confess (wine), Advice to a stranger (teal), Story building (indigo, reveals 3). | Story building is the one that genuinely needs the previous link — it proves the mechanic. |
| **Design:** the link tile is the one primitive; dark; one amber accent on the CTA; Instrument Serif numerals; CSS-only motion (unseal + tick); one button per screen; no blur/3D. | Opened from WhatsApp on an ₹8–15k Android on mobile data; 3-second decision. Premium = restraint. |

## Stack (2026-08-23)

| Decision | Why |
|---|---|
| **Next.js 16 full-stack (TypeScript end to end). No Go.** | The spike hits *reads* (ISR + CDN), writes are payment-throttled — a language change buys nothing measurable and costs a second codebase, CORS and shared types. Go remains a fine choice if the API ever needs to live on its own; `src/lib/chain/*` is the port surface. |
| **Postgres via Drizzle; PGlite embedded for local dev and tests.** | `UNIQUE(chain_id, position)` + one `UPDATE … RETURNING` makes duplicate/skipped numbers structurally impossible. PGlite gives zero-setup dev and real-Postgres tests (`pnpm test` needs no Docker). Mongo was considered: fine, not cheaper, weaker guarantees for exactly this problem. |
| **Redis for rate limits, the capture lock and a 3 s stats cache — with memory fallback.** | Everything still works if Redis is down (NF6). The DB row lock is the real idempotency guard; Redis just avoids duplicate work. |
| **Cloudflare R2 for media (S3 driver), local disk in dev.** | Zero egress. 10 GB free ≈ 10,000 links of worst-case media. |
| **`PaymentGateway` interface; mock now, Razorpay next.** | The entire funnel is testable today; going live = env vars + keys. Capture logic is one function shared by client-verify, webhook and reconciliation cron (NF4/NF5). |
| **Web Push (VAPID) for "someone read your link".** | Free. WhatsApp Cloud API later, per-message cost. |
| **Deploy: one VPS (Hetzner/DO) + docker-compose + Caddy + Cloudflare free in front.** | ~₹350–530/month all-in versus a ₹1,700 floor on Vercel Pro. Single box is an accepted risk at this stage; CF cache keeps the site *looking* alive if the box dies. |
| **ISR `revalidate=5` on landing/teaser; dynamic on reveal/my-link.** | 0 DB queries per view on the hot path; the build never needs a DB. |

## Things we said no to

- Three.js / GSAP / glassmorphism — conversion killers on the target device.
- Accounts, phone OTP, social login — v2 at the earliest, only with a reason.
- Payouts, trading, "dead drop" geo — never / later.
- Publishing media — never (see above).
- Queue infrastructure (BullMQ/Inngest) — the in-process sweep + an HTTP cron endpoint is enough at this volume.
