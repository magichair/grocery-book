"use client"

import { Star, CheckCircle } from "lucide-react"
import { formatUnitPrice } from "@/lib/format-unit-price"

interface ConfirmationSheetProps {
  open: boolean
  itemName: string
  unitPrice: string
  unit: string
  isNewBest: boolean
  bestPrice?: string | null   // previous best (shown when NOT isNewBest)
  bestStore?: string | null
  onRecordAnother: () => void
  onDone: () => void
}

export default function ConfirmationSheet({
  open,
  itemName,
  unitPrice,
  unit,
  isNewBest,
  bestPrice,
  bestStore,
  onRecordAnother,
  onDone,
}: ConfirmationSheetProps) {
  if (!open) return null

  const formattedNew = formatUnitPrice(unitPrice, unit)
  const formattedBest = bestPrice ? formatUnitPrice(bestPrice, unit) : null

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl px-6 py-6">
        {/* Handle */}
        <div className="w-8 h-1 bg-slate-300 rounded-full mx-auto mb-6" />

        <div className="text-center">
          {isNewBest ? (
            <>
              <Star className="w-10 h-10 text-amber-400 mx-auto mb-3 fill-amber-400" />
              <p className="text-lg font-semibold text-slate-900">New best price!</p>
              <p className="text-sm text-slate-500 mt-1">{itemName}</p>
            </>
          ) : (
            <>
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-slate-900">Recorded</p>
              <p className="text-sm text-slate-500 mt-1">{itemName}</p>
            </>
          )}

          <p className="text-3xl font-bold tabular-nums mt-4">{formattedNew}</p>

          {!isNewBest && formattedBest && (
            <p className="text-sm text-slate-500 mt-2">
              Best is still {formattedBest}
              {bestStore ? ` at ${bestStore}` : ""}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onRecordAnother}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium
                       cursor-pointer hover:bg-slate-50 active:bg-slate-100
                       transition-colors min-h-[44px]"
          >
            Record another
          </button>
          <button
            type="button"
            onClick={onDone}
            className="flex-1 py-3 bg-blue-800 text-white rounded-xl text-sm font-semibold
                       cursor-pointer active:opacity-90 transition-opacity min-h-[44px]"
          >
            Done
          </button>
        </div>
      </div>
    </>
  )
}
