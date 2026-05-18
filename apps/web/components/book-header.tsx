"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import BookSwitcherSheet from "@/components/book-switcher-sheet"

interface BookHeaderProps {
  bookId: string
  bookName: string
  userId: string
}

export default function BookHeader({ bookId, bookName, userId }: BookHeaderProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false)

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200
                   flex items-center px-4"
      >
        <button
          onClick={() => setSwitcherOpen(true)}
          className="flex items-center gap-1 max-w-[220px] cursor-pointer
                     hover:opacity-80 transition-opacity duration-150 min-h-[44px]"
          aria-label="Switch price book"
        >
          <span className="text-base font-semibold text-blue-800 truncate">
            {bookName}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </header>

      <BookSwitcherSheet
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        currentBookId={bookId}
        userId={userId}
      />
    </>
  )
}
