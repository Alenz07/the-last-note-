# Kadi — The Chain

Pay ₹5 → read what the last stranger left → leave yours for the next → get your link number → share.

One build is a **chain engine**: every themed chain (Confess, Advice to a stranger, Story building…) is a row in the database, not new code.

## Run it in 60 seconds

```bash
pnpm install
cp .env.example .env.local      # defaults are fine
pnpm dev                         # http://localhost:3000
```

That's it. With no configuration the app uses:

| Concern | Local default | Production |
|---|---|---|
| Database | embedded **PGlite** at `.data/pg` (migrations auto-applied, demo chains auto-seeded) | Postgres (`DATABASE_URL`) |
| Redis | `REDIS_URL` if reachable, else in-process memory | Redis |
| Media | disk at `.data/media`, served via signed URLs | Cloudflare R2 / any S3 (`STORAGE_DRIVER=s3`) |
| Payments | **mock gateway — TEST MODE**, no money moves | Razorpay (`PAYMENT_GATEWAY=razorpay` + keys) |
| Push | off until `pnpm vapid` keys are set | VAPID keys |

Admin: `/admin` (password `ADMIN_PASSWORD`, default `admin`).

## Scripts

| Command | What |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` | tsc · eslint · vitest (engine tests run on in-memory PGlite) |
| `pnpm db:generate` | new migration from `src/db/schema.ts` → `drizzle/` |
| `pnpm db:migrate` | apply migrations to `DATABASE_URL` (the app also does this on boot) |
| `pnpm db:seed` | create the 3 launch chains (+ demo links unless `--no-demo`) |
| `pnpm vapid` | generate Web Push keys |

## How it's built

```
src/
  app/                 pages (public, by kadi-c6), api/ routes, admin/
  components/flow/     behaviour: PayButton → MockCheckout/Razorpay → verify, Composer (text/voice/photo), Countdown, LiveStats, Push, Share, Report
  components/ui/       the tile primitive and friends (design layer)
  lib/
    chain/core.ts      WRITE side: createPaymentIntent, capturePayment (atomic allocation, idempotent), submitLink, reportLink, sweep, admin ops
    chain/queries.ts   READ side: the contract pages consume (types in chain/types.ts)
    payments/          PaymentGateway interface · mock · razorpay
    moderation/        filters (phone/url/contact/slurs) + blocklist
    kv.ts storage.ts   Redis/memory · local/S3 media with signed URLs
    copy.ts            every user-facing string (design layer)
  db/schema.ts         Drizzle schema · drizzle/ migrations
docs/                  REQUIREMENTS, DECISIONS, DEPLOY, MYSTERY
```

The two things that must never break — **position allocation** and **payment idempotency** — live in one function, `capturePayment()`, inside one transaction, and are covered by `src/lib/chain/chain.test.ts` (25 concurrent captures → positions 1…25; same order captured twice → one link).

See [docs/DECISIONS.md](docs/DECISIONS.md) for why things are the way they are and [docs/DEPLOY.md](docs/DEPLOY.md) to put it on a ₹400/month box.
