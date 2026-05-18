# Grocery Book — Claude Code Project Context

You are working on **Grocery Book**, a mobile-first PWA for tracking and comparing unit prices of groceries and household goods. Read this file completely before doing anything else. It is the authoritative source of truth for all decisions made so far.

---

## What this app does

A household or community tracks prices they observe at stores over time. When you're standing in front of dish soap at the store, the app instantly tells you the best unit price you've ever seen for dish soap, across all stores, so you know whether to buy it now or wait.

Key behaviours:
- Record a price observation: generic item + brand + store + total price + quantity + unit
- Look up any item and see all observed prices ranked by unit price
- Share a "Book" with household or community members so everyone contributes
- Install as a PWA on mobile — works like a native app

---

## Architecture decisions (locked — do not relitigate)

### Stack
- **Framework:** Next.js 14+ App Router
- **Language:** TypeScript (strict mode throughout)
- **Styling:** Tailwind CSS (mobile-first)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** Auth.js with magic link (no passwords)
- **Email:** Resend (Auth.js native integration, 3,000/mo free tier)
- **Deployment:** Vercel + managed Postgres

### Monorepo structure
```
grocery-book/
├── apps/
│   ├── web/                  # Next.js PWA — primary app
│   └── mobile/               # Expo (future — not in scope now)
├── packages/
│   ├── db/                   # Prisma schema + generated client (@grocery-book/db)
│   ├── api/                  # Zod schemas + shared response types (@grocery-book/api)
│   └── ui/                   # Shared React components (@grocery-book/ui)
├── docs/
│   ├── spec.md               # Full product spec (generate this first)
│   ├── api.md                # API surface documentation
│   └── decisions/            # Architecture decision records
├── scripts/                  # Verification scripts (see CHECKS.md)
└── formulas/                 # Workflow definitions (ignore if not using Gas City)
```

Package manager: **pnpm workspaces**. Use Turborepo for the build pipeline.

---

## Data model (locked — implement exactly this)

```prisma
// packages/db/prisma/schema.prisma

enum BookMemberRole {
  OWNER
  EDITOR
  VIEWER
}

enum BookVisibility {
  PRIVATE
  INVITE_ONLY
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  createdAt   DateTime @default(now())

  preference  UserPreference?
  ownedBooks  Book[]
  memberships BookMember[]
  observations PriceObservation[]
}

model UserPreference {
  userId           String   @id
  user             User     @relation(fields: [userId], references: [id])
  lastActiveBookId String?
  lastActiveBook   Book?    @relation(fields: [lastActiveBookId], references: [id])
  updatedAt        DateTime @updatedAt
}

model Book {
  id          String         @id @default(cuid())
  name        String
  description String?
  ownerId     String
  owner       User           @relation(fields: [ownerId], references: [id])
  visibility  BookVisibility @default(INVITE_ONLY)
  createdAt   DateTime       @default(now())

  members      BookMember[]
  items        GenericItem[]
  stores       Store[]
  observations PriceObservation[]
  userPrefs    UserPreference[]
}

model BookMember {
  bookId    String
  book      Book           @relation(fields: [bookId], references: [id])
  userId    String
  user      User           @relation(fields: [userId], references: [id])
  role      BookMemberRole @default(EDITOR)
  invitedAt DateTime       @default(now())
  acceptedAt DateTime?

  @@id([bookId, userId])
  @@index([bookId])
  @@index([userId])
}

model GenericItem {
  id        String   @id @default(cuid())
  bookId    String
  book      Book     @relation(fields: [bookId], references: [id])
  name      String
  category  String?
  createdAt DateTime @default(now())

  observations PriceObservation[]

  @@index([bookId])
  @@index([bookId, name])
}

model Store {
  id        String   @id @default(cuid())
  bookId    String
  book      Book     @relation(fields: [bookId], references: [id])
  name      String
  location  String?
  createdAt DateTime @default(now())

  observations PriceObservation[]

  @@index([bookId])
}

model PriceObservation {
  id            String   @id @default(cuid())
  bookId        String
  book          Book     @relation(fields: [bookId], references: [id])
  genericItemId String
  genericItem   GenericItem @relation(fields: [genericItemId], references: [id])
  storeId       String?
  store         Store?   @relation(fields: [storeId], references: [id])
  storeRaw      String?  // freeform fallback if store not yet in table
  recordedById  String
  recordedBy    User     @relation(fields: [recordedById], references: [id])

  brand         String?
  productName   String
  barcode       String?

  totalPrice    Decimal  @db.Decimal(10, 4)
  quantity      Decimal  @db.Decimal(10, 4)
  unit          String   // freeform: "oz", "count", "lb", "load", "sq ft"
  unitPrice     Decimal  @db.Decimal(10, 4) // stored explicitly = totalPrice / quantity

  isOnSale      Boolean  @default(false)
  notes         String?

  observedAt    DateTime @default(now())
  createdAt     DateTime @default(now())

  @@index([genericItemId])
  @@index([bookId])
  @@index([barcode])
  @@index([observedAt])
  @@index([bookId, genericItemId])
}
```

**Critical rules:**
- Always use `Decimal` for price/quantity fields — never `Float`
- `unitPrice` is always stored explicitly. Validate that `unitPrice ≈ totalPrice / quantity` in Zod schema
- `observedAt` (when you saw the price) and `createdAt` (when recorded in app) are separate fields
- Never store a "best price" as a field — it's always computed via `MIN(unitPrice) WHERE genericItemId = x`

---

## API surface (implement these routes)

All routes under `/api/books/:bookId/` require auth + membership verification.

