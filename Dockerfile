# syntax=docker/dockerfile:1
# Multi-stage build for Grocery Book (Next.js 15 / pnpm monorepo)

# ── Stage 1: install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

# corepack picks up the pnpm version from package.json#packageManager
RUN corepack enable

WORKDIR /app

# Copy workspace manifests + lockfile only — maximises layer cache reuse
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json  ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY packages/ui/package.json  ./packages/ui/
COPY apps/web/package.json     ./apps/web/

RUN pnpm install --frozen-lockfile

# ── Stage 2: build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

# Reuse installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate the Prisma client (reads the schema; no database connection needed)
RUN pnpm --filter @grocery-book/db db:generate

# Build-time env vars — values are placeholders; they are replaced at runtime.
# AUTH_SECRET and DATABASE_URL must be non-empty for Next.js to start the build.
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"

RUN pnpm --filter web build

# ── Stage 3: production runtime ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as a non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# next build --output=standalone traces and copies exactly the files needed.
# Static assets and public/ must be copied separately.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static      ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public             ./apps/web/public

# Copy Prisma schema + migrations so `prisma migrate deploy` can run at startup
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma

# Install the Prisma CLI for running migrations.
# Intentionally installed after COPY so it doesn't inflate the layer cache.
RUN npm install -g prisma@5 --ignore-scripts

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run pending migrations then start the server.
# `prisma migrate deploy` is idempotent and safe on every container start.
CMD prisma migrate deploy --schema packages/db/prisma/schema.prisma \
 && node apps/web/server.js
