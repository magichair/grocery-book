"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function NewBookPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError("Please enter a name for your price book.")
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        })
        if (!res.ok) {
          setError("Something went wrong. Please try again.")
          return
        }
        const book = await res.json() as { id: string }
        router.push(`/books/${book.id}`)
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <div className="max-w-sm w-full space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-blue-800">Grocery Book</h1>
        <p className="text-sm text-slate-500">Create your first price book to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="book-name" className="text-sm font-medium text-slate-700">
            Book name
          </label>
          <input
            id="book-name"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            placeholder="e.g. Home Essentials"
            className={`w-full px-3 py-3 border rounded-xl text-base
                        focus:outline-none focus:ring-2 transition-all duration-150 min-h-[48px]
                        disabled:opacity-60 disabled:bg-slate-50
                        ${error
                          ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                          : "border-slate-200 focus:border-blue-800 focus:ring-blue-800/20"
                        }`}
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
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
            <><Loader2 className="w-4 h-4 animate-spin" />Creating…</>
          ) : (
            "Create price book"
          )}
        </button>
      </form>
    </div>
  )
}
