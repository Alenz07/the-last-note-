# syntax=docker/dockerfile:1
# Kadi — single image: Next.js standalone server. ~150 MB, ~200 MB RAM.

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build never needs a database: pages are ISR and data access is skipped in the build phase.
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S kadi && adduser -S kadi -G kadi
COPY --from=build --chown=kadi:kadi /app/.next/standalone ./
COPY --from=build --chown=kadi:kadi /app/.next/static ./.next/static
COPY --from=build --chown=kadi:kadi /app/public ./public
# migrations are applied at boot by the app itself
COPY --from=build --chown=kadi:kadi /app/drizzle ./drizzle
USER kadi
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
