import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@grocery-book/db"
import AccountClient from "./account-client"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  })
  if (!user) redirect("/sign-in")

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center px-4">
        <Link
          href="/"
          aria-label="Back"
          className="flex items-center justify-center -ml-1 w-9 h-9 rounded-full
                     hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <h1 className="text-base font-semibold text-slate-900 ml-2">Account</h1>
      </header>

      <div className="pt-14 pb-8">
        <AccountClient user={user} />
      </div>
    </div>
  )
}
