"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, X } from "lucide-react"

interface Book {
  id: string
  name: string
  role: string
}

interface Props {
  open: boolean
  onClose: () => void
  currentBookId: string
  userId: string
}

export default function BookSwitcherSheet({ open, onClose, currentBookId }: Props) {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/books")
      .then((r) => r.json())
      .then((data: Book[]) => {
        setBooks(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [open])

  async function switchBook(bookId: string) {
    // Update lastActiveBookId preference
    await fetch("/api/me/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastActiveBookId: bookId }),
    })
    onClose()
    router.push(`/books/${bookId}`)
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl
                   max-h-[70vh] overflow-y-auto"
        role="dialog"
        aria-label="Switch price book"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 bg-slate-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Your price books</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full
                       hover:bg-slate-100 cursor-pointer transition-colors duration-150"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">Loading…</div>
        ) : (
          <ul className="pb-safe">
            {books.map((book) => (
              <li key={book.id}>
                <button
                  onClick={() => switchBook(book.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                             hover:bg-slate-50 active:bg-slate-100 cursor-pointer
                             transition-colors duration-150 min-h-[52px]"
                >
                  <span className="flex-1 text-sm font-medium text-slate-900 truncate">
                    {book.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium capitalize shrink-0">
                    {book.role.toLowerCase()}
                  </span>
                  {book.id === currentBookId && (
                    <Check className="w-4 h-4 text-blue-800 shrink-0" />
                  )}
                </button>
              </li>
            ))}

            <li className="border-t border-slate-100">
              <button
                onClick={() => { onClose(); router.push("/books/new") }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                           hover:bg-slate-50 cursor-pointer transition-colors duration-150
                           min-h-[52px]"
              >
                <Plus className="w-4 h-4 text-blue-800 shrink-0" />
                <span className="text-sm font-medium text-blue-800">New price book</span>
              </button>
            </li>
          </ul>
        )}
      </div>
    </>
  )
}
