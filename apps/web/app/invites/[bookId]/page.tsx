import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@grocery-book/db"
import AcceptButton from "./accept-button"

type Props = { params: Promise<{ bookId: string }> }

export default async function AcceptInvitePage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    // Not signed in — redirect to sign-in with callbackUrl back here
    const { bookId } = await params
    redirect(`/sign-in?callbackUrl=/invites/${bookId}`)
  }

  const { bookId } = await params

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { name: true },
  })
  if (!book) {
    redirect("/")
  }

  const pendingInvite = await prisma.bookMember.findFirst({
    where: { bookId, userId: session.user.id, acceptedAt: null },
    select: { role: true },
  })

  const alreadyMember = await prisma.bookMember.findFirst({
    where: { bookId, userId: session.user.id, acceptedAt: { not: null } },
  })

  if (alreadyMember) {
    redirect(`/books/${bookId}`)
  }

  if (!pendingInvite) {
    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-lg font-semibold text-slate-900">{book.name}</p>
        <p className="text-sm text-slate-500 mt-2">
          This invite is no longer valid or has already been accepted.
        </p>
        <a href="/" className="mt-4 text-sm text-blue-800 font-medium">
          Go to Grocery Book
        </a>
      </div>
    )
  }

  const ROLE_LABEL: Record<string, string> = { EDITOR: "Editor", VIEWER: "Viewer", OWNER: "Owner" }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-8 space-y-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{book.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            You&apos;ve been invited to join as{" "}
            <strong>{ROLE_LABEL[pendingInvite.role]}</strong>.
          </p>
        </div>
        <AcceptButton bookId={bookId} userId={session.user.id} />
      </div>
    </div>
  )
}
