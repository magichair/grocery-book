"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBasket, Plus, BookOpen } from "lucide-react"

export default function BottomNav() {
  const pathname = usePathname()

  // Extract bookId from /books/[bookId]/... — segment index 2
  const segments = pathname.split("/")
  const bookId = segments[1] === "books" && segments[2] ? segments[2] : null

  const isItems =
    !!bookId &&
    !pathname.includes("/record") &&
    !pathname.includes("/settings") &&
    !pathname.includes("/items/")

  const isSettings = pathname.includes("/settings")

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-slate-200
                 flex items-center px-2"
      aria-label="Main navigation"
    >
      {/* Items tab */}
      <Link
        href={bookId ? `/books/${bookId}` : "/"}
        className={`flex flex-col items-center justify-center flex-1 gap-1 min-h-[44px]
                    cursor-pointer transition-colors duration-150
                    ${isItems ? "text-blue-800" : "text-slate-400 hover:text-slate-600"}`}
      >
        <ShoppingBasket className="w-5 h-5" />
        <span className="text-[11px] font-medium">Items</span>
      </Link>

      {/* Record tab — elevated FAB */}
      <Link
        href={bookId ? `/books/${bookId}/record` : "/"}
        aria-label="Record a price"
        className="flex items-center justify-center w-14 h-14 -mt-5 rounded-full
                   bg-blue-800 text-white shadow-lg active:scale-95
                   transition-transform duration-150 cursor-pointer mx-2"
      >
        <Plus className="w-7 h-7" />
      </Link>

      {/* Book settings tab */}
      <Link
        href={bookId ? `/books/${bookId}/settings` : "/"}
        className={`flex flex-col items-center justify-center flex-1 gap-1 min-h-[44px]
                    cursor-pointer transition-colors duration-150
                    ${isSettings ? "text-blue-800" : "text-slate-400 hover:text-slate-600"}`}
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-[11px] font-medium">Book</span>
      </Link>
    </nav>
  )
}
