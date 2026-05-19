"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface Book {
  id: string
  name: string
  description: string | null
  visibility: string
}

export default function BookSettingsClient({
  book,
  isOwner,
  bookId,
}: {
  book: Book
  isOwner: boolean
  bookId: string
}) {
  const router = useRouter()
  const [name, setName] = useState(book.name)
  const [description, setDescription] = useState(book.description ?? "")
  const [saving, startSave] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleSave() {
    if (!name.trim()) return
    setSaveError(null)
    startSave(async () => {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      })
      if (!res.ok) {
        setSaveError("Failed to save.")
        return
      }
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`Delete "${book.name}"? This cannot be undone.`)) return
    startDelete(async () => {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" })
      if (res.ok) router.push("/")
    })
  }

  return (
    <div className="px-4 space-y-6 mt-6">
      {/* Book name */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Book name</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isOwner}
            className="w-full px-3 py-3 border border-slate-200 rounded-xl text-base focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none transition-all duration-150 min-h-[48px] disabled:opacity-60 disabled:bg-slate-50"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isOwner}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none transition-all duration-150 resize-none disabled:opacity-60 disabled:bg-slate-50"
          />
          {saveError && (
            <p className="text-sm text-red-600" role="alert">
              {saveError}
            </p>
          )}
          {isOwner && (
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-blue-800 text-white text-sm font-medium rounded-lg cursor-pointer active:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2 min-h-[40px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Danger zone — owner only */}
      {isOwner && (
        <div className="border border-red-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-red-600">Danger zone</h3>
          <p className="text-xs text-slate-500">
            Deleting a book removes all items, stores, and price observations permanently.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg cursor-pointer hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-60 min-h-[40px]"
          >
            {deleting ? "Deleting…" : "Delete this book"}
          </button>
        </div>
      )}
    </div>
  )
}
