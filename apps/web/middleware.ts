import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

// Instantiate auth from the Edge-safe config only — no Prisma.
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isAuthenticated = !!req.auth
  const { pathname } = req.nextUrl

  const isProtectedPage = pathname.startsWith("/books") || pathname.startsWith("/account")
  const isProtectedApi = pathname.startsWith("/api/books") || pathname.startsWith("/api/me")

  if (!isAuthenticated) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (isProtectedPage) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }
  }
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon\\.ico|sign-in).*)"],
}
