"use client"

import { useState, useTransition } from "react"
import { Pencil, Trash2, Plus, Check, Loader2 } from "lucide-react"

interface Store {
  id: string
  name: string
  location: string | null
}

export default function StoresClient({
  bookId,
  initialStores,
  canEdit,
}: {
  bookId: string
  initialStores: Store[]
  canEdit: boolean
}) {
  const [stores, setStores] = useState(initialStores)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [saving, startSave] = useTransition()

  function startEdit(store: Store) {
    setEditingId(store.id)
    setEditName(store.name)
    setEditLocation(store.location ?? "")
  }

  function handleSaveEdit(storeId: string) {
    if (!editName.trim()) return
    startSave(async () => {
      const res = await fetch(`/api/books/${bookId}/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), location: editLocation.trim() || null }),
      })
      if (res.ok) {
        const updated = (await res.json()) as Store
        setStores((s) => s.map((x) => (x.id === storeId ? updated : x)))
        setEditingId(null)
      }
    })
  }

  function handleDelete(storeId: string) {
    if (!confirm("Delete this store?")) return
    fetch(`/api/books/${bookId}/stores/${storeId}`, { method: "DELETE" }).then((res) => {
      if (res.ok) setStores((s) => s.filter((x) => x.id !== storeId))
    })
  }

  function handleAdd() {
    if (!newName.trim()) return
    startSave(async () => {
      const res = await fetch(`/api/books/${bookId}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), location: newLocation.trim() || null }),
      })
      if (res.ok) {
        const store = (await res.json()) as Store
        setStores((s) => [...s, store].sort((a, b) => a.name.localeCompare(b.name)))
        setNewName("")
        setNewLocation("")
        setAddOpen(false)
      }
    })
  }

  return (
    <div className="mt-4">
      {stores.length > 0 && (
        <div className="bg-white border-y border-slate-100">
          {stores.map((store) => (
            <div key={store.id} className="border-b border-slate-100">
              {editingId === store.id ? (
                <div className="px-4 py-3 space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-800 focus:outline-none min-h-[40px]"
                  />
                  <input
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Location (optional)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-800 focus:outline-none min-h-[40px]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-2 border border-slate-200 rounded-lg text-sm cursor-pointer hover:bg-slate-50 transition-colors min-h-[40px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(store.id)}
                      disabled={saving}
                      className="flex-1 py-2 bg-blue-800 text-white rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60 min-h-[40px] flex items-center justify-center gap-1"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}{" "}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center px-4 py-3.5 min-h-[52px]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{store.name}</p>
                    {store.location && (
                      <p className="text-[13px] text-slate-500 truncate">{store.location}</p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => startEdit(store)}
                        aria-label="Edit store"
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(store.id)}
                        aria-label="Delete store"
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {stores.length === 0 && !addOpen && (
        <p className="px-4 py-6 text-sm text-slate-400 text-center">No stores added yet.</p>
      )}

      {canEdit && (
        <div className="px-4 mt-4">
          {!addOpen ? (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-blue-800 cursor-pointer hover:opacity-80 transition-opacity min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Add a store
            </button>
          ) : (
            <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-4">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Store name"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-800 focus:outline-none min-h-[44px]"
              />
              <input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Location (optional)"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-800 focus:outline-none min-h-[44px]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setAddOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm cursor-pointer hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !newName.trim()}
                  className="flex-1 py-2.5 bg-blue-800 text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60 min-h-[44px] flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Add store
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
