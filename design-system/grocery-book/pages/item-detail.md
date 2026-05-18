# Page Override: Item Detail (`/books/:bookId/items/:itemId`)

> The at-the-store answer screen. Has bottom nav + top header.

## Header

```
[← Items]    Dish Soap         [+ Rec]
```

Right button: small `+ Rec` pill button (compact, `px-3 py-1.5 text-xs font-semibold bg-brand text-white rounded-full`) that links to `/record?itemId=...`.

## Above the fold (critical — must load first)

```
┌──────────────────────────┐
│  BEST PRICE              │  ← 11px uppercase slate-400 tracking-wider
│  2.3¢ / oz               │  ← 36px bold slate-900, tabular-nums
│  Dawn Ultra 19.4oz       │  ← 14px slate-600
│  Costco · Apr 1          │  ← 13px slate-400
│  Recorded by Alice       │  ← 13px slate-400
├──────────────────────────┤
│  Price history (12)      │  ← 14px font-medium slate-700 px-4 pt-3 pb-1
│  ────────────────────── │
│  (observation rows)      │
└──────────────────────────┘
```

The best price block has a left border accent: `border-l-4 border-amber-400 pl-4` on the inner content.

## Observation rows

See MASTER `observation list row` spec. Tapping a row expands an inline accordion:

```
2.3¢/oz   Costco    Apr 1   ★
▼ expanded:
  Dawn Ultra 19.4oz  ·  $4.99 / 213 oz  ·  by Alice
  [Edit]  [Delete]   (only shown for own observations)
```

Expand/collapse: `max-h-0 overflow-hidden` → `max-h-[80px]`, `300ms ease` transition.

## Loading state

Best price block: two skeleton lines. History: 5 skeleton rows.

## Empty state (no observations)

```
┌──────────────────────────┐
│  No prices recorded yet. │
│  [Record the first price]│  ← links to /record?itemId=...
└──────────────────────────┘
```

## Data fetching

Fetch `GET /books/:bookId/items/:itemId` for best price + recent observations (up to 50).  
If `observationCount > 50`, show "Load more" at list bottom.
