import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ClaimButton from "./claim-button"

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ClaimPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect("/")

  // Fetch invite info from our own API
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/invites/claim?token=${token}`, {
    cache: "no-store",
  })

  if (!res.ok) {
    const err = await res.json() as { error?: string }
    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-lg font-semibold text-slate-900">Invite unavailable</p>
        <p className="text-sm text-slate-500 mt-2">{err.error ?? "This invite link is invalid or has expired."}</p>
        <a href="/" className="mt-4 text-sm text-blue-800 font-medium cursor-pointer">Go to Grocery Book</a>
      </div>
    )
  }

  const invite = await res.json() as { bookId: string; bookName: string; role: string }
  const session = await auth()

  if (!session) {
    // Not signed in — redirect to sign-in with callback back here
    redirect(`/sign-in?callbackUrl=/invites/claim?token=${token}`)
  }

  const ROLE_LABEL: Record<string, string> = { EDITOR: "Editor", VIEWER: "Viewer", OWNER: "Owner" }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-8 space-y-6 text-center">
        <div>
          <p className="text-sm text-slate-500">You&apos;ve been invited to join</p>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{invite.bookName}</h1>
          <p className="text-sm text-slate-500 mt-1">
            as <strong>{ROLE_LABEL[invite.role] ?? invite.role}</strong>
          </p>
        </div>
        <ClaimButton token={token} bookId={invite.bookId} />
        <p className="text-[13px] text-slate-400">
          Signed in as <strong>{session.user?.email}</strong>
        </p>
      </div>
    </div>
  )
}
