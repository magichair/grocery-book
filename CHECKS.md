# Grocery Book — Verification Checks

These scripts define "done" for each layer of the bootstrap. Run them after completing each step. All scripts exit 0 on success, non-zero on failure with a description of what's missing.

Place these scripts at `scripts/` in the project root and run `chmod +x scripts/*.sh` before use.

---

## check-spec.sh
Verifies `docs/spec.md` exists and covers required content.

```bash
#!/usr/bin/env bash
set -euo pipefail
SPEC="docs/spec.md"
ERRORS=()

[[ ! -f "$SPEC" ]] && echo "✗ docs/spec.md missing" && exit 1

WORD_COUNT=$(wc -w < "$SPEC")
[[ "$WORD_COUNT" -lt 300 ]] && ERRORS+=("Spec too short: $WORD_COUNT words")

for term in "GenericItem" "PriceObservation" "unitPrice" "Book" "BookMember" \
            "Store" "User" "UserPreference" "magic link" "Resend" "Prisma" \
            "Next.js" "monorepo"; do
  grep -qi "$term" "$SPEC" || ERRORS+=("Missing: $term")
done

[[ ${#ERRORS[@]} -gt 0 ]] && printf '✗ %s\n' "${ERRORS[@]}" && exit 1
echo "✓ spec.md OK ($WORD_COUNT words)"
```

---

## check-schema.sh
Verifies the Prisma schema is valid and complete.

```bash
#!/usr/bin/env bash
set -euo pipefail
SCHEMA="packages/db/prisma/schema.prisma"
ERRORS=()

[[ ! -f "$SCHEMA" ]] && echo "✗ schema.prisma missing" && exit 1

for model in "model User" "model UserPreference" "model Book" "model BookMember" \
             "model GenericItem" "model Store" "model PriceObservation"; do
  grep -q "$model" "$SCHEMA" || ERRORS+=("Missing model: $model")
done

for field in "unitPrice" "totalPrice" "quantity" "isOnSale" "observedAt" \
             "storeRaw" "barcode" "lastActiveBookId" "acceptedAt" "visibility"; do
  grep -q "$field" "$SCHEMA" || ERRORS+=("Missing field: $field")
done

grep -E "unitPrice\s+Float|totalPrice\s+Float" "$SCHEMA" \
  && ERRORS+=("Money fields must be Decimal, not Float")

grep -q "@@index" "$SCHEMA" || ERRORS+=("No @@index found — indexes required")

command -v npx &>/dev/null \
  && npx --prefix packages/db prisma validate 2>&1 \
  || ERRORS+=("prisma validate failed")

[[ ${#ERRORS[@]} -gt 0 ]] && printf '✗ %s\n' "${ERRORS[@]}" && exit 1
echo "✓ schema.prisma OK"
```

---

## check-scaffold.sh
Verifies the monorepo structure is correctly set up.

```bash
#!/usr/bin/env bash
set -euo pipefail
ERRORS=()

for f in "package.json" "pnpm-workspace.yaml" "turbo.json" "tsconfig.base.json" \
         ".gitignore" "apps/web/package.json" "apps/web/next.config.ts" \
         "apps/web/tailwind.config.ts" "apps/web/app/layout.tsx" \
         "apps/web/app/page.tsx" "apps/web/.env.example" \
         "packages/db/package.json" "packages/db/prisma/schema.prisma" \
         "packages/api/package.json" "packages/api/src/index.ts" \
         "packages/ui/package.json"; do
  [[ ! -f "$f" ]] && ERRORS+=("Missing: $f")
done

grep -q '"@grocery-book/db"' packages/db/package.json     2>/dev/null || ERRORS+=("packages/db name wrong")
grep -q '"@grocery-book/api"' packages/api/package.json   2>/dev/null || ERRORS+=("packages/api name wrong")
grep -q '"@grocery-book/ui"' packages/ui/package.json     2>/dev/null || ERRORS+=("packages/ui name wrong")
grep -q '"strict": true' tsconfig.base.json               2>/dev/null || ERRORS+=("tsconfig missing strict: true")

for var in "DATABASE_URL" "AUTH_SECRET" "AUTH_RESEND_KEY" "RESEND_FROM" "NEXTAUTH_URL"; do
  grep -q "$var" apps/web/.env.example 2>/dev/null || ERRORS+=("Missing env var in .env.example: $var")
done

command -v pnpm &>/dev/null && pnpm install 2>&1 || ERRORS+=("pnpm install failed")

[[ ${#ERRORS[@]} -gt 0 ]] && printf '✗ %s\n' "${ERRORS[@]}" && exit 1
echo "✓ scaffold OK"
```

---

## check-api-schemas.sh
Verifies Zod schemas exist and type-check.

