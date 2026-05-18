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
