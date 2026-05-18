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
