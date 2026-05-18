# Page Override: Item List (`/books/:bookId`)

> Home screen after sign-in. Has bottom nav + top header.

## Layout

- Top: fixed header with book switcher
- Below header: sticky search bar (`pt-14`)
- Content: scrollable list (`pb-16` for bottom nav)
- Bottom: fixed bottom nav

## Header

```
[≡ Book Name ›]              [UserAvatar]
```

- Book name truncated at `max-w-[180px]`, followed by `ChevronDown` icon
- Tap opens book-switcher bottom sheet
- Right: small avatar circle (initials, `w-8 h-8 rounded-full bg-brand text-white text-xs`)

## Search bar (sticky below header)

```tsx
<div className="sticky top-14 z-30 bg-white border-b border-slate-100 px-4 py-2.5">
  <SearchInput />  {/* See MASTER search bar spec */}
</div>
```

## Item rows

See MASTER `observation list row` spec. Each row: name, category (muted), best unit price (right-aligned, tabular mono).

## Empty states

| Condition | UI |
|---|---|
| No items, no search query | Centred illustration area + "No items yet" text + "Record your first price" button (routes to /record) |
| Search returns nothing | "No items match '{query}'" + "Add '{query}' as new item" button |
| Loading | 8 skeleton rows (`animate-pulse`) |

## FAB pulse animation (first visit, no items)

The centre Record tab in bottom nav gets a subtle ring pulse:
```css
animation: ring-pulse 2s ease-out 3;  /* 3 times only, not infinite */
```
Use `motion-safe:animate-[ring-pulse_2s_ease-out_3]`.
