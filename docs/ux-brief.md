# Grocery Book — UX Brief

> This document defines the navigation structure, critical flows, empty states, and display conventions for the Grocery Book PWA. It is the authoritative source for UX decisions. Read it alongside `docs/spec.md` (product intent) and `docs/api.md` (data contract).

---

## Product intent in one sentence

When a shopper is standing in a store aisle, Grocery Book should answer "is this the best unit price I've ever seen for this product?" in under five seconds — and let them record the price in under thirty.

---

## Screen map

```
/                        → redirect to /sign-in (unauthenticated)
                         → redirect to /books/:bookId (authenticated, has active book)
                         → redirect to /books/new (authenticated, no books yet)

/sign-in                 Sign-in screen (email entry)
/sign-in/check-email     "Check your inbox" holding screen
/sign-in/verify          Token verification redirect (handled by Auth.js, not a UI screen)

/books/new               Create first book (shown to users with no books)

/books/:bookId           Item list — HOME SCREEN after sign-in
/books/:bookId/record    Record a price (the core entry form)
/books/:bookId/items/:itemId   Item detail (price history + best price)

/books/:bookId/settings  Book settings (name, visibility, members, stores)
/books/:bookId/settings/members   Member list + invite
/books/:bookId/settings/stores    Store list + add/edit

/account                 User profile (name, sign out)
```

---

## Navigation

A **bottom navigation bar** with three tabs is the persistent chrome on all book-scoped screens. It must be reachable with one thumb at 375 px.

| Tab | Icon hint | Destination |
|---|---|---|
| **Items** (default) | list / magnifying glass | `/books/:bookId` — item list |
| **Record** (centre, elevated FAB style) | + / camera | `/books/:bookId/record` |
| **Book** | people / gear | `/books/:bookId/settings` |

The **Record** tab is visually elevated (larger, filled background) because recording prices is the second-most-frequent action after lookup. It should be impossible to miss.

A **book switcher** lives in the top header: the current book name with a chevron. Tapping it opens a bottom sheet listing all the user's books plus a "New Book" option.

---

## Core flows

### 1. Sign in

**Path:** `/sign-in` → email submitted → `/sign-in/check-email` → user clicks link in email → `/books/:bookId` (or `/books/new` if first time)

