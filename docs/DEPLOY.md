# Deploy — one box, ~₹650/month

One VPS runs everything via `docker-compose.prod.yml`:

| Service | What it is |
|---|---|
| `app` | the engine — API, admin, legal pages, payments, the sweep (:3000) |
| `web` | the public site people see (:3001) |
| `db` / `redis` | Postgres 17, Redis |
| `caddy` | TLS + routing (:80/:443) |
| `backup` | nightly `pg_dump` to `./backups` |
| `offsite` | ships dumps **and media** to Google Drive |

**One domain, two apps.** Caddy sends `/api`, `/admin` and the legal pages to `app`;
everything else to `web`. The frontend's Next rewrites do the same thing in dev.

Sized for **2 GB RAM**: Utho Micro (Mumbai, ~₹649/mo, UPI) or AWS Lightsail Mumbai
($12/mo). Cloudflare free sits in front.

## 0. Accounts

- **Domain** — any registrar taking UPI (Hostinger, GoDaddy India, BigRock).
  Cloudflare Registrar sells `.com` at cost but does **not** sell `.in`.
  Either way, point the nameservers at Cloudflare.
- **Cloudflare (free, no card)** — DNS, HTTPS, caching, and Email Routing so
  `hello@yourdomain` forwards to your Gmail.
- **Cashfree** — account + KYC. Sandbox keys work until it clears; set
  `CASHFREE_ENV=production` the day it does, or checkout takes no money.
  Webhook → `https://<domain>/api/webhooks/cashfree`,
  events `PAYMENT_SUCCESS_WEBHOOK` + `PAYMENT_FAILED_WEBHOOK`. It is signed with
  the same secret key — there is no separate webhook secret.
- **Google Drive** — offsite backups. Your existing Gmail, 15 GB free, no card.
- **Cloudflare R2** — optional, needs a card. Without it media lives on the
  server disk, which is fine (see §3).
- **VPS** — Ubuntu 24.04, then `apt install -y docker.io docker-compose-v2 git`.

## 1. Configure

```bash
git clone <repo> kadi && cd kadi
cp .env.example .env
```

Fill `.env`. The ones that matter:

```
DOMAIN=thelastnote.in
SITE_URL=https://thelastnote.in
POSTGRES_PASSWORD=<long>
APP_SECRET=<openssl rand -hex 32>     # signs cookies + media URLs
ADMIN_PASSWORD=<long>                  # not "admin"
CRON_SECRET=<openssl rand -hex 16>
PAYMENT_GATEWAY=cashfree
CASHFREE_APP_ID=...  CASHFREE_SECRET_KEY=...  CASHFREE_ENV=sandbox
STORAGE_DRIVER=local                   # or s3 + the S3_* block for R2
VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@domain   # pnpm vapid
SEED_ON_EMPTY=false                    # never auto-seed a live database
LEGAL_ENTITY=... GRIEVANCE_NAME=... GRIEVANCE_EMAIL=... GRIEVANCE_ADDRESS=...
NEXT_PUBLIC_WHATSAPP_URL=...  NEXT_PUBLIC_INSTAGRAM_URL=...  NEXT_PUBLIC_CONTACT_EMAIL=...
```

`DATABASE_URL`, `REDIS_URL` and `NEXT_PUBLIC_APP_URL` are set by compose.

> **`NEXT_PUBLIC_*` are compiled into the browser bundle at image build time.**
> Changing a social link needs `up -d --build web`, not a restart.

## 2. Start

On a 2 GB box, build the two apps **one at a time** — building both at once
runs out of memory. Give it swap first:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f app   # wait for "[kadi] ready"
curl -s https://$DOMAIN/api/health
```

Migrations run at boot. Create the chains in `/admin`.

## 3. Media

`STORAGE_DRIVER=local` keeps photos and voice notes in the `media` Docker
volume, which **survives redeploys** — only the disk dying loses them, which is
what `offsite` covers. Switch to `s3` only once the `S3_*` values are filled.

## 4. Offsite backups — do this before launch

`backup` writes nightly dumps to `./backups` **on the same disk as the database**.
On a single cheap VPS, that disk is the likeliest way to lose everything, so
`offsite` copies dumps and media to Google Drive. Set it up once:

```bash
docker run --rm -it -v $PWD/rclone:/config/rclone rclone/rclone config
# n) new remote -> name it "gdrive" -> Google Drive -> accept defaults
# it prints a URL: open it on your laptop, approve, paste the token back
```

That writes `./rclone/rclone.conf` (gitignored — it holds a Google token).
Set `OFFSITE_REMOTE=gdrive` in `.env`. Until the file exists the container just
idles and says so in the logs. Verify:

```bash
docker compose -f docker-compose.prod.yml logs offsite   # "offsite sync done"
```

## 5. Cloudflare

- **SSL/TLS: Full (strict).** Any other mode gives an infinite redirect loop.
- **Network → IP geolocation: on.** That is where the city on each note comes from
  (`cf-ipcity`), and `cf-connecting-ip` is what the rate limiter counts.
- **Cache Rules:** cache `/`, `/c/*` (not `/c/*/reveal*`), `/_next/static/*`.
  Bypass `/api/*`, `/l/*`, `/me`, `/admin*`, `/c/*/reveal*`.
- **Bot Fight Mode on**, plus a rate-limit rule on `/api/pay` (~30/min per IP).

## 6. Operations

| Task | How |
|---|---|
| Logs | `docker compose -f docker-compose.prod.yml logs -f app web` |
| Update | `git pull`, then build app and web separately, then `up -d` (~20 s down) |
| Backups | nightly in `./backups`, copied to Drive by `offsite` |
| Restore | `gunzip < backups/kadi-YYYY-MM-DD.sql.gz \| docker compose -f docker-compose.prod.yml exec -T db psql -U kadi kadi` |
| Sweep | runs in-process every 5 min; also `curl -H "Authorization: Bearer $CRON_SECRET" https://$DOMAIN/api/cron/sweep` |
| Refunds | manual, from the **Cashfree** dashboard; `/admin/payments` shows stuck orders |
| Reports | `/admin/reports` — act within 72 h (IT Rules) |

## When one box isn't enough

Reads mostly never reach the box (Cloudflare). Writes are gated by payments.
If you outgrow it: move Postgres to a managed instance, point `DATABASE_URL` at
it, and run more `web` containers behind Caddy. Nothing assumes a single
instance except the ISR file cache — add the Redis cache handler then.
