"use client"

import { useState } from "react"
import ObservationRow from "@/components/observation-row"

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

interface Props {
  bookId: string
  currentUserId: string
  initialObservations: Observation[]
}

export default function ItemDetailClient({ bookId, currentUserId, initialObservations }: Props) {
  const [observations, setObservations] = useState(initialObservations)

  function handleDeleted(id: string) {
    setObservations((prev) => prev.filter((o) => o.id !== id))
  }

  return (
    <div>
      {observations.map((obs, i) => (
        <ObservationRow
          key={obs.id}
          observation={obs}
          isBest={i === 0}
          currentUserId={currentUserId}
          bookId={bookId}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  )
}