- Screen is almost entirely a single centred card: app name/logo, one-line value prop, email input, "Send sign-in link" button.
- After submit: transition to `/sign-in/check-email` showing the email address they used and a "Resend" option after 60 seconds. No back button (don't let them second-guess).
- If the user clicks the link on a different device: that device signs in, the original waiting screen can show "Still waiting? Open the link on this device."
- No password field. No "forgot password". No OAuth buttons.

### 2. Record a price — the 30-second flow

**Path:** `+` tab → `/books/:bookId/record`

This is a **single scrollable form**, not a wizard. All fields visible at once so experienced users can fill in order without tapping Next.

**Field order and smart defaults:**

| Field | Type | Notes |
|---|---|---|
| Generic item | Search-select + inline create | Auto-focused on load. Fuzzy search against book's items. "Add '[query]' as new item" appears if no match. |
| Store | Search-select + inline create | Last-used store pre-selected. Freeform `storeRaw` allowed if not in list. |
| Total price | Numeric input | Currency keyboard. No $ symbol needed — app adds it. |
| Quantity | Numeric input | Defaults to 1. |
| Unit | Select + freeform | Common options first: oz, lb, count, fl oz, kg, g, load, sq ft, roll. Freeform allowed. |
| Unit price | **Computed display, read-only** | Shown prominently below quantity/unit. Updates live as user types. Format: see Display Conventions. |
| Brand | Text, optional | Shown collapsed under "More details ›" by default. |
| Product name | Text, required | Also under "More details ›". Pre-filled with brand if provided. |
| On sale? | Toggle | Under "More details ›". Default off. |
| Observed date | Date picker | Under "More details ›". Default today. |
| Notes | Text, optional | Under "More details ›". |

**On submit:** show a **confirmation card** (not a new page — overlay/sheet) that says:
- "Recorded: [unit price]/[unit]"
- If this is the new best price: "🏆 New best price for [item name]!"
- If not: "Best price is still [old best price] at [store] ([date])"
- Two actions: "Record another" (clears form, keeps item + store) and "Done" (goes to item detail).

### 3. Look up best price — the at-the-store flow

**Path:** Items tab → search or scroll → tap item → `/books/:bookId/items/:itemId`

**Item list screen (`/books/:bookId`):**
- Prominent search bar at the top (auto-focused on load on mobile when opened via deep link / home screen shortcut).
- Items listed alphabetically below; search filters live as you type.
- Each row: item name, category (if set), best unit price in muted text. Example: `Dish Soap · Cleaning · 2.3¢/oz`
- No pagination — virtual scroll if list is long.

**Item detail screen (`/books/:bookId/items/:itemId`):**

```
┌─────────────────────────────┐
│ ← Dish Soap         [+ REC] │  ← back to list, quick Record button
├─────────────────────────────┤
│   BEST PRICE                │
│   2.3¢ / oz                 │  ← large, prominent
│   Dawn Ultra 19.4oz         │
│   Costco · Apr 1            │
│   Recorded by Alice         │
├─────────────────────────────┤
│ Price history  (12 entries) │
│  ─────────────────────────  │
│  2.3¢/oz  Costco  Apr 1 ★  │  ← ★ = best
│  2.8¢/oz  Target  Mar 15    │
│  3.1¢/oz  Walmart Mar 2     │
│  ...                        │
└─────────────────────────────┘
```

- History sorted cheapest-first (by unit price, ascending). This is the default and only sort — users are always trying to find the best deal.
- Each row shows: unit price, store name, date. Tap to expand: brand, product name, total price, quantity, who recorded it.
- On sale observations are badged with a "SALE" chip so users know the best price might not be reproducible.
- Tapping the "REC" shortcut button in the header pre-fills the item on the record form.

---

## Empty states

| State | What to show |
|---|---|
| First sign-in, no books | Full-screen prompt: "Create your first Price Book" with a name field and Create button. Skip the nav bar entirely until a book exists. |
| Book exists, no items | Items tab shows: "No items yet. Tap + to record your first price." The + tab should pulse/animate to draw attention. |
| Item has no observations | Item detail shows: "No prices recorded yet. Be the first." with a Record button. |
| Search returns no results | "No items match '[query]'. Tap + to add it and record a price." |
| Offline | Toast at top: "You're offline. Browsing cached data." Record form is disabled with explanation. |

---

## Display conventions

### Unit price formatting

The goal is instant comprehension at a glance. Use the following rules:

| Value | Display |
|---|---|
| < $0.01 (sub-penny) | `0.8¢/oz` |
| $0.01–$0.99 | `2.3¢/oz` (cents, 1 decimal) |
| $1.00–$9.99 | `$1.23/oz` (2 decimal places) |
| $10.00+ | `$12.34/oz` (2 decimal places) |

Always show the unit. Never show a bare number. The unit is part of the value ("2.3¢" is meaningless; "2.3¢/oz" is actionable).

In the price history list, align unit prices in a monospace column for easy scanning.

### Dates

- Same calendar year: "Apr 1" or "Mar 15"
- Prior year: "Apr 2025"
- Today: "Today"
- Yesterday: "Yesterday"

### "Best price" badge

Use a subtle highlight (not a giant banner) — a left border accent or a lightweight chip. The best price should feel like a fact, not a celebration. The confirmation screen after recording *can* be celebratory ("New best price! 🏆"), but the list and detail views should be calm and scannable.

---

## PWA install

- **Do not show an install prompt immediately.** Show it after the user has recorded their first price — they've demonstrated intent and understand the value.
- Install banner appears as a dismissable bottom sheet: "Add Grocery Book to your home screen for quick access at the store." with Install and Not now buttons.
- Also accessible at any time from the Book settings screen → "Install app."
- After install, the bottom nav becomes the only chrome (no browser URL bar). The top header becomes minimal.

---

## Multi-book switching

- The current book name is always visible in the top header with a `›` chevron.
- Tapping it opens a **bottom sheet** (not a page navigation) listing:
  - All books the user is a member of, with role badge (Owner / Editor / Viewer)
  - Active book highlighted
  - "New Book" option at the bottom
- Switching book updates `lastActiveBookId` preference silently in the background.

---

## Member management (Book settings → Members)

- List of current members with name, email, role badge.
- Owner can remove members (tap row → "Remove from book").
- "Invite someone" button opens a simple sheet: email field, role selector (Editor/Viewer, default Editor), Send button.
- Pending invites shown in a separate "Pending" section with the email and a "Revoke" option.
- When a new member accepts, they appear in the active list.

---

## Account / sign-out

- `/account` is accessible from the Book settings screen or a profile avatar in the header (small, unobtrusive).
- Shows: name (editable), email (read-only), "Sign out" button.
- No delete account in MVP.

---

## What this brief does not cover

The following are deliberate out-of-scope items for the initial UI build:

- Barcode scanning camera UI (noted as optional enhancement)
- Charts / price trend over time
- Filtering/sorting the price history by store or date
- Notifications / alerts ("price has dropped below X")
- Expo mobile app
