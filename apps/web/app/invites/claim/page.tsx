import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@grocery-book/db"
import ClaimButton from "./claim-button"

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ClaimPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect("/")

  const invite = await prisma.bookInvite.findUnique({
    where: { token },
    select: {
      role: true,
      claimedAt: true,
      expiresAt: true,
      book: { select: { id: true, name: true } },
    },
  })

  const errorMsg = !invite
    ? "This invite link is invalid."
    : invite.claimedAt
      ? "This invite has already been used."
      : invite.expiresAt < new Date()
        ? "This invite link has expired."
        : null

  if (errorMsg) {
    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-lg font-semibold text-slate-900">Invite unavailable</p>
        <p className="text-sm text-slate-500 mt-2">{errorMsg}</p>
        <a href="/" className="mt-4 text-sm text-blue-800 font-medium cursor-pointer">Go to Grocery Book</a>
      </div>
    )
  }

  const session = await auth()

  if (!session) {
    redirect(`/sign-in?callbackUrl=/invites/claim?token=${token}`)
  }

  const ROLE_LABEL: Record<string, string> = { EDITOR: "Editor", VIEWER: "Viewer", OWNER: "Owner" }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-8 space-y-6 text-center">
        <div>
          <p className="text-sm text-slate-500">You&apos;ve been invited to join</p>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{invite!.book.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            as <strong>{ROLE_LABEL[invite!.role] ?? invite!.role}</strong>
          </p>
        </div>
        <ClaimButton token={token} bookId={invite!.book.id} />
        <p className="text-[13px] text-slate-400">
          Signed in as <strong>{session.user?.email}</strong>
        </p>
      </div>
    </div>
  )
}
