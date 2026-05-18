# Grocery Book — Design System Master

> **HOW TO USE:** When building a specific page, check `design-system/grocery-book/pages/[page].md` first. If it exists, its rules override this file. If not, this file is the only source of truth.

**Stack:** Next.js 15 · Tailwind CSS · Lucide React icons  
**Baseline:** 375px mobile-first, WCAG AA minimum

---

## Colour Palette

Chosen for a calm, trustworthy utility app. **Amber is reserved exclusively for "best price" callouts** — it signals the most important data point in the entire product.

| Role | Hex | Tailwind equivalent | Usage |
|---|---|---|---|
| Primary | `#1E40AF` | `blue-800` | Nav bar, primary actions, links |
| Primary light | `#3B82F6` | `blue-500` | Hover states, secondary actions |
| **Accent / Best Price** | `#F59E0B` | `amber-400` | Best price badge, new-best confirmation — NOWHERE ELSE |
| Background | `#F8FAFC` | `slate-50` | Page background |
| Surface | `#FFFFFF` | `white` | Cards, bottom sheets, inputs |
| Border | `#E2E8F0` | `slate-200` | Input borders, dividers |
| Text primary | `#0F172A` | `slate-900` | Body text, headings |
| Text muted | `#475569` | `slate-600` | Secondary info, dates, labels |
| Text disabled | `#94A3B8` | `slate-400` | Placeholder, disabled |
| Success | `#16A34A` | `green-600` | Confirmation states |
| Destructive | `#DC2626` | `red-600` | Errors, delete actions |
| Sale badge | `#EF4444` | `red-500` | SALE chip on observations |

### Tailwind config additions (tailwind.config.ts)

```ts
extend: {
  colors: {
    brand: {
      DEFAULT: '#1E40AF',
      light: '#3B82F6',
    },
    'best-price': '#F59E0B',
  },
}
```

---

## Typography

**Font:** Inter throughout. Self-host or load via Google Fonts.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

| Role | Size | Weight | Tailwind |
|---|---|---|---|
| Page title | 24px | 700 | `text-2xl font-bold` |
| Section heading | 18px | 600 | `text-lg font-semibold` |
| **Best price number** | 36px | 700 | `text-4xl font-bold` |
| Body | 16px | 400 | `text-base` |
| Label / caption | 14px | 500 | `text-sm font-medium` |
| Helper / muted | 13px | 400 | `text-[13px] text-slate-600` |
| Unit price (list row) | 14px | 600 mono | `text-sm font-semibold font-mono tabular-nums` |

> **Tabular numbers everywhere prices appear.** Use `font-mono tabular-nums` on all unit price display values so columns align.

---

## Spacing & Layout

- **Safe zone:** `px-4` (16px) on all mobile screens. Never less.
- **Bottom nav height:** `h-16` (64px). All pages using bottom nav must pad `pb-16` at minimum, `pb-20` when safe area inset applies.
- **Top header height:** `h-14` (56px). Pages with header must add `pt-14`.
- **Touch targets:** All interactive elements `min-h-[44px] min-w-[44px]` — no exceptions.
- **Input gap:** `gap-2` (8px) minimum between adjacent touch targets.
- **Bottom sheet handle:** 4px × 32px pill, `bg-slate-300 rounded-full mx-auto mt-3 mb-4`.

---

## Motion & Transitions

| Use case | Duration | Easing | Tailwind |
|---|---|---|---|
| Colour/opacity change | 150ms | ease | `transition-colors duration-150` |
| Card hover shadow | 200ms | ease | `transition-shadow duration-200` |
| Bottom sheet open | 300ms | ease-out | CSS `translateY` (see Sheets section) |
| Confirmation slide-up | 300ms | spring (ease-out) | |
| active press | instant | — | `active:scale-95 transition-transform` |
| Skeleton shimmer | 1.5s | linear loop | `animate-pulse` |

**Always respect `prefers-reduced-motion`:** wrap all non-essential transitions in `motion-safe:` Tailwind variant.

---

## Component Specs

### Bottom navigation bar

```
Fixed to bottom. Three items. Centre item is elevated (FAB-style).
z-index: 50
Height: h-16 (64px)
Background: white with top border border-slate-200
Safe area: pb-safe (use env(safe-area-inset-bottom) for iOS PWA)
```

