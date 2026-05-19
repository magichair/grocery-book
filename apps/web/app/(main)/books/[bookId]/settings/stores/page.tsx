import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@grocery-book/db"
import StoresClient from "./stores-client"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

type Props = { params: Promise<{ bookId: string }> }

export default async function StoresPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")
  const { bookId } = await params

  const membership = await prisma.bookMember.findFirst({
    where: { bookId, userId: session.user.id, acceptedAt: { not: null } },
    select: { role: true },
  })
  if (!membership) redirect("/")

  const stores = await prisma.store.findMany({
    where: { bookId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, location: true },
  })

  const canEdit = membership.role !== "VIEWER"

  return (
    <div className="min-h-full pb-8">
      <div className="flex items-center px-4 h-12 border-b border-slate-100 bg-white">
        <Link
          href={`/books/${bookId}/settings`}
          aria-label="Back"
          className="flex items-center justify-center -ml-1 w-9 h-9 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <h2 className="text-base font-semibold text-slate-900 ml-2">Stores</h2>
      </div>
      <StoresClient bookId={bookId} initialStores={stores} canEdit={canEdit} />
    </div>
  )
}
