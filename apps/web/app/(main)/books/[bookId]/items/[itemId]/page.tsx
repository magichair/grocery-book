import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@grocery-book/db"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { formatUnitPrice } from "@/lib/format-unit-price"
import ItemDetailClient from "@/components/item-detail-client"

type Props = { params: Promise<{ bookId: string; itemId: string }> }

export default async function ItemDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const { bookId, itemId } = await params

  const item = await prisma.genericItem.findUnique({
    where: { id: itemId },
    include: {
      _count: { select: { observations: true } },
      observations: {
        orderBy: { unitPrice: "asc" },
        include: {
          store: { select: { name: true, location: true } },
          recordedBy: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!item || item.bookId !== bookId) {
    notFound()
  }

  const observations = item.observations.map((o) => ({
    id: o.id,
    genericItemId: o.genericItemId,
    storeId: o.storeId,
    storeRaw: o.storeRaw,
    recordedById: o.recordedById,
    brand: o.brand,
    productName: o.productName,
    barcode: o.barcode,
    totalPrice: o.totalPrice.toString(),
    quantity: o.quantity.toString(),
    unit: o.unit,
    unitPrice: o.unitPrice.toString(),
    isOnSale: o.isOnSale,
    notes: o.notes,
    observedAt: o.observedAt.toISOString(),
    createdAt: o.createdAt.toISOString(),
    store: o.store,
    recordedBy: o.recordedBy,
  }))

  const best = observations[0] ?? null
  const observationCount = item._count.observations

  return (
    <div className="min-h-full">
      {/* Item header */}
      <div className="flex items-center px-4 h-12 border-b border-slate-100">
        <Link
          href={`/books/${bookId}`}
          aria-label="Back to items"
          className="flex items-center justify-center -ml-1 w-9 h-9 rounded-full
                     hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <h2 className="text-base font-semibold text-slate-900 ml-2 flex-1 truncate">
          {item.name}
        </h2>
        <Link
          href={`/books/${bookId}/record?itemId=${item.id}&itemName=${encodeURIComponent(item.name)}`}
          className="text-xs font-semibold text-white bg-blue-800 px-3 py-1.5 rounded-full
                     cursor-pointer hover:bg-blue-700 transition-colors min-h-[32px]
                     flex items-center"
        >
          + Rec
        </Link>
      </div>

      {/* Best price callout */}
      {best ? (
        <div className="px-4 py-5 bg-white border-b border-slate-100 border-l-4 border-l-amber-400">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Best price
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-900 tabular-nums">
              {formatUnitPrice(best.unitPrice, best.unit).split("/")[0]}
            </span>
            <span className="text-lg text-slate-500">/ {best.unit}</span>
          </div>
          <p className="text-sm text-slate-600 mt-1">{best.productName}</p>
          <p className="text-[13px] text-slate-400 mt-0.5">
            {best.store?.name ?? best.storeRaw ?? "Unknown store"} &middot;{" "}
            {new Date(best.observedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      ) : (
        <div className="px-4 py-8 text-center bg-white border-b border-slate-100">
          <p className="text-sm text-slate-400">No prices recorded yet.</p>
          <Link
            href={`/books/${bookId}/record?itemId=${item.id}&itemName=${encodeURIComponent(item.name)}`}
            className="mt-2 inline-block text-sm font-medium text-blue-800 cursor-pointer"
          >
            Record the first price
          </Link>
        </div>
      )}

      {/* Price history */}
      {observations.length > 0 && (
        <>
          <div className="px-4 pt-3 pb-1">
            <p className="text-[13px] font-medium text-slate-500">
              Price history ({observationCount})
            </p>
          </div>
          <ItemDetailClient
            bookId={bookId}
            currentUserId={session.user.id}
            initialObservations={observations}
          />
        </>
      )}
    </div>
  )
}
