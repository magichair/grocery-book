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
  && (cd apps/web && npx tsc --noEmit 2>&1) \
  || ERRORS+=("tsc failed in apps/web")

[[ ${#ERRORS[@]} -gt 0 ]] && printf '✗ %s\n' "${ERRORS[@]}" && exit 1
echo "✓ api routes OK"
