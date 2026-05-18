import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Resend({
      from: process.env.RESEND_FROM ?? "noreply@example.com",
    }),
  ],
})
