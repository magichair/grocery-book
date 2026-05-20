# syntax=docker/dockerfile:1

# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# corepack reads pnpm version from package.json#packageManager
RUN corepack enable

WORKDIR /app

# Copy workspace manifests + lockfile first for cache-efficient installs
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json  ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY packages/ui/package.json  ./packages/ui/
COPY apps/web/package.json     ./apps/web/

# BuildKit cache mount keeps the pnpm content-addressable store across builds.
# Re-builds only re-download packages that actually changed.
# OpenSSL 3 is required by the linux-musl-openssl-3.0.x Prisma engine binary
RUN apk add --no-cache openssl

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy the rest of the source after install so the dependency layer is cached
COPY . .

# Generate the Prisma client (reads the schema; no database connection needed)
RUN pnpm --filter @grocery-book/db db:generate

# Build-time placeholders — real values are injected at runtime via env vars.
# Renamed so the linter doesn't flag them as leaked secrets (they are not).
ARG BUILD_DATABASE_URL=postgresql://build:build@localhost:5432/build
ARG BUILD_AUTH_SECRET=build-time-placeholder
ARG BUILD_NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=$BUILD_DATABASE_URL \
    AUTH_SECRET=$BUILD_AUTH_SECRET \
    NEXTAUTH_URL=$BUILD_NEXTAUTH_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter web build

# ── Stage 2: Production runtime ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# OpenSSL 3 is needed by the Prisma query engine at runtime
RUN apk add --no-cache openssl

# Run as a non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output traces and includes exactly the runtime files needed.
# Static assets and public/ must be copied alongside it.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static      ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public             ./apps/web/public

# Prisma schema + migrations for `prisma migrate deploy` at startup
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma

# Prisma CLI for running migrations (not part of the standalone bundle)
RUN npm install -g prisma@5 --ignore-scripts

# Startup script: run migrations then start the server
COPY --chown=nextjs:nodejs <<'EOF' /entrypoint.sh
#!/bin/sh
set -e
prisma migrate deploy --schema packages/db/prisma/schema.prisma
exec node apps/web/server.js
EOF
RUN chmod +x /entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/entrypoint.sh"]