```tsx
// Tab item (Items, Book)
<button className="flex flex-col items-center justify-center flex-1 gap-1 text-slate-500 
                   hover:text-brand active:text-brand min-h-[44px] cursor-pointer 
                   transition-colors duration-150">
  <Icon className="w-5 h-5" />
  <span className="text-[11px] font-medium">Items</span>
</button>

// Centre Record tab (elevated)
<button className="flex items-center justify-center w-14 h-14 -mt-5 rounded-full 
                   bg-brand text-white shadow-lg active:scale-95 
                   transition-transform duration-150 cursor-pointer">
  <PlusIcon className="w-7 h-7" />
</button>
```

### Header bar

```
Fixed to top. h-14 (56px). white bg, bottom border slate-200. z-40.
Left: back arrow (icon-only, aria-label="Back") OR app/book name
Centre: page title (optional, only when needed for context)
Right: contextual action (max 1 icon)
Book switcher: book name + ChevronDownIcon, truncated at max-w-[160px]
```

### Cards / list rows

```tsx
// Item list row
<div className="flex items-center px-4 py-3 border-b border-slate-100 
                cursor-pointer hover:bg-slate-50 active:bg-slate-100 
                transition-colors duration-150 min-h-[56px]">
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
    <p className="text-[13px] text-slate-500 truncate">{category}</p>
  </div>
  <span className="ml-3 text-sm font-semibold font-mono tabular-nums text-slate-700 shrink-0">
    {formattedUnitPrice}
  </span>
  <ChevronRightIcon className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
</div>
```

### Search bar

```tsx
<div className="relative">
  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
  <input
    type="search"
    className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm 
               border-0 focus:ring-2 focus:ring-brand/30 focus:bg-white 
               transition-all duration-150 min-h-[44px]"
    placeholder="Search items..."
  />
</div>
```

### Best price callout (item detail)

```tsx
<div className="px-4 py-5 bg-white border-b border-slate-100">
  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
    Best price
  </p>
  <div className="flex items-baseline gap-1">
    <span className="text-4xl font-bold text-slate-900 tabular-nums">{value}</span>
    <span className="text-lg text-slate-500">/ {unit}</span>
  </div>
  <p className="text-sm text-slate-600 mt-1">{productName}</p>
  <p className="text-[13px] text-slate-400 mt-0.5">{storeName} · {date}</p>
</div>
```

### Observation list row (price history)

```tsx
<div className="flex items-center px-4 py-3 border-b border-slate-100 min-h-[52px]">
  {/* Best price star indicator */}
  {isBest && <div className="w-0.5 h-full absolute left-0 bg-amber-400 rounded-r" />}
  <span className="w-20 text-sm font-semibold font-mono tabular-nums text-slate-900 shrink-0">
    {formattedUnitPrice}
  </span>
  <span className="flex-1 text-sm text-slate-600 truncate">{storeName}</span>
  {isOnSale && (
    <span className="text-[10px] font-bold text-red-500 border border-red-200 
                     rounded px-1.5 py-0.5 mr-2 shrink-0">
      SALE
    </span>
  )}
  <span className="text-[13px] text-slate-400 shrink-0">{date}</span>
</div>
```

### Bottom sheets

```
Slide up from bottom. Overlay: bg-black/40 backdrop-blur-sm.
Sheet: white, rounded-t-2xl, max-h-[90vh], overflow-y-auto.
Handle pill at top. Dismiss on overlay tap or swipe down.
Animation: translateY(100%) → translateY(0), 300ms ease-out.
```

### Form inputs (Record screen)

```tsx
<div className="space-y-1">
  <label className="text-sm font-medium text-slate-700" htmlFor={id}>
    {label} {required && <span className="text-red-500">*</span>}
  </label>
  <input
    id={id}
    className="w-full px-3 py-3 border border-slate-200 rounded-xl text-base 
               focus:border-brand focus:ring-2 focus:ring-brand/20 
               transition-all duration-150 min-h-[48px]"
  />
</div>
```

> For numeric fields (price, quantity): `inputMode="decimal"` — triggers numeric keyboard on iOS/Android.

### Live unit price display (Record screen)

