"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Loader2 } from "lucide-react"

interface User {
  id: string
  name: string | null
  email: string
}

export default function AccountClient({ user }: { user: User }) {
  const router = useRouter()
  const [name, setName] = useState(user.name ?? "")
  const [saving, startSave] = useTransition()
  const [signingOut, startSignOut] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setSaved(false)
    setError(null)
    startSave(async () => {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      })
      if (res.ok) {
        setSaved(true)
        router.refresh()
      } else {
        setError("Failed to save. Please try again.")
      }
    })
  }

  function handleSignOut() {
    startSignOut(async () => {
      await signOut({ callbackUrl: "/sign-in" })
    })
  }

  return (
    <div className="px-4 space-y-6 mt-4">
      {/* Profile section */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Profile</h2>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {/* Name */}
          <div className="px-4 py-3">
            <label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Display name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false) }}
              placeholder="Your name"
              className="mt-1 w-full text-base text-slate-900 bg-transparent border-0
                         focus:outline-none focus:ring-0 p-0 placeholder:text-slate-300"
            />
          </div>

          {/* Email — read-only */}
          <div className="px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Email</p>
            <p className="mt-1 text-base text-slate-900">{user.email}</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || name.trim() === (user.name ?? "")}
          className="w-full py-3 bg-blue-800 text-white rounded-xl font-semibold text-sm
                     cursor-pointer active:opacity-90 transition-opacity disabled:opacity-40
                     min-h-[48px] flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Saving&#8230;</>
          ) : saved ? (
            "Saved ✓"
          ) : (
            "Save name"
          )}
        </button>
      </div>

      {/* Sign out */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Session</h2>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-3 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm
                     cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors
                     min-h-[48px] flex items-center justify-center gap-2"
        >
          {signingOut ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Signing out&#8230;</>
          ) : (
            "Sign out"
          )}
        </button>
      </div>
    </div>
  )
}