```bash
#!/usr/bin/env bash
set -euo pipefail
ERRORS=()

for f in "packages/api/src/schemas/books.ts" \
         "packages/api/src/schemas/items.ts" \
         "packages/api/src/schemas/stores.ts" \
         "packages/api/src/schemas/observations.ts" \
         "packages/api/src/schemas/me.ts" \
         "packages/api/src/types/index.ts" \
         "packages/api/src/index.ts"; do
  [[ ! -f "$f" ]] && ERRORS+=("Missing: $f")
done

OBS="packages/api/src/schemas/observations.ts"
if [[ -f "$OBS" ]]; then
  for field in "totalPrice" "quantity" "unit" "isOnSale" "productName" "barcode" "storeRaw"; do
    grep -q "$field" "$OBS" || ERRORS+=("observations.ts missing: $field")
  done
  grep -q "from ['\"]zod['\"]" "$OBS" || ERRORS+=("observations.ts must import zod")
fi

grep -q "visibility" packages/api/src/schemas/books.ts 2>/dev/null \
  || ERRORS+=("books.ts missing visibility field")

command -v npx &>/dev/null \
  && npx --prefix packages/api tsc --noEmit 2>&1 \
  || ERRORS+=("tsc failed in packages/api")

[[ ${#ERRORS[@]} -gt 0 ]] && printf '✗ %s\n' "${ERRORS[@]}" && exit 1
echo "✓ api schemas OK"
```

---

## check-api-routes.sh
Verifies all route files exist and have correct shape.

```bash
#!/usr/bin/env bash
set -euo pipefail
ERRORS=()

ROUTES=(
  "apps/web/app/api/auth/[...nextauth]/route.ts"
  "apps/web/app/api/books/route.ts"
  "apps/web/app/api/books/[bookId]/route.ts"
  "apps/web/app/api/books/[bookId]/members/route.ts"
  "apps/web/app/api/books/[bookId]/members/[userId]/route.ts"
  "apps/web/app/api/books/[bookId]/invites/route.ts"
  "apps/web/app/api/books/[bookId]/invites/[inviteId]/route.ts"
  "apps/web/app/api/books/[bookId]/items/route.ts"
  "apps/web/app/api/books/[bookId]/items/[itemId]/route.ts"
  "apps/web/app/api/books/[bookId]/stores/route.ts"
  "apps/web/app/api/books/[bookId]/stores/[storeId]/route.ts"
  "apps/web/app/api/books/[bookId]/observations/route.ts"
  "apps/web/app/api/books/[bookId]/observations/[id]/route.ts"
  "apps/web/app/api/me/route.ts"
  "apps/web/app/api/me/preferences/route.ts"
)

for f in "${ROUTES[@]}"; do
  [[ ! -f "$f" ]] && ERRORS+=("Missing route: $f") && continue
  grep -qE "export (async )?function (GET|POST|PATCH|DELETE)" "$f" \
    || ERRORS+=("No HTTP handler exported: $f")
done

for f in "apps/web/app/api/books/route.ts" \
         "apps/web/app/api/books/[bookId]/items/route.ts" \
         "apps/web/app/api/books/[bookId]/observations/route.ts"; do
  [[ -f "$f" ]] && ! grep -qi "auth\|session" "$f" \
    && ERRORS+=("No auth check in: $f")
done

OBS="apps/web/app/api/books/[bookId]/observations/route.ts"
[[ -f "$OBS" ]] && ! grep -q "itemId" "$OBS" && ERRORS+=("observations route missing ?itemId param")
[[ -f "$OBS" ]] && ! grep -q "best" "$OBS"   && ERRORS+=("observations route missing ?best param")

command -v npx &>/dev/null \
  && npx --prefix apps/web tsc --noEmit 2>&1 \
  || ERRORS+=("tsc failed in apps/web")

[[ ${#ERRORS[@]} -gt 0 ]] && printf '✗ %s\n' "${ERRORS[@]}" && exit 1
echo "✓ api routes OK"
```

---

## check-api-docs.sh
Verifies `docs/api.md` covers the full surface.

```bash
#!/usr/bin/env bash
set -euo pipefail
DOCS="docs/api.md"
ERRORS=()

[[ ! -f "$DOCS" ]] && echo "✗ docs/api.md missing" && exit 1

WORD_COUNT=$(wc -w < "$DOCS")
[[ "$WORD_COUNT" -lt 400 ]] && ERRORS+=("docs/api.md too short: $WORD_COUNT words")

for section in "/api/books" "observations" "items" "stores" "members" \
               "/api/me" "best=true" "unitPrice" "401" "400"; do
  grep -qi "$section" "$DOCS" || ERRORS+=("docs/api.md missing: $section")
done

grep -qi "best price\|lowest.*unit" "$DOCS" || ERRORS+=("Must explain the best price query")

[[ ${#ERRORS[@]} -gt 0 ]] && printf '✗ %s\n' "${ERRORS[@]}" && exit 1
echo "✓ api docs OK ($WORD_COUNT words)"
```

---

## Running all checks

```bash
chmod +x scripts/*.sh

# Run each in sequence — stop on first failure
./scripts/check-spec.sh \
  && ./scripts/check-schema.sh \
  && ./scripts/check-scaffold.sh \
  && ./scripts/check-api-schemas.sh \
  && ./scripts/check-api-routes.sh \
  && ./scripts/check-api-docs.sh \
  && echo "✓ All checks passed"
```

Or add to `package.json`:
```json
{
  "scripts": {
    "check:all": "bash scripts/check-spec.sh && bash scripts/check-schema.sh && bash scripts/check-scaffold.sh && bash scripts/check-api-schemas.sh && bash scripts/check-api-routes.sh && bash scripts/check-api-docs.sh"
  }
}
```
