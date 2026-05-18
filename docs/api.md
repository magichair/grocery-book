# Grocery Book — API Reference

All API routes are implemented as Next.js App Router route handlers. All book-scoped routes (`/api/books/:bookId/…`) require a valid Auth.js session and verify `BookMember` membership before returning data.

## Authentication

Magic link (email only) via Auth.js + Resend. No passwords.

| Method | Path | Description |
|---|---|---|
| `GET/POST` | `/api/auth/[...nextauth]` | Auth.js handler (magic link flow) |
| `GET` | `/api/auth/session` | Returns current session |

**Error responses**
- `401 Unauthorized` — no valid session
- `403 Forbidden` — authenticated but not a member of the requested book

---

## Books

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/books` | List all books the current user is a member of |
| `POST` | `/api/books` | Create a new book |
| `GET` | `/api/books/:bookId` | Get book details + member list |
| `PATCH` | `/api/books/:bookId` | Update name, description, or visibility |
| `DELETE` | `/api/books/:bookId` | Delete book (owner only) |

### Request body — `POST /api/books`
```json
{
  "name": "Home Essentials",
  "description": "optional",
  "visibility": "INVITE_ONLY"
}
```
Returns `400` if `name` is missing.

### Invitations & Members

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/books/:bookId/invites` | Invite a user by email (sends Resend email, creates pending `BookMember`) |
| `PATCH` | `/api/books/:bookId/invites/:inviteId` | Accept an invite — body: `{ "action": "accept" }` |
| `DELETE` | `/api/books/:bookId/members/:userId` | Remove a member (owner only) |

---

## Generic Items

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/books/:bookId/items` | List items; supports `?q=` fuzzy search |
| `POST` | `/api/books/:bookId/items` | Create a new item |
| `GET` | `/api/books/:bookId/items/:itemId` | Item detail: name, category, `bestPrice`, `recentObservations`, `observationCount` |
| `PATCH` | `/api/books/:bookId/items/:itemId` | Update item |
| `DELETE` | `/api/books/:bookId/items/:itemId` | Delete item (blocked if observations exist — returns `400`) |

### Item detail response
```json
{
  "id": "clx...",
  "name": "Dish Soap",
  "category": "Cleaning",
  "bestPrice": {
    "unitPrice": "0.0234",
    "unit": "oz",
    "brand": "Dawn",
    "productName": "Dawn Ultra 19.4oz",
    "storeName": "Costco",
    "observedAt": "2026-04-01T00:00:00.000Z",
    "isOnSale": false
  },
  "recentObservations": [],
  "observationCount": 12
}
```

The `bestPrice` field returns the observation with the lowest `unitPrice` ever recorded for this item. It is computed via `MIN(unitPrice)` — never a stored value.

---

## Stores

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/books/:bookId/stores` | List stores in book |
| `POST` | `/api/books/:bookId/stores` | Create a store |
| `PATCH` | `/api/books/:bookId/stores/:storeId` | Update name or location |

---

## Price Observations

This is the core resource. Every price sighting is a `PriceObservation`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/books/:bookId/observations` | List observations (see query params below) |
| `POST` | `/api/books/:bookId/observations` | Record a new price observation |
| `GET` | `/api/books/:bookId/observations/:id` | Single observation |
| `PATCH` | `/api/books/:bookId/observations/:id` | Correct a mistake |
| `DELETE` | `/api/books/:bookId/observations/:id` | Delete (own observations only) |

### Query parameters — `GET /api/books/:bookId/observations`

| Param | Type | Description |
|---|---|---|
| `itemId` | `string` (CUID) | Filter to a single `GenericItem` |
| `best=true` | `boolean` | Return only the lowest-unitPrice observation (best price) across the result set |
| `storeId` | `string` (CUID) | Filter to a specific store |
| `barcode` | `string` | Barcode lookup |
| `since` | ISO 8601 date | Return observations on or after this date |
| `recordedBy=me` | `string` | Filter to current user's observations |

#### Best price query
`GET /api/books/:bookId/observations?itemId=clx...&best=true`

Returns the single observation with the lowest `unitPrice` for the given item. The `bestUnitPrice` field in the response is always the minimum `unitPrice` across the filtered set as a `Decimal` string.

```json
{
  "observations": [
    {
      "id": "clx...",
      "genericItemId": "clx...",
      "unitPrice": "0.0234",
      "unit": "oz",
      "totalPrice": "4.99",
      "quantity": "213.0000",
      "brand": "Dawn",
      "productName": "Dawn Ultra 19.4oz",
      "isOnSale": false,
      "observedAt": "2026-04-01T00:00:00.000Z",
      "createdAt": "2026-04-01T12:00:00.000Z",
      "store": { "name": "Costco", "location": "123 Warehouse Blvd" },
      "recordedBy": { "name": "Alice" }
    }
  ],
  "bestUnitPrice": "0.0234"
}
```

### Request body — `POST /api/books/:bookId/observations`
```json
{
  "genericItemId": "clx...",
  "storeId": "clx...",
  "brand": "Dawn",
  "productName": "Dawn Ultra 19.4oz",
  "totalPrice": 4.99,
  "quantity": 213,
  "unit": "oz",
  "isOnSale": false,
  "observedAt": "2026-04-01T00:00:00.000Z"
}
```

- `totalPrice` and `quantity` must be positive numbers. Returns `400` otherwise.
- `unitPrice` is computed server-side as `totalPrice / quantity` and stored as `Decimal`.
- `storeRaw` may be used instead of `storeId` for freeform store names.

---

## Me

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/me` | Current user profile |
| `PATCH` | `/api/me` | Update profile (name) |
| `GET` | `/api/me/preferences` | User preferences |
| `PATCH` | `/api/me/preferences` | Update preferences (e.g. `lastActiveBookId`) |

### Preferences body
```json
{
  "lastActiveBookId": "clx..."
}
```

---

## Common Error Codes

| Code | Meaning |
|---|---|
| `400` | Bad request — validation failure (missing required field, invalid CUID, non-positive price/quantity) |
| `401` | Unauthorized — no valid session; redirect to sign-in |
| `403` | Forbidden — not a member of this book |
| `404` | Resource not found |
| `409` | Conflict — e.g. attempting to delete an item that has observations |

---

## Notes

- All `Decimal` fields (`unitPrice`, `totalPrice`, `quantity`) are returned as strings to avoid floating-point precision loss.
- The best price for any item is always computed via `MIN(unitPrice)` query — never stored as a column.
- `observedAt` (when the price was seen) and `createdAt` (when the record was created in the app) are separate fields and may differ.
