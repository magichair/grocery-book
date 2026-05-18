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

if command -v npx &>/dev/null; then
  # Prisma v5 resolves env() in validate; supply a placeholder if DATABASE_URL is not set.
  export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/dev}"
  (cd packages/db && npx prisma validate 2>&1) || ERRORS+=("prisma validate failed")
else
  ERRORS+=("npx not found — cannot run prisma validate")
fi

[[ ${#ERRORS[@]} -gt 0 ]] && printf '✗ %s\n' "${ERRORS[@]}" && exit 1
echo "✓ schema.prisma OK"
