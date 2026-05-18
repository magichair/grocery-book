"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import type { ReactNode } from "react"

interface TopHeaderProps {
  title?: string
  showBack?: boolean
  rightSlot?: ReactNode
}

export default function TopHeader({ title, showBack, rightSlot }: TopHeaderProps) {
  const router = useRouter()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200
                 flex items-center px-4"
    >
      <div className="flex-1 flex items-center">
        {showBack ? (
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex items-center justify-center -ml-1 w-9 h-9 rounded-full
                       hover:bg-slate-100 active:bg-slate-200 transition-colors
                       duration-150 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
        ) : (
          <span className="text-base font-semibold text-blue-800">Grocery Book</span>
        )}
      </div>

      {title && (
        <h1 className="text-base font-semibold text-slate-900 absolute left-1/2 -translate-x-1/2">
          {title}
        </h1>
      )}

      <div className="flex-1 flex justify-end">{rightSlot}</div>
    </header>
  )
}
