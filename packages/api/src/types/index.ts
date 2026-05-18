export interface BestPrice {
  unitPrice: string
  unit: string
  brand: string | null
  productName: string
  storeName: string
  observedAt: string
  isOnSale: boolean
}

export interface StoreRef {
  name: string
  location: string | null
}

export interface RecordedByRef {
  name: string | null
}

export interface ObservationWithStore {
  id: string
  genericItemId: string
  storeId: string | null
  storeRaw: string | null
  recordedById: string
  brand: string | null
  productName: string
  barcode: string | null
  totalPrice: string
  quantity: string
  unit: string
  unitPrice: string
  isOnSale: boolean
  notes: string | null
  observedAt: string
  createdAt: string
  store: StoreRef | null
  recordedBy: RecordedByRef
}

export interface ItemDetailResponse {
  id: string
  name: string
  category: string | null
  bestPrice: BestPrice | null
  recentObservations: ObservationWithStore[]
  observationCount: number
}

export interface ObservationsListResponse {
  observations: ObservationWithStore[]
  bestUnitPrice: string | null
}
