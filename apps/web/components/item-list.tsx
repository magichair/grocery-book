"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus } from "lucide-react"
import ItemRow from "@/components/item-row"
import SkeletonRow from "@/components/skeleton-row"

interface Item {
  id: string
  name: string
  category: string | null
  bestUnitPrice: string | null
  bestUnit: string | null
  observationCount: number
}

interface ItemListProps {
  bookId: string
}

export default function ItemList({ bookId }: ItemListProps) {
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchItems = useCallback(
    async (q: string) => {
      setLoading(true)
      setError(false)
      try {
        const url = `/api/books/${bookId}/items${q ? `?q=${encodeURIComponent(q)}` : ""}`
        const res = await fetch(url)
        if (!res.ok) throw new Error("fetch failed")
        const data = await res.json() as Item[]
        setItems(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    },
    [bookId]
  )

  // Initial load
  useEffect(() => {
    void fetchItems("")
  }, [fetchItems])

  // Debounced search — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchItems(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, fetchItems])

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky search bar */}
      <div className="sticky top-14 z-30 bg-white border-b border-slate-100 px-4 py-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items…"
            aria-label="Search items"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm
                       border-0 focus:ring-2 focus:ring-blue-800/30 focus:bg-white
                       transition-all duration-150 min-h-[44px]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {loading ? (
          // Skeleton rows
          Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
        ) : error ? (
          <div className="flex items-center justify-center py-16 px-4 text-center">
            <p className="text-sm text-slate-400">
              Couldn&apos;t load items. Pull down to retry.
            </p>
          </div>
        ) : items.length === 0 && query ? (
          // No search results
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
            <p className="text-sm text-slate-500">
              No items match &ldquo;{query}&rdquo;
            </p>
            <p className="text-[13px] text-slate-400">
              Tap <span className="font-medium text-blue-800">+</span> to add it and record a price.
            </p>
          </div>
        ) : items.length === 0 ? (
          // Empty book
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">No items yet</p>
              <p className="text-[13px] text-slate-400">
                Tap + to record your first price.
              </p>
            </div>
          </div>
        ) : (
          // Item rows
          items.map((item) => (
            <ItemRow key={item.id} bookId={bookId} item={item} />
          ))
        )}
      </div>
    </div>
  )
}