### Auth (Auth.js — write minimal custom code)
```
GET/POST  /api/auth/[...nextauth]   # Auth.js handler
GET       /api/auth/session          # current session
```

### Books
```
GET    /api/books                              # list user's books
POST   /api/books                              # create book
GET    /api/books/:bookId                      # book + members
PATCH  /api/books/:bookId                      # rename, description, visibility
DELETE /api/books/:bookId                      # owner only

POST   /api/books/:bookId/invites              # invite by email (sends Resend email)
PATCH  /api/books/:bookId/invites/:inviteId    # accept { action: "accept" }
DELETE /api/books/:bookId/members/:userId      # remove member
```

### Generic Items
```
GET    /api/books/:bookId/items                # list + search (?q= fuzzy)
POST   /api/books/:bookId/items
GET    /api/books/:bookId/items/:itemId        # item + bestPrice + recentObservations
PATCH  /api/books/:bookId/items/:itemId
DELETE /api/books/:bookId/items/:itemId        # only if no observations
```

### Stores
```
GET    /api/books/:bookId/stores
POST   /api/books/:bookId/stores
PATCH  /api/books/:bookId/stores/:storeId
```

### Price Observations (the core resource)
```
GET    /api/books/:bookId/observations         # list with query params:
                                               #   ?itemId=    filter by item
                                               #   ?best=true  return only lowest unitPrice
                                               #   ?storeId=   filter by store
                                               #   ?barcode=   barcode lookup
                                               #   ?since=     ISO date filter
                                               #   ?recordedBy=me
POST   /api/books/:bookId/observations         # record new price
GET    /api/books/:bookId/observations/:id
PATCH  /api/books/:bookId/observations/:id     # correct a mistake
DELETE /api/books/:bookId/observations/:id     # own observations only
```

### Me
```
GET    /api/me
PATCH  /api/me
GET    /api/me/preferences
PATCH  /api/me/preferences                     # set lastActiveBookId
```

### Key response shapes

```typescript
// GET /api/books/:bookId/items/:itemId
{
  id: string
  name: string
  category: string | null
  bestPrice: {
    unitPrice: string        // Decimal as string
    unit: string
    brand: string | null
    productName: string
    storeName: string
    observedAt: string
    isOnSale: boolean
  } | null
  recentObservations: ObservationWithStore[]
  observationCount: number
}

// GET /api/books/:bookId/observations?itemId=x
{
  observations: Array<PriceObservation & {
    store: { name: string; location: string | null } | null
    recordedBy: { name: string | null }
  }>
  bestUnitPrice: string | null   // Decimal as string
}
```

---

## Zod validation rules (packages/api/src/schemas/)

```typescript
// CreateObservationInput — key rules
{
  genericItemId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  storeRaw: z.string().max(200).optional(),
  brand: z.string().max(200).optional(),
  productName: z.string().min(1).max(500),
  barcode: z.string().max(50).optional(),
  totalPrice: z.number().positive(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  isOnSale: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  observedAt: z.string().datetime().optional(),
}
// Compute and validate unitPrice server-side: unitPrice = totalPrice / quantity
```

---

## Auth setup

```typescript
// apps/web/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Resend({
      from: process.env.RESEND_FROM,
    }),
  ],
  // Add Prisma adapter
})
```

Required env vars:
```
DATABASE_URL=
AUTH_SECRET=          # generate with: openssl rand -base64 32
AUTH_RESEND_KEY=      # from resend.com dashboard
RESEND_FROM=noreply@yourdomain.com
NEXTAUTH_URL=http://localhost:3000
```

---

## PWA setup

Add to `apps/web/next.config.ts`:
```typescript
import withPWA from "@ducanh2912/next-pwa"

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
})({
  // your next config
})
```

Add `apps/web/public/manifest.json` with name, icons, display: "standalone", theme_color.

---

## What to build first (bootstrap order)

1. **docs/spec.md** — write the product spec from this CLAUDE.md (expand into prose)
2. **packages/db** — Prisma schema exactly as above, run `prisma generate`
3. **Monorepo scaffold** — pnpm workspaces, turbo, all package.json files
4. **packages/api** — Zod schemas for all resources
5. **API routes** — all route handlers as stubs (validate input, return fixture data)
6. **docs/api.md** — document the implemented surface

Do not start on UI until the API layer compiles cleanly with `tsc --noEmit`.

---

## Definition of done for each layer

- **Schema:** `prisma validate` passes. All models, fields, Decimal types present.
- **Scaffold:** `pnpm install` succeeds. All package names scoped to `@grocery-book/*`.
- **API schemas:** `tsc --noEmit` passes in `packages/api`.
- **API routes:** Every route file exports at least one HTTP handler. Auth check present. `tsc --noEmit` passes in `apps/web`.
- **Docs:** `docs/api.md` covers all endpoints including `?best=true` query.

---

## Do not do these things

- Do not use `Float` for any price or quantity field — use `Decimal`
- Do not store computed best price as a column — query it
- Do not build UI before the API compiles
- Do not add OAuth providers — magic link only for MVP
- Do not add a mobile app — PWA covers this for now
- Do not create a separate "invites" table — pending invites are `BookMember` rows with `acceptedAt: null`
- Do not use `localStorage` or `sessionStorage`
- Do not add `category` as a required field on GenericItem — it is always nullable

---

## Files to read next

- `CHECKS.md` — verification scripts and how to use them
- `AGENTS.md` — agent team setup (if using swarm mode)
- `docs/spec.md` — generate this first if it doesn't exist
