import type { NextAuthConfig } from "next-auth"
import Resend from "next-auth/providers/resend"

// Edge-compatible config — no Prisma, no Node.js-only imports.
// Used by middleware. Full auth.ts extends this with the Prisma adapter.
export const authConfig = {
  providers: [
    Resend({
      from: process.env.RESEND_FROM ?? "noreply@example.com",
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
} satisfies NextAuthConfig
