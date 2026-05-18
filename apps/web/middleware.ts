import { auth } from "@/auth"
import { NextResponse } from "next/server"

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
      const signInUrl = new URL("/sign-in", req.url)
      return NextResponse.redirect(signInUrl)
    }
  }
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon\\.ico|sign-in).*)"],
}
