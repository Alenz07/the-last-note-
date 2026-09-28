# syntax=docker/dockerfile:1
# The Last Note — the public site. Next.js standalone server, ~150 MB.
#
# NEXT_PUBLIC_* values are inlined into the client bundle when `next build`
# runs, so they arrive as BUILD ARGS. Putting them only in .env at runtime
# would ship an empty contact card and a dead WhatsApp link. Changing them
# therefore needs a rebuild, not a restart.

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WHATSAPP_URL
ARG NEXT_PUBLIC_INSTAGRAM_URL
ARG NEXT_PUBLIC_CONTACT_EMAIL
ARG NEXT_PUBLIC_LAUNCH_AT
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_WHATSAPP_URL=$NEXT_PUBLIC_WHATSAPP_URL
ENV NEXT_PUBLIC_INSTAGRAM_URL=$NEXT_PUBLIC_INSTAGRAM_URL
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL
ENV NEXT_PUBLIC_LAUNCH_AT=$NEXT_PUBLIC_LAUNCH_AT
ENV NEXT_TELEMETRY_DISABLED=1
# No backend is needed to build: the sitemap's getChains() already falls back
# to [] when the API is unreachable, and every other route is static or ISR.
RUN pnpm build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
RUN addgroup -S kadi && adduser -S kadi -G kadi
COPY --from=build --chown=kadi:kadi /app/.next/standalone ./
COPY --from=build --chown=kadi:kadi /app/.next/static ./.next/static
COPY --from=build --chown=kadi:kadi /app/public ./public
USER kadi
EXPOSE 3001
# /robots.txt is the only route that never calls the backend, so this reports
# on the web container alone instead of restarting it when the API is down.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3001/robots.txt || exit 1
CMD ["node", "server.js"]
