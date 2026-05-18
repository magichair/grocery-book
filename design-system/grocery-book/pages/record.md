# Page Override: Record a Price (`/books/:bookId/record`)

> The 30-second flow. Single scrollable form. Has bottom nav + minimal top header.

## Header

```
[← Back]    Record a price
```

No right action. Back goes to item list (or item detail if pre-filled from there).

## Form layout

Single scrollable column, `px-4 space-y-5`, `pb-32` (clears bottom nav + submit button).

**Fixed submit button at bottom** (above bottom nav):
```tsx
<div className="fixed bottom-16 left-0 right-0 px-4 pb-safe bg-white 
                border-t border-slate-100 pt-3">
  <button className="w-full py-3.5 bg-brand text-white rounded-xl font-semibold 
                     text-base cursor-pointer active:opacity-90 transition-opacity
                     disabled:opacity-50 min-h-[52px]">
    Record price
  </button>
</div>
```

## Field sections

### Always visible

1. **Item** — combobox: search field with live `?q=` API call, dropdown of matches, "Add '[query]' as new item" as last option. Auto-focused on mount.

2. **Store** — same combobox pattern. Pre-selects last-used store from localStorage (store ID only, no sensitive data).

3. **Price row** — two columns side by side:
   ```
   [Total price $___]   [Qty ___] [Unit ▾]
   ```
   - `inputMode="decimal"` on both numeric fields
   - Unit: small inline select with common units + "Other" (opens text input)

4. **Unit price display** — computed read-only block (see MASTER spec). Updates on every keystroke. Shows "—" when inputs are empty.

### Collapsed section: "More details"

Disclosure triangle (`ChevronRight` → `ChevronDown`). Defaults closed.
Contains: Brand, Product name (required but collapsible since most users skip), On sale toggle, Observed date, Notes.

`Product name` defaults to `"{brand} {item name}"` when brand is filled, so it pre-fills and the user rarely needs to touch it.

## Inline item/store creation

When user types and selects "Add 'X' as new item":
- Instantly creates the item via API `POST /books/:bookId/items`
- Selects the new item in the field
- No modal/navigation interruption

## Live unit price computation

```ts
// runs on every change to totalPrice, quantity
const unitPrice = totalPrice && quantity ? totalPrice / quantity : null
```

Display updates with 0ms debounce — feels instant.

## Submission

1. Disable button, show spinner
2. `POST /books/:bookId/observations`
3. On success: slide up confirmation sheet (see MASTER confirmation spec)
4. Confirmation sheet's "Record another" clears price/qty/brand/notes, keeps item + store
5. "Done" navigates to item detail page

## Error handling

- API 400: show field-level error below the relevant input
- API 401: redirect to sign-in (session expired)
- Network error: "Couldn't save — check your connection" toast, button re-enables