```tsx
<div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
    Unit price
  </p>
  {hasValue ? (
    <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
      {formattedUnitPrice}
    </p>
  ) : (
    <p className="text-sm text-slate-400 mt-0.5">Enter price & quantity</p>
  )}
</div>
```

### Confirmation sheet (post-Record)

```tsx
<div className="px-6 py-6 text-center">
  {isNewBest ? (
    <>
      {/* Only place a trophy/star SVG icon is used — not emoji */}
      <StarIcon className="w-10 h-10 text-amber-400 mx-auto mb-3" />
      <p className="text-lg font-semibold text-slate-900">New best price!</p>
      <p className="text-sm text-slate-500 mt-1">{itemName}</p>
    </>
  ) : (
    <>
      <CheckCircleIcon className="w-10 h-10 text-green-500 mx-auto mb-3" />
      <p className="text-lg font-semibold text-slate-900">Recorded</p>
    </>
  )}
  <p className="text-3xl font-bold tabular-nums mt-4">{formattedUnitPrice}</p>
  {!isNewBest && (
    <p className="text-sm text-slate-500 mt-2">
      Best is still {bestPrice} at {bestStore}
    </p>
  )}
  <div className="flex gap-3 mt-6">
    <button className="flex-1 py-3 border border-slate-200 rounded-xl text-sm 
                       font-medium cursor-pointer hover:bg-slate-50 
                       active:bg-slate-100 transition-colors min-h-[44px]">
      Record another
    </button>
    <button className="flex-1 py-3 bg-brand text-white rounded-xl text-sm 
                       font-semibold cursor-pointer active:opacity-90 
                       transition-opacity min-h-[44px]">
      Done
    </button>
  </div>
</div>
```

### Loading / skeleton

Use `animate-pulse` with slate-200 backgrounds. Match skeleton shape to the real content layout.

```tsx
// Item row skeleton
<div className="flex items-center px-4 py-3 border-b border-slate-100 min-h-[56px]">
  <div className="flex-1 space-y-1.5">
    <div className="h-3.5 bg-slate-200 rounded animate-pulse w-2/3" />
    <div className="h-3 bg-slate-200 rounded animate-pulse w-1/3" />
  </div>
  <div className="h-4 bg-slate-200 rounded animate-pulse w-12 ml-3" />
</div>
```

---

## Unit Price Formatting

Implement as a pure utility function at `apps/web/lib/format-unit-price.ts`:

```ts
export function formatUnitPrice(unitPrice: string, unit: string): string {
  const value = parseFloat(unitPrice)
  let formatted: string
  if (value < 0.01) {
    formatted = `${(value * 100).toFixed(1)}¢`
  } else if (value < 1.00) {
    formatted = `${(value * 100).toFixed(1)}¢`
  } else {
    formatted = `$${value.toFixed(2)}`
  }
  return `${formatted}/${unit}`
}
// Examples: "2.3¢/oz", "$1.23/lb", "$12.34/count"
```

---

## Icon library

**Lucide React only.** No emojis as icons. No mixing icon sets.

Key icons to import from `lucide-react`:

| Use | Icon |
|---|---|
| Items tab | `ShoppingBasket` |
| Record tab (FAB) | `Plus` |
| Book/Settings tab | `BookOpen` |
| Search | `Search` |
| Back | `ChevronLeft` |
| Book switcher chevron | `ChevronDown` |
| List row arrow | `ChevronRight` |
| Best price | `Star` (filled, amber) |
| Confirm success | `CheckCircle` |
| Sale badge | none — text only |
| Invite / people | `Users` |
| Store | `Store` |
| Sign out | `LogOut` |
| Add item inline | `Plus` |

---

## Accessibility requirements

- All icon-only buttons: `aria-label` required
- All form inputs: `<label>` with `htmlFor` — no placeholder-only labels
- Focus ring: `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2`
- Colour is never the only indicator (best price also has `★` marker, not just amber colour)
- `touch-action: manipulation` on all interactive elements (kills 300ms delay)

---

## What this system does NOT include (out of scope)

- Dark mode (MVP is light-only)
- Charts or data visualisation
- Barcode camera UI
- Animations beyond the basics above
- Complex multi-column desktop layouts
