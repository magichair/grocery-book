import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@grocery-book/db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // JWT strategy: session is a signed cookie, not a DB row.
  // This is required because middleware (Edge Runtime) cannot use Prisma
  // to look up database sessions on every request.
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      // Persist the user's DB id into the JWT on first sign-in
      if (user?.id) {
        token.sub = user.id
      }
      return token
    },
    session({ session, token }) {
      // Expose the user id (from JWT sub) on the session object
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
})
