"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError("Please enter your email address.")
      return
    }

    startTransition(async () => {
      try {
        const result = await signIn("resend", { email, redirect: false })
        if (result?.error) {
          setError("Something went wrong. Please try again.")
          return
        }
        router.push(`/sign-in/check-email?email=${encodeURIComponent(email)}`)
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-8 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-blue-800">Grocery Book</h1>
        <p className="text-sm text-slate-500">Know the best price before you buy.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            className={`w-full px-3 py-3 border rounded-xl text-base
                        focus:outline-none focus:ring-2 transition-all duration-150 min-h-[48px]
                        disabled:opacity-60 disabled:bg-slate-50
                        ${error
                          ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                          : "border-slate-200 focus:border-blue-800 focus:ring-blue-800/20"
                        }`}
          />
          {error && (
            <p className="text-sm text-red-600 mt-1" role="alert">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-blue-800 text-white rounded-xl font-semibold
                     text-base cursor-pointer active:opacity-90 transition-opacity
                     disabled:opacity-60 min-h-[52px] flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending&hellip;
            </>
          ) : (
            "Send sign-in link"
          )}
        </button>
      </form>
    </div>
  )
}
