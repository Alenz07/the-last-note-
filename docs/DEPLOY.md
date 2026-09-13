# Deploy — one box, ~₹400/month

Target: a 2 vCPU / 4 GB VPS (Hetzner CX22 ≈ €3.8, DigitalOcean Bangalore $6) running `docker-compose.prod.yml`
(app + Postgres + Redis + Caddy auto-HTTPS + nightly pg_dump), with **Cloudflare free** in front and **R2** for media.

## 0. Accounts (all free to open)

- Domain on Cloudflare Registrar (~₹1,000/yr). Keep DNS on Cloudflare, proxy ON (orange cloud).
- Cloudflare R2: create bucket `kadi-media`, create an API token (Object Read & Write) → `S3_ACCESS_KEY_ID/SECRET`, endpoint `https://<accountid>.r2.cloudflarestorage.com`.
- Cashfree (default gateway): account + KYC (sandbox keys work meanwhile). Dashboard → Developers → API Keys → `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY`. Webhook → `https://<domain>/api/webhooks/cashfree`, events `PAYMENT_SUCCESS_WEBHOOK` + `PAYMENT_FAILED_WEBHOOK`. The webhook is signed with the same secret key, so there is no separate webhook secret.
- Razorpay (drop-in alternative): webhook → `https://<domain>/api/webhooks/razorpay`, events `payment.captured`, `payment.failed`, secret → `RAZORPAY_WEBHOOK_SECRET`.
- VPS: Ubuntu 24.04, `apt install docker.io docker-compose-v2 git`.

## 1. Configure

```bash
git clone <repo> kadi && cd kadi
cp .env.example .env
```

Edit `.env` — the ones that matter:

```
DOMAIN=kadi.example.com
NEXT_PUBLIC_APP_URL=https://kadi.example.com
APP_SECRET=<openssl rand -hex 32>
ADMIN_PASSWORD=<long>
CRON_SECRET=<openssl rand -hex 16>
POSTGRES_PASSWORD=<long>
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_BUCKET=kadi-media
S3_ACCESS_KEY_ID=...  S3_SECRET_ACCESS_KEY=...
PAYMENT_GATEWAY=cashfree   # cashfree | razorpay | mock (mock shows TEST MODE everywhere)
CASHFREE_APP_ID=... CASHFREE_SECRET_KEY=... CASHFREE_ENV=production
# or, for Razorpay:
# RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=...
SITE_URL=https://${DOMAIN}   # payment return URLs; same origin as the API in production
VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@domain   # pnpm vapid
SEED_ON_EMPTY=false
LEGAL_ENTITY=... GRIEVANCE_NAME=... GRIEVANCE_EMAIL=...   # legal pages
```

`DATABASE_URL` and `REDIS_URL` are set by the compose file.

## 2. Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f app     # wait for "[kadi] ready"
curl -s https://$DOMAIN/api/health
docker compose -f docker-compose.prod.yml exec app node -e "console.log('ok')"
```

Migrations run at boot. Create the chains in `/admin` (or `pnpm db:seed --no-demo` locally against the prod `DATABASE_URL`).

## 3. Cloudflare settings (the read-spike insurance)

- SSL/TLS: Full (strict). Caddy holds a real cert.
- Caching → Cache Rules: **cache everything** for `/`, `/c/*` (not `/c/*/reveal*`), `/api/stats/*`, `/_next/static/*`. The ISR pages already send `s-maxage=5, stale-while-revalidate`, so "respect origin" works for them; for the OG image routes (`/c/*/opengraph-image`, rendered per request) set Edge TTL **override → 5 minutes**. Bypass cache for `/api/*` except stats, `/l/*`, `/me`, `/admin*`, `/c/*/reveal*`.
- Security: Bot Fight Mode on; a rate-limiting rule on `/api/pay` (e.g. 30 req/min per IP) on top of the app's own limits.
- Network: enable "IP geolocation" so `cf-ipcity` arrives (that's where the city comes from).

## 4. Operations

| Task | How |
|---|---|
| Logs | `docker compose -f docker-compose.prod.yml logs -f app` |
| Update | `git pull && docker compose -f docker-compose.prod.yml up -d --build` (zero-downtime not guaranteed; ~20 s) |
| Backups | `./backups/kadi-YYYY-MM-DD.sql.gz` nightly; ship the folder to R2 with `rclone` in cron |
| Sweep / reconcile | runs in-process every 5 min; also `curl -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/sweep` |
| Refunds | manual, from the Razorpay dashboard; `/admin/payments` shows stuck orders |
| Reports | `/admin/reports` — act within 72 h (IT Rules) |
| Resize | stop, resize the droplet/server, start — nothing else changes |

## When one box isn't enough

Reads never reach the box (Cloudflare). Writes are throttled by payments (~20/s is trivial). If you outgrow it anyway:
move Postgres to a managed instance (Neon/Supabase/DO), point `DATABASE_URL` at it, run two app containers behind Caddy.
Nothing in the code assumes a single instance except the ISR file cache (add the Redis cache handler then).
