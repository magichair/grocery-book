# syntax=docker/dockerfile:1

# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable
RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace manifests + lockfile first for layer cache efficiency
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json  ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY packages/ui/package.json  ./packages/ui/
COPY apps/web/package.json     ./apps/web/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

# Generate the Prisma client — downloads engine binaries for native +
# linux-musl-openssl-3.0.x (required for Alpine/Docker at runtime)
RUN pnpm --filter @grocery-book/db db:generate

# Build-time placeholder values — real secrets are injected at runtime
ARG BUILD_DATABASE_URL=postgresql://build:build@localhost:5432/build
ARG BUILD_AUTH_SECRET=build-time-placeholder
ARG BUILD_NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=$BUILD_DATABASE_URL \
    AUTH_SECRET=$BUILD_AUTH_SECRET \
    NEXTAUTH_URL=$BUILD_NEXTAUTH_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter web build

# Inject native Prisma engine binaries into the standalone bundle.
# Next.js' file tracer only follows JS imports; .so.node native binaries
# are skipped. We find them in pnpm's virtual store and copy them into
# the same relative path inside the standalone output so Prisma finds
# them at runtime without attempting any downloads.
RUN <<'INJECT'
set -e
find /app/node_modules -name "*.so.node" -path "*/.prisma/client/*" 2>/dev/null \
  | while read ENGINE; do
      RELATIVE="${ENGINE#/app/}"
      DEST="/app/apps/web/.next/standalone/${RELATIVE}"
      mkdir -p "$(dirname "$DEST")"
      cp "$ENGINE" "$DEST"
      echo "injected: $RELATIVE"
    done
INJECT

# ── Stage 2: Production runtime ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output now includes the injected native engine binaries
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static      ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public             ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
