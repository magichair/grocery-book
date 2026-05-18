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
