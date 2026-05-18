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
  && (cd packages/api && npx tsc --noEmit 2>&1) \
  || ERRORS+=("tsc failed in packages/api")

[[ ${#ERRORS[@]} -gt 0 ]] && printf '✗ %s\n' "${ERRORS[@]}" && exit 1
echo "✓ api schemas OK"
