import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@grocery-book/db"
import BookSettingsClient from "./settings-client"
import InstallButton from "./install-button"
import { ChevronLeft, ChevronRight, Users, Store } from "lucide-react"
import Link from "next/link"

type Props = { params: Promise<{ bookId: string }> }

export default async function SettingsPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")
  const { bookId } = await params

  const membership = await prisma.bookMember.findFirst({
    where: { bookId, userId: session.user.id, acceptedAt: { not: null } },
    select: { role: true },
  })
  if (!membership) redirect("/")

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, name: true, description: true, visibility: true },
  })
  if (!book) redirect("/")

  const isOwner = membership.role === "OWNER"

  return (
    <div className="min-h-full pb-8">
      {/* Sub-header */}
      <div className="flex items-center px-4 h-12 border-b border-slate-100 bg-white">
        <Link
          href={`/books/${bookId}`}
          aria-label="Back"
          className="flex items-center justify-center -ml-1 w-9 h-9 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <h2 className="text-base font-semibold text-slate-900 ml-2">Book settings</h2>
      </div>

      {/* Navigation links */}
      <div className="mt-4 bg-white border-y border-slate-100">
        <Link
          href={`/books/${bookId}/settings/members`}
          className="flex items-center px-4 py-3.5 min-h-[52px] border-b border-slate-100 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <Users className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <span className="flex-1 text-sm font-medium text-slate-900">Members</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </Link>
        <Link
          href={`/books/${bookId}/settings/stores`}
          className="flex items-center px-4 py-3.5 min-h-[52px] cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <Store className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <span className="flex-1 text-sm font-medium text-slate-900">Stores</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </Link>
        <InstallButton />
      </div>

      {/* Book name edit and danger zone — client component */}
      <BookSettingsClient book={book} isOwner={isOwner} bookId={bookId} />
    </div>
  )
}
