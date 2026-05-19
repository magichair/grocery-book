"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { UserMinus, Plus, Loader2, X } from "lucide-react"

interface Member {
  userId: string
  role: string
  user: { id: string; name: string | null; email: string }
}

interface PendingMember extends Member {
  invitedAt: string
}

interface Props {
  bookId: string
  currentUserId: string
  isOwner: boolean
  active: Member[]
  pending: PendingMember[]
}

interface InviteResponse {
  error?: string
  userId?: string
  user?: Member["user"]
  role?: string
  invitedAt?: string
}

export default function MembersClient({
  bookId,
  currentUserId,
  isOwner,
  active,
  pending,
}: Props) {
  const router = useRouter()
  const [activeMembers, setActiveMembers] = useState(active)
  const [pendingMembers, setPendingMembers] = useState(pending)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("EDITOR")
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviting, startInvite] = useTransition()

  function handleRemove(userId: string) {
    if (!confirm("Remove this member?")) return
    fetch(`/api/books/${bookId}/members/${userId}`, { method: "DELETE" }).then((res) => {
      if (res.ok) {
        setActiveMembers((m) => m.filter((x) => x.userId !== userId))
        router.refresh()
      }
    })
  }

  function handleRevoke(userId: string) {
    fetch(`/api/books/${bookId}/members/${userId}`, { method: "DELETE" }).then((res) => {
      if (res.ok) setPendingMembers((m) => m.filter((x) => x.userId !== userId))
    })
  }

  function handleInvite() {
    setInviteError(null)
    if (!inviteEmail.trim()) return
    startInvite(async () => {
      const res = await fetch(`/api/books/${bookId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = (await res.json()) as InviteResponse
      if (!res.ok) {
        setInviteError(data.error ?? "Something went wrong.")
        return
      }
      setPendingMembers((m) => [
        ...m,
        {
          userId: data.userId!,
          role: data.role!,
          user: data.user!,
          invitedAt: data.invitedAt!,
        },
      ])
      setInviteEmail("")
      setInviteOpen(false)
    })
  }

  const ROLE_LABEL: Record<string, string> = { OWNER: "Owner", EDITOR: "Editor", VIEWER: "Viewer" }

  return (
    <div>
      {/* Active members */}
      <div className="mt-4">
        <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Active ({activeMembers.length})
        </p>
        <div className="bg-white border-y border-slate-100">
          {activeMembers.map((m) => (
            <div
              key={m.userId}
              className="flex items-center px-4 py-3.5 min-h-[52px] border-b border-slate-100"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {m.user.name ?? m.user.email}
                </p>
                {m.user.name && (
                  <p className="text-[13px] text-slate-500 truncate">{m.user.email}</p>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium shrink-0 mr-3">
                {ROLE_LABEL[m.role]}
              </span>
              {isOwner && m.userId !== currentUserId && (
                <button
                  onClick={() => handleRemove(m.userId)}
                  aria-label="Remove member"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {pendingMembers.length > 0 && (
        <div className="mt-4">
          <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pending ({pendingMembers.length})
          </p>
          <div className="bg-white border-y border-slate-100">
            {pendingMembers.map((m) => (
              <div
                key={m.userId}
                className="flex items-center px-4 py-3.5 min-h-[52px] border-b border-slate-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {m.user.name ?? m.user.email}
                  </p>
                  <p className="text-[13px] text-slate-400">Invite sent</p>
                </div>
                <span className="text-xs text-slate-400 font-medium shrink-0 mr-3">
                  {ROLE_LABEL[m.role]}
                </span>
                {isOwner && (
                  <button
                    onClick={() => handleRevoke(m.userId)}
                    aria-label="Revoke invite"
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite button */}
      {isOwner && (
        <div className="px-4 mt-4">
          {!inviteOpen ? (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-blue-800 cursor-pointer hover:opacity-80 transition-opacity min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Invite someone
            </button>
          ) : (
            <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-4">
              <div className="space-y-1">
                <label htmlFor="invite-email" className="text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  autoFocus
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none transition-all duration-150 min-h-[44px]"
                />
              </div>
              <div className="flex gap-2">
                {(["EDITOR", "VIEWER"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors min-h-[36px] ${
                      inviteRole === r
                        ? "bg-blue-800 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {r === "EDITOR" ? "Editor" : "Viewer"}
                  </button>
                ))}
              </div>
              {inviteError && (
                <p className="text-sm text-red-600" role="alert">
                  {inviteError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setInviteOpen(false)
                    setInviteError(null)
                    setInviteEmail("")
                  }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 py-2.5 bg-blue-800 text-white rounded-xl text-sm font-semibold cursor-pointer active:opacity-90 transition-opacity disabled:opacity-60 min-h-[44px] flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send invite"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
