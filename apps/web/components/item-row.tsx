import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { formatUnitPrice } from "@/lib/format-unit-price"

interface ItemRowProps {
  bookId: string
  item: {
    id: string
    name: string
    category: string | null
    bestUnitPrice: string | null
    bestUnit: string | null
    observationCount: number
  }
}

export default function ItemRow({ bookId, item }: ItemRowProps) {
  const priceDisplay =
    item.bestUnitPrice && item.bestUnit
      ? formatUnitPrice(item.bestUnitPrice, item.bestUnit)
      : null

  return (
    <Link
      href={`/books/${bookId}/items/${item.id}`}
      className="flex items-center px-4 py-3 border-b border-slate-100 min-h-[56px]
                 cursor-pointer hover:bg-slate-50 active:bg-slate-100
                 transition-colors duration-150"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
        {item.category && (
          <p className="text-[13px] text-slate-500 truncate">{item.category}</p>
        )}
      </div>
      {priceDisplay ? (
        <span className="ml-3 text-sm font-semibold font-mono tabular-nums text-slate-700 shrink-0">
          {priceDisplay}
        </span>
      ) : (
        <span className="ml-3 text-xs text-slate-400 shrink-0">no prices</span>
      )}
      <ChevronRight className="w-4 h-4 text-slate-300 ml-1 shrink-0" />
    </Link>
  )
}
