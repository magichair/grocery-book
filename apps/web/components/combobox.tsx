"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Plus, Check, Loader2 } from "lucide-react"

export interface ComboboxOption {
  id: string
  name: string
  subtitle?: string
}

interface ComboboxProps {
  id: string
  label: string
  placeholder?: string
  value: ComboboxOption | null
  onChange: (option: ComboboxOption | null) => void
  onFetchOptions: (query: string) => Promise<ComboboxOption[]>
  onCreateOption?: (name: string) => Promise<ComboboxOption>
  required?: boolean
  autoFocus?: boolean
}

export default function Combobox({
  id,
  label,
  placeholder = "Search…",
  value,
  onChange,
  onFetchOptions,
  onCreateOption,
  required,
  autoFocus,
}: ComboboxProps) {
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<ComboboxOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch options when query changes (300ms debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await onFetchOptions(query)
        setOptions(results)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, onFetchOptions])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function handleCreate() {
    if (!onCreateOption || !query.trim()) return
    setCreating(true)
    try {
      const created = await onCreateOption(query.trim())
      onChange(created)
      setQuery("")
      setOpen(false)
    } finally {
      setCreating(false)
    }
  }

  const displayValue = value ? value.name : ""
  const showCreate = onCreateOption && query.trim() && !options.some(
    (o) => o.name.toLowerCase() === query.trim().toLowerCase()
  )

  return (
    <div ref={containerRef} className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {value ? (
        // Selected state — show chip with clear button
        <div className="flex items-center gap-2 px-3 py-2.5 border border-blue-800 rounded-xl
                        bg-blue-50 min-h-[48px]">
          <span className="flex-1 text-sm font-medium text-blue-900 truncate">
            {displayValue}
          </span>
          <button
            type="button"
            onClick={() => { onChange(null); setQuery(""); setTimeout(() => inputRef.current?.focus(), 50) }}
            className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer
                       px-1.5 py-0.5 rounded hover:bg-slate-200 transition-colors shrink-0"
            aria-label={`Clear ${label}`}
          >
            change
          </button>
        </div>
      ) : (
        // Search state
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            id={id}
            type="text"
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-base
                       focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none
                       transition-all duration-150 min-h-[48px]"
          />

          {/* Dropdown */}
          {open && (query || options.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200
                            rounded-xl shadow-lg z-50 overflow-hidden max-h-52 overflow-y-auto">
              {loading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching…
                </div>
              ) : (
                <>
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { onChange(opt); setQuery(""); setOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm
                                 hover:bg-slate-50 cursor-pointer transition-colors min-h-[44px]
                                 border-b border-slate-100 last:border-0"
                    >
                      <Check className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="flex-1 text-slate-900">{opt.name}</span>
                      {opt.subtitle && (
                        <span className="text-[13px] text-slate-400">{opt.subtitle}</span>
                      )}
                    </button>
                  ))}
                  {showCreate && (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={creating}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm
                                 text-blue-800 font-medium hover:bg-blue-50 cursor-pointer
                                 transition-colors min-h-[44px] border-t border-slate-100
                                 disabled:opacity-60"
                    >
                      {creating ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Plus className="w-4 h-4 shrink-0" />
                      )}
                      Add &ldquo;{query.trim()}&rdquo;
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
