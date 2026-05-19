"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AcceptButton({
  bookId,
  userId,
}: {
  bookId: string
  userId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleAccept() {
    startTransition(async () => {
      const res = await fetch(`/api/books/${bookId}/invites/${userId}`, { method: "PATCH" })
      if (res.ok) {
        router.push(`/books/${bookId}`)
      }
    })
  }

  return (
    <button
      onClick={handleAccept}
      disabled={pending}
      className="w-full py-3.5 bg-blue-800 text-white rounded-xl font-semibold text-base
                 cursor-pointer active:opacity-90 transition-opacity disabled:opacity-60
                 min-h-[52px] flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Joining…
        </>
      ) : (
        "Accept invitation"
      )}
    </button>
  )
}
