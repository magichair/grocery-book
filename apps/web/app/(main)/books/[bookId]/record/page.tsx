"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import Link from "next/link"
import Combobox, { type ComboboxOption } from "@/components/combobox"
import UnitPriceDisplay from "@/components/unit-price-display"
import ConfirmationSheet from "@/components/confirmation-sheet"

const COMMON_UNITS = ["oz", "fl oz", "lb", "kg", "g", "count", "load", "roll", "sq ft", "L", "ml"]

interface SubmitResult {
  id: string
  unitPrice: string
  unit: string
  isNewBest: boolean
}

export default function RecordPage({ params }: { params: Promise<{ bookId: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookId, setBookId] = useState("")

  useEffect(() => {
    params.then(({ bookId }) => setBookId(bookId))
  }, [params])

  // Form state
  const [item, setItem] = useState<ComboboxOption | null>(null)
  const [store, setStore] = useState<ComboboxOption | null>(null)
  const [totalPrice, setTotalPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("oz")
  const [customUnit, setCustomUnit] = useState("")
  const [showCustomUnit, setShowCustomUnit] = useState(false)

  // More details
  const [moreOpen, setMoreOpen] = useState(false)
  const [brand, setBrand] = useState("")
  const [productName, setProductName] = useState("")
  const [isOnSale, setIsOnSale] = useState(false)
  const [observedAt, setObservedAt] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Pre-fill item from ?itemId= param
  useEffect(() => {
    const itemId = searchParams.get("itemId")
    const itemName = searchParams.get("itemName")
    if (itemId && itemName) {
      setItem({ id: itemId, name: itemName })
    }
  }, [searchParams])

  const fetchItems = useCallback(async (q: string): Promise<ComboboxOption[]> => {
    if (!bookId) return []
    const res = await fetch(`/api/books/${bookId}/items${q ? `?q=${encodeURIComponent(q)}` : ""}`)
    if (!res.ok) return []
    const data = await res.json() as Array<{ id: string; name: string; category: string | null }>
    return data.map((d) => ({ id: d.id, name: d.name, subtitle: d.category ?? undefined }))
  }, [bookId])

  const createItem = useCallback(async (name: string): Promise<ComboboxOption> => {
    const res = await fetch(`/api/books/${bookId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await res.json() as { id: string; name: string }
    return { id: data.id, name: data.name }
  }, [bookId])

  const fetchStores = useCallback(async (q: string): Promise<ComboboxOption[]> => {
    if (!bookId) return []
    const res = await fetch(`/api/books/${bookId}/stores`)
    if (!res.ok) return []
    const data = await res.json() as Array<{ id: string; name: string; location: string | null }>
    const filtered = q
      ? data.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
      : data
    return filtered.map((s) => ({ id: s.id, name: s.name, subtitle: s.location ?? undefined }))
  }, [bookId])

  const createStore = useCallback(async (name: string): Promise<ComboboxOption> => {
    const res = await fetch(`/api/books/${bookId}/stores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await res.json() as { id: string; name: string }
    return { id: data.id, name: data.name }
  }, [bookId])

  const activeUnit = showCustomUnit ? customUnit : unit

  async function handleSubmit(e: React.FormEvent | React.MouseEvent) {
    e.preventDefault()
    setError(null)

    if (!item) { setError("Please select an item."); return }
    if (!totalPrice || parseFloat(totalPrice) <= 0) { setError("Enter a valid price."); return }
    if (!quantity || parseFloat(quantity) <= 0) { setError("Enter a valid quantity."); return }
    if (!activeUnit.trim()) { setError("Please select or enter a unit."); return }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/books/${bookId}/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genericItemId: item.id,
          storeId: store?.id ?? undefined,
          brand: brand.trim() || undefined,
          productName: productName.trim() || `${brand.trim() ? brand.trim() + " " : ""}${item.name}`,
          totalPrice: parseFloat(totalPrice),
          quantity: parseFloat(quantity),
          unit: activeUnit.trim(),
          isOnSale,
          notes: notes.trim() || undefined,
          observedAt: new Date(observedAt).toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        setError(err.error ?? "Something went wrong.")
        return
      }
      const data = await res.json() as SubmitResult
      setResult(data)
      setShowConfirmation(true)
    } catch {
      setError("Couldn't save. Check your connection.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleRecordAnother() {
    setShowConfirmation(false)
    setResult(null)
    setTotalPrice("")
    setQuantity("")
    setBrand("")
    setProductName("")
    setIsOnSale(false)
    setNotes("")
    setError(null)
  }

  function handleDone() {
    if (item) {
      router.push(`/books/${bookId}/items/${item.id}`)
    } else {
      router.push(`/books/${bookId}`)
    }
  }

  return (
    <>
      {/* Record page header — overlays the BookHeader from layout */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200
                         flex items-center px-4">
        <Link
          href={`/books/${bookId}`}
          aria-label="Back"
          className="flex items-center justify-center -ml-1 w-9 h-9 rounded-full
                     hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <h1 className="text-base font-semibold text-slate-900 ml-2">Record a price</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="pt-14 pb-32 px-4 space-y-5"
      >
        {/* Item combobox */}
        <Combobox
          id="item"
          label="Item"
          placeholder="Search items…"
          value={item}
          onChange={setItem}
          onFetchOptions={fetchItems}
          onCreateOption={createItem}
          required
          autoFocus
        />

        {/* Store combobox */}
        <Combobox
          id="store"
          label="Store"
          placeholder="Search stores…"
          value={store}
          onChange={setStore}
          onFetchOptions={fetchStores}
          onCreateOption={createStore}
        />

        {/* Price row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="total-price" className="text-sm font-medium text-slate-700">
              Total price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                id="total-price"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="4.99"
                className="w-full pl-7 pr-3 py-3 border border-slate-200 rounded-xl text-base
                           focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none
                           transition-all duration-150 min-h-[48px]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="quantity" className="text-sm font-medium text-slate-700">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              id="quantity"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="w-full px-3 py-3 border border-slate-200 rounded-xl text-base
                         focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none
                         transition-all duration-150 min-h-[48px]"
            />
          </div>
        </div>

        {/* Unit selector */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Unit</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => { setUnit(u); setShowCustomUnit(false) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer
                            transition-colors duration-150 min-h-[36px]
                            ${!showCustomUnit && unit === u
                              ? "bg-blue-800 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
              >
                {u}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCustomUnit(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer
                          transition-colors duration-150 min-h-[36px]
                          ${showCustomUnit
                            ? "bg-blue-800 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
            >
              Other
            </button>
          </div>
          {showCustomUnit && (
            <input
              type="text"
              autoFocus
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="e.g. sheet"
              className="mt-2 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                         focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none
                         transition-all duration-150 min-h-[44px]"
            />
          )}
        </div>

        {/* Live unit price */}
        <UnitPriceDisplay
          totalPrice={totalPrice}
          quantity={quantity}
          unit={activeUnit}
        />

        {/* More details disclosure */}
        <div>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className="flex items-center gap-1 text-sm font-medium text-slate-500
                       cursor-pointer hover:text-slate-700 transition-colors py-1"
          >
            {moreOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            More details
          </button>

          {moreOpen && (
            <div className="mt-3 space-y-4">
              <div className="space-y-1">
                <label htmlFor="brand" className="text-sm font-medium text-slate-700">Brand</label>
                <input
                  id="brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Dawn"
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-base
                             focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none
                             transition-all duration-150 min-h-[48px]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="product-name" className="text-sm font-medium text-slate-700">
                  Product name
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder={brand ? `${brand} ${item?.name ?? ""}` : item?.name ?? ""}
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-base
                             focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none
                             transition-all duration-150 min-h-[48px]"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-slate-700">On sale?</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOnSale}
                  onClick={() => setIsOnSale((s) => !s)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer
                              ${isOnSale ? "bg-blue-800" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                                    transition-transform duration-200
                                    ${isOnSale ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="space-y-1">
                <label htmlFor="observed-at" className="text-sm font-medium text-slate-700">
                  Date observed
                </label>
                <input
                  id="observed-at"
                  type="date"
                  value={observedAt}
                  onChange={(e) => setObservedAt(e.target.value)}
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-base
                             focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none
                             transition-all duration-150 min-h-[48px]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="notes" className="text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes…"
                  rows={2}
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-base
                             focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none
                             transition-all duration-150 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
      </form>

      {/* Fixed submit button above bottom nav */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pt-3 bg-white border-t border-slate-100">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-blue-800 text-white rounded-xl font-semibold text-base
                     cursor-pointer active:opacity-90 transition-opacity
                     disabled:opacity-60 min-h-[52px] flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
          ) : (
            "Record price"
          )}
        </button>
      </div>

      {/* Confirmation sheet */}
      {result && (
        <ConfirmationSheet
          open={showConfirmation}
          itemName={item?.name ?? ""}
          unitPrice={result.unitPrice}
          unit={result.unit}
          isNewBest={result.isNewBest}
          onRecordAnother={handleRecordAnother}
          onDone={handleDone}
        />
      )}
    </>
  )
}
