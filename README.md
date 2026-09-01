# Kadi — The Chain

Pay ₹5 → read what the last stranger left → leave yours for the next → get your link number → share.

## Repository layout

```
kadi/
├─ backend/                 the whole engine — run this on its own
│   ├─ src/app/api/         14 HTTP endpoints (pay, verify, webhook, submit, …)
│   ├─ src/app/admin/       admin panel  →  /admin
│   ├─ src/app/(legal)      /terms /privacy /refunds /content-policy /grievance
│   ├─ src/lib/             chain engine · payments · moderation · storage · redis
│   ├─ src/db/ + drizzle/   Postgres schema + migrations
│   └─ README.md            how to run, scripts, architecture
│
├─ frontend/                (to be created — the new UI, designed by the owner)
│
├─ docs/                    REQUIREMENTS · DECISIONS · DEPLOY · MYSTERY
├─ docker-compose.yml       local Postgres/Redis/MinIO (optional for dev)
├─ docker-compose.prod.yml  production: backend + Postgres + Redis + Caddy
└─ Caddyfile                prod reverse proxy ( /  → frontend · /api /admin → backend )
```

## Run the backend alone

```bash
cd backend
pnpm install
pnpm dev            # http://localhost:3000 — APIs, /admin, legal pages
```

Zero configuration needed: embedded Postgres (PGlite) + local media + mock
payments by default; real Postgres/Redis/R2/Razorpay via `.env.local`
(see `backend/.env.example`).

Smoke test: `curl localhost:3000/api/health`

## Frontend ↔ backend contract

The frontend talks to the backend over HTTP only (`/api/*`). In development,
point the frontend dev server's proxy at `http://localhost:3000/api`; in
production Caddy serves both under one domain, so cookies stay first-party
and no CORS is needed. Response shapes live in
`backend/src/lib/chain/types.ts`.

The previous frontend (tiles, hero, reveal flow UI) is preserved in git —
commit `b63714c` "Checkpoint before frontend reset".
