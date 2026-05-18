import type { NextAuthConfig } from "next-auth"

// Minimal config used by middleware (Edge Runtime — no Node.js, no Prisma).
// Providers are intentionally absent: the middleware only verifies JWT cookies,
// it never handles email sign-in flows.
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [],
} satisfies NextAuthConfig
