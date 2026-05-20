"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Mail } from "lucide-react"
import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"

function CheckEmailContent() {
  const email = useSearchParams().get("email") ?? ""
  const [seconds, setSeconds] = useState(60)

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  function handleResend() {
    setSeconds(60)
    signIn("resend", { email, redirect: false })
  }

  return (
    <div className="max-w-sm w-full text-center space-y-4">
      <Mail className="w-12 h-12 text-blue-800 mx-auto" />
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Check your inbox</h1>
        <p className="text-sm text-slate-500 mt-1">We sent a sign-in link to</p>
        <p className="text-sm font-medium text-slate-900 mt-0.5">{email}</p>
      </div>
      <div className="text-sm text-slate-400">
        {seconds > 0 ? (
          <span>Resend in 0:{String(seconds).padStart(2, "0")}</span>
        ) : (
          <button
            className="text-blue-800 font-medium cursor-pointer hover:underline"
            onClick={handleResend}
          >
            Resend link
          </button>
        )}
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="w-12 h-12 mx-auto" />}>
      <CheckEmailContent />
    </Suspense>
  )
}
