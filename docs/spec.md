# Grocery Book — Product Specification

## Overview

Grocery Book is a mobile-first Progressive Web App (PWA) for households and communities to track and compare unit prices of groceries and household goods. The core value proposition: when a shopper is standing in front of dish soap at the store, the app instantly shows the lowest unit price ever observed for that item across all stores, enabling an informed buy-or-wait decision.

## Technology Stack

- **Framework:** Next.js 14+ with the App Router
- **Language:** TypeScript (strict mode throughout)
- **Styling:** Tailwind CSS (mobile-first, 375 px baseline)
- **ORM:** Prisma with PostgreSQL
- **Authentication:** Auth.js (magic link only — no passwords, no OAuth)
- **Email:** Resend (3,000 free emails/month; Auth.js native integration)
- **Deployment:** Vercel with managed Postgres
- **Structure:** pnpm monorepo with Turborepo

## Data Model

### User & Authentication

The `User` model stores registered users identified by email. Authentication uses a magic link: the user enters their email, Resend delivers a one-time sign-in link, and Auth.js creates an authenticated session. No passwords are ever created or stored.

The `UserPreference` model stores per-user settings with a 1-to-1 relationship to `User`. The key preference is `lastActiveBookId`, which lets the app re-open the user's last active price book on each visit.

### Books

A `Book` is the top-level organisational unit — a shared price database for a household or community group. Each book has an owning `User` and a set of `BookMember` entries. Membership roles are `OWNER`, `EDITOR`, and `VIEWER`. Book visibility is either `PRIVATE` or `INVITE_ONLY`.

Invitations are represented as `BookMember` rows with a null `acceptedAt` timestamp. There is no separate invites table. Pending members (invited but not yet accepted) have `acceptedAt: null`.

### Generic Items

A `GenericItem` represents a canonical product category within a Book — for example "Dish Soap" or "Greek Yogurt 500g". Each item belongs to exactly one Book. The `category` field is optional and always nullable — it is never required. Users record one or many `PriceObservation` entries against the same GenericItem over time to build a price history.

### Stores

A `Store` belongs to a Book and represents a physical retail location or chain. When recording a `PriceObservation`, a user may reference a known Store or fall back to the freeform `storeRaw` field if the store has not yet been added to the Book.

### Price Observations

`PriceObservation` is the core data record and the reason the app exists. A user records the total price, quantity, and unit for a specific product at a specific store on a specific date. The derived `unitPrice` (totalPrice ÷ quantity) is stored explicitly as a `Decimal` field — never a `Float` — to enable fast ordering and range queries without precision loss.

Key fields:
- `totalPrice`, `quantity`, `unitPrice` — always `Decimal`, never `Float`
- `unit` — freeform string such as "oz", "count", "lb", "load", or "sq ft"
- `observedAt` — when the shopper saw the price (may differ from `createdAt`)
- `isOnSale` — boolean flag distinguishing regular and promotional prices
- `barcode` — optional; enables barcode-scan lookups in the mobile UI
- `storeRaw` — freeform fallback when the store is not in the Book's store list
- `brand` — optional brand name (e.g. "Dawn", "Kirkland")
- `productName` — required product name as shown on the label

### Best Price Computation

The best (lowest) unit price for a GenericItem is always computed on demand via `MIN(unitPrice) WHERE genericItemId = x`. It is never stored as a column in any model — doing so would create stale data when observations are added, edited, or deleted.

## API Surface

All book-scoped resources live under `/api/books/:bookId/`. Every route in that namespace checks the Auth.js session and verifies that the requesting user is an active `BookMember` of the book before returning any data.

### Authentication
- `GET/POST /api/auth/[...nextauth]` — Auth.js handler (magic link)
- `GET /api/auth/session` — returns current session

### Books
Full CRUD: create, read, update (rename/describe/change visibility), and delete. Delete is restricted to the `OWNER` role. The book detail endpoint returns the book with its current member list.

Invite management:
- `POST /api/books/:bookId/invites` — invite a user by email (sends a Resend email); creates a pending `BookMember` row
- `PATCH /api/books/:bookId/invites/:inviteId` — accept an invite with `{ action: "accept" }`
- `DELETE /api/books/:bookId/members/:userId` — remove a member (owner only)

### Generic Items
CRUD with fuzzy search via `?q=` query parameter. Deleting an item is blocked if observations exist for it.

### Stores
CRUD for stores within a book.

### Price Observations
The primary create/read/update/delete surface. Key query parameters on `GET /api/books/:bookId/observations`:

| Parameter | Behaviour |
|---|---|
| `?itemId=` | Filter observations to a single GenericItem |
| `?best=true` | Return only the lowest-`unitPrice` observation |
| `?storeId=` | Filter by store |
| `?barcode=` | Barcode lookup |
| `?since=` | ISO 8601 date filter |
| `?recordedBy=me` | Filter to current user's observations |

Users may only delete their own observations.

### Me
- `GET/PATCH /api/me` — user profile
- `GET/PATCH /api/me/preferences` — user preferences including `lastActiveBookId`

## Zod Validation

All API inputs are validated with Zod schemas (defined in `@grocery-book/api`) before any database call. The `CreateObservationInput` schema enforces positive `totalPrice` and `quantity`, valid CUID references for `genericItemId` and optional `storeId`, field length limits, and server-side `unitPrice` computation and validation.

## PWA Configuration

The app is configured as a Progressive Web App using `@ducanh2912/next-pwa`. Users can install it to their iOS or Android home screen. The web manifest specifies `display: "standalone"` for a native-app feel. Service workers enable offline-capable behaviour and aggressive front-end navigation caching.

## Mobile-First Design Principles

- Primary actions reachable with one thumb at 375 px width
- Price entry flow completable in under 30 seconds
- Minimal visible form fields — only required fields shown by default
- Barcode scan is an optional enhancement, not the primary input path

## Multi-user Collaboration

Multiple members share a single Book. All `EDITOR` and `OWNER` members can record observations and manage items and stores. `VIEWER` members have read-only access. Invitations are sent by email via Resend. The invited user's email triggers creation of a pending `BookMember` row; clicking the email link calls the accept endpoint.
