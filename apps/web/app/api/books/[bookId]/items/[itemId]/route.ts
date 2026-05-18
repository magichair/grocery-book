import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

type Ctx = { params: Promise<{ bookId: string; itemId: string }> }

async function assertMember(bookId: string, userId: string) {
  return prisma.bookMember.findFirst({
    where: { bookId, userId, acceptedAt: { not: null } },
    select: { role: true },
  })
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, itemId } = await params
  if (!(await assertMember(bookId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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
    return NextResponse.json({ error: "Not found" }, { status: 404 })
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

  return NextResponse.json({
    id: item.id,
    name: item.name,
    category: item.category,
    observationCount: item._count.observations,
    bestPrice: best
      ? {
          unitPrice: best.unitPrice,
          unit: best.unit,
          brand: best.brand,
          productName: best.productName,
          storeName: best.store?.name ?? best.storeRaw ?? "Unknown store",
          observedAt: best.observedAt,
          isOnSale: best.isOnSale,
        }
      : null,
    recentObservations: observations,
  })
}

export async function PATCH(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, itemId } = await params
  if (!(await assertMember(bookId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await _req.json() as { name?: string; category?: string }
  const item = await prisma.genericItem.update({
    where: { id: itemId },
    data: {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.category !== undefined ? { category: body.category?.trim() ?? null } : {}),
    },
    select: { id: true, name: true, category: true },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, itemId } = await params
  if (!(await assertMember(bookId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const count = await prisma.priceObservation.count({ where: { genericItemId: itemId } })
  if (count > 0) {
    return NextResponse.json({ error: "Cannot delete item with observations" }, { status: 409 })
  }
  await prisma.genericItem.delete({ where: { id: itemId } })
  return NextResponse.json({ deleted: true })
}
