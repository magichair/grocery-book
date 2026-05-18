"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { formatUnitPrice } from "@/lib/format-unit-price"

interface Observation {
  id: string
  recordedById: string
  brand: string | null
  productName: string
  totalPrice: string
  quantity: string
  unit: string
  unitPrice: string
  isOnSale: boolean
  notes: string | null
  observedAt: string
  store: { name: string; location: string | null } | null
  storeRaw: string | null
  recordedBy: { id: string; name: string | null }
}

interface ObservationRowProps {
  observation: Observation
  isBest: boolean
  currentUserId: string
  bookId: string
  onDeleted: (id: string) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return "Today"
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(!sameYear ? { year: "numeric" } : {}),
  })
}

export default function ObservationRow({
  observation: obs,
  isBest,
  currentUserId,
  bookId,
  onDeleted,
}: ObservationRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const storeName = obs.store?.name ?? obs.storeRaw ?? "Unknown store"
  const isOwn = obs.recordedById === currentUserId

  async function handleDelete() {
    if (!confirm("Delete this observation?")) return
    setDeleting(true)
    try {
      await fetch(`/api/books/${bookId}/observations/${obs.id}`, { method: "DELETE" })
      onDeleted(obs.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="relative border-b border-slate-100">
      {/* Best price indicator */}
      {isBest && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400 rounded-r" />
      )}

      {/* Main row */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center px-4 py-3 min-h-[52px] cursor-pointer
                   hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 text-left"
      >
        <span className="w-20 text-sm font-semibold font-mono tabular-nums text-slate-900 shrink-0">
          {formatUnitPrice(obs.unitPrice, obs.unit)}
        </span>
        <span className="flex-1 text-sm text-slate-600 truncate">{storeName}</span>
        {obs.isOnSale && (
          <span
            className="text-[10px] font-bold text-red-500 border border-red-200
                         rounded px-1.5 py-0.5 mr-2 shrink-0"
          >
            SALE
          </span>
        )}
        <span className="text-[13px] text-slate-400 shrink-0 mr-1">
          {formatDate(obs.observedAt)}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-300 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3 pt-0 bg-slate-50 text-[13px] text-slate-600 space-y-1">
          <p className="font-medium text-slate-800">{obs.productName}</p>
          <p>
            ${parseFloat(obs.totalPrice).toFixed(2)} / {obs.quantity} {obs.unit}
          </p>
          {obs.recordedBy.name && <p>Recorded by {obs.recordedBy.name}</p>}
          {obs.notes && <p className="italic text-slate-500">{obs.notes}</p>}

          {isOwn && (
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-red-500 text-xs font-medium
                           cursor-pointer hover:text-red-700 transition-colors
                           disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
