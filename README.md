# Grocery Book

Track and compare unit prices across stores. When you're standing in front of dish soap at the supermarket, Grocery Book tells you the best price-per-ounce you've ever seen for that product — across every store you've visited — so you know whether to buy now or wait for a better deal.

Self-hosted, no subscription, no tracking. Your price data stays on your server.

---

## Features

- **Unit price comparison** — record total price + quantity and the app computes and stores the unit price. Or enter the unit price directly from the shelf label. Automatically flags when you've found a new all-time best.
- **Price history** — every observation is kept, sorted cheapest-first. See which store had the best price and when.
- **Shared price books** — invite your household or buying group. Everyone contributes observations; everyone sees the full price history. Roles: Owner, Editor, Viewer.
- **Token-based invites** — send an invite to any email address. The recipient can sign in with any email they like — the invite isn't tied to the address it was sent to.
- **Magic link auth** — no passwords. Sign in with a one-time email link via [Resend](https://resend.com). Free tier covers 3,000 emails/month.
- **Multiple books** — maintain separate price books (e.g. a personal one and a household one). Switch between them from the header.
- **PWA** — installable on iOS and Android home screens. Works like a native app in standalone mode.
- **Mobile-first** — designed for 375 px screens. Price entry is completable in under 30 seconds.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Auth | Auth.js v5 (magic link) |
| Email | Resend |
| Runtime | Node.js 20 |

---

## Self-hosting with Docker

### Requirements

- Docker + Docker Compose
- A [Resend](https://resend.com) account (free tier is sufficient)
- A domain or reverse proxy if you want HTTPS (recommended)

### Quick start

Pre-built images are published to GitHub Container Registry on every release:

```bash
docker pull ghcr.io/magichair/grocery-book:latest
```

Or pin to a specific version (recommended):

```bash
docker pull ghcr.io/magichair/grocery-book:1.0.0
```

Then grab the compose file and env template:

```bash
curl -O https://raw.githubusercontent.com/magichair/grocery-book/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/magichair/grocery-book/main/apps/web/.env.example
cp apps/web/.env.example .env.prod
```

Or clone the full repo if you prefer to build from source:

```bash
git clone https://github.com/magichair/grocery-book.git
cd grocery-book
cp apps/web/.env.example .env.prod
```

**Run migrations** before first use and after any update that changes the schema:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate
```

Edit `.env.prod` with your values:

```env
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-secret-here

# The public URL of your instance (no trailing slash)
NEXTAUTH_URL=https://grocerybook.yourdomain.com

# From resend.com → API Keys
AUTH_RESEND_KEY=re_xxxxxxxxxxxx

# Must be a verified sender in your Resend account
RESEND_FROM=noreply@yourdomain.com

# Database — used by the app container; postgres container is configured below
POSTGRES_PASSWORD=a-strong-password
POSTGRES_USER=grocery
POSTGRES_DB=grocery_book
```

Start the stack:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

The app container automatically runs `prisma migrate deploy` on startup, so the database schema is applied on first run. The app is then available on port 3000.

### Updating

**GHCR image (recommended):**
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

**Build from source:**
```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Migrations run automatically on restart in both cases.

### Reverse proxy

Put Nginx, Caddy, or Traefik in front of port 3000 for HTTPS. Example Caddyfile:

```
grocerybook.yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## Local development

Requirements: Node 20, pnpm 9, Docker (for Postgres).

```bash
git clone https://github.com/magichair/grocery-book.git
cd grocery-book

pnpm install

# Start Postgres
docker compose up -d

# Copy and fill in dev env vars
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local — DATABASE_URL is pre-filled for the local Docker Postgres

# Apply migrations and start
pnpm db:migrate
pnpm dev
```

App runs at [http://localhost:3000](http://localhost:3000).

### Useful commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the Next.js dev server |
| `pnpm db:migrate` | Apply pending Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio (database browser) |
| `pnpm run type-check` | TypeScript check across all packages |
| `pnpm run check:all` | Run all verification scripts |

---

## Architecture

```
grocery-book/
├── apps/web/          # Next.js PWA — the entire UI and API
├── packages/
│   ├── db/            # Prisma schema + client (@grocery-book/db)
│   ├── api/           # Zod validation schemas (@grocery-book/api)
│   └── ui/            # Shared React components (@grocery-book/ui)
├── Dockerfile
├── docker-compose.yml          # Dev: Postgres only
└── docker-compose.prod.yml     # Prod: app + Postgres
```

pnpm workspaces + Turborepo. All API routes live under `apps/web/app/api/`.

---

## Data & privacy

- All price data is stored in your PostgreSQL instance. Nothing is sent to any third party except authentication emails (via Resend).
- Resend is used only to deliver sign-in links and invite notifications. No analytics or tracking.
- There is no telemetry. `NEXT_TELEMETRY_DISABLED=1` is set in the Docker image.

---

## License

MIT
