# Grocery Book — Implementation Plan

> This is the handoff document for UI and backend agents. Read alongside:
> - `design-system/grocery-book/MASTER.md` — design tokens, components, conventions
> - `design-system/grocery-book/pages/*.md` — per-screen specs (override MASTER)
> - `docs/ux-brief.md` — navigation, flows, empty states
> - `docs/api.md` — API contract
> - `docs/spec.md` — product context

---

## Work split

UI agent and backend agent work in parallel per feature. The backend agent defines exact response shapes for any new queries; the UI agent uses fixture/mock data until the backend confirms an endpoint is live.

UI agent working directory: `apps/web/app/` and `packages/ui/`  
Backend agent working directory: `apps/web/app/api/` and `packages/db/` and `packages/api/`

---

## Feature build order

Build in this order. Each feature is independently shippable.

### Feature 1 — Auth shell + routing

**Backend:**
- Wire `@auth/prisma-adapter` into `apps/web/auth.ts` with the real Prisma client
- Implement `GET /api/me` returning `{ id, email, name }` from the real session
- Implement `GET /api/me/preferences` and `PATCH /api/me/preferences`
- Add redirect middleware: unauthenticated requests to `/api/books/*` → 401

**UI:**
- `/sign-in` page — email form per `design-system/grocery-book/pages/sign-in.md`
- `/sign-in/check-email` holding page with countdown resend
- Root layout with bottom nav component (three tabs, elevated centre FAB)
- Top header component with book switcher slot
- Route guard: redirect unauthenticated users to `/sign-in`

**Shared types needed:** `SessionUser { id, email, name }`

---

### Feature 2 — Books + onboarding

**Backend:**
- `GET /api/books` — real implementation: list books where user is a member
- `POST /api/books` — create book, auto-add creator as OWNER BookMember
- `GET /api/books/:bookId` — book detail + members
- `PATCH /api/me/preferences` — save `lastActiveBookId`

**UI:**
- `/books/new` — create first book screen (no nav bar shown yet)
- Book switcher bottom sheet component
- Home screen redirect logic: check `lastActiveBookId`, fall back to first book, fall back to `/books/new`

---

### Feature 3 — Item list (home screen)

**Backend:**
- `GET /api/books/:bookId/items?q=` — fuzzy search, return items with `bestUnitPrice` inline
  - Note: the current spec returns bestPrice only on the item detail endpoint. Add a lightweight `bestUnitPrice: string | null, bestUnit: string | null` to the list response for display in rows.
- `POST /api/books/:bookId/items` — create item

**UI:**
- `/books/:bookId` — item list page per `design-system/grocery-book/pages/items.md`
- Search bar with debounced `?q=` fetch (300ms debounce)
- Item row component
- Skeleton loading state
- Empty states (no items, no search results)

---

### Feature 4 — Record a price (core feature)

**Backend:**
- `GET /api/books/:bookId/stores` — real stores list
- `POST /api/books/:bookId/stores` — create store inline
- `POST /api/books/:bookId/observations` — create observation, compute + store `unitPrice`
- Response should include `isNewBest: boolean` so the confirmation UI knows whether to show the trophy state

**UI:**
- `/books/:bookId/record` page per `design-system/grocery-book/pages/record.md`
- Combobox component (item search + inline create)
- Combobox component for stores (same pattern)
- Live unit price computation display
- "More details" disclosure accordion
- Confirmation bottom sheet (MASTER spec)
- `apps/web/lib/format-unit-price.ts` utility (MASTER spec)

---

### Feature 5 — Item detail + price history

**Backend:**
- `GET /api/books/:bookId/items/:itemId` — real implementation with `bestPrice` and `recentObservations` (sorted cheapest-first, limited to 50)
- `PATCH /api/books/:bookId/observations/:id` — edit own observation
- `DELETE /api/books/:bookId/observations/:id` — delete own observation

**UI:**
- `/books/:bookId/items/:itemId` per `design-system/grocery-book/pages/item-detail.md`
- Expandable observation row (accordion)
- Edit/delete for own observations
- Best price callout component

---

### Feature 6 — Book settings, members, stores

**Backend:**
- `POST /api/books/:bookId/invites` — send Resend invite email + create pending BookMember
- `PATCH /api/books/:bookId/invites/:inviteId` — accept invite
- `DELETE /api/books/:bookId/members/:userId` — remove member
- `PATCH /api/books/:bookId` — rename/update book
- `DELETE /api/books/:bookId` — delete book (owner only)

**UI:**
- `/books/:bookId/settings` — settings root
- `/books/:bookId/settings/members` — member list, invite sheet, pending invites
- `/books/:bookId/settings/stores` — store list + add/edit

---

### Feature 7 — Account + PWA

**Backend:** No new endpoints.

**UI:**
- `/account` page — name edit, sign out
- `public/manifest.json` — PWA manifest (name, icons, display: standalone, theme_color: #1E40AF)
- Wire `@ducanh2912/next-pwa` into `next.config.ts`
- PWA install prompt bottom sheet (deferred to post-first-record, per ux-brief.md)

---

## Shared components (build once, use everywhere)

These go in `packages/ui/src/` as reusable React components:

| Component | Used by |
|---|---|
| `BottomNav` | All book-scoped pages |
| `TopHeader` | All book-scoped pages |
| `Combobox` | Record page (item + store) |
| `BottomSheet` | Book switcher, invite, confirmation, any overlay |
| `SearchInput` | Item list |
| `UnitPriceDisplay` | Item row, item detail, record form |
| `SkeletonRow` | Item list, item detail |
| `EmptyState` | Item list, item detail |

---

## API contract additions (backend agent to confirm before UI wires up)

The following response fields are needed by the UI but not yet in `docs/api.md`. Backend agent should add them and update `docs/api.md`:

1. `GET /api/books/:bookId/items` — add `bestUnitPrice: string | null, bestUnit: string | null` per row
2. `POST /api/books/:bookId/observations` — add `isNewBest: boolean` to success response
3. `GET /api/books/:bookId/items/:itemId` — confirm `recentObservations` are sorted cheapest-first

---

## Pre-delivery checks (both agents)

- [ ] `pnpm run type-check` passes with zero errors
- [ ] `bash scripts/check-api-routes.sh` passes
- [ ] All interactive elements have `cursor-pointer`
- [ ] All form inputs have `<label>` elements
- [ ] All icon-only buttons have `aria-label`
- [ ] `min-h-[44px]` on all touch targets
- [ ] `inputMode="decimal"` on all numeric inputs
- [ ] No emojis used as icons
- [ ] No `animate-bounce` or decorative infinite animations
