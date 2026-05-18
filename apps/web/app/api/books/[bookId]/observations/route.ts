import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

type Ctx = { params: Promise<{ bookId: string }> }

async function assertMember(bookId: string, userId: string) {
  return prisma.bookMember.findFirst({
    where: { bookId, userId, acceptedAt: { not: null } },
    select: { role: true },
  })
}

export async function GET(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId } = await params
  if (!(await assertMember(bookId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get("itemId")
  const best = searchParams.get("best") === "true"
  const storeId = searchParams.get("storeId")
  const barcode = searchParams.get("barcode")
  const since = searchParams.get("since")
  const recordedBy = searchParams.get("recordedBy")

  const where = {
    bookId,
    ...(itemId ? { genericItemId: itemId } : {}),
    ...(storeId ? { storeId } : {}),
    ...(barcode ? { barcode } : {}),
    ...(since ? { observedAt: { gte: new Date(since) } } : {}),
    ...(recordedBy === "me" ? { recordedById: session.user.id } : {}),
  }

  const observations = await prisma.priceObservation.findMany({
    where,
    orderBy: { unitPrice: "asc" },
    include: {
      store: { select: { name: true, location: true } },
      recordedBy: { select: { name: true } },
    },
  })

  // If ?best=true, return only the lowest unit price observation
  const result = best ? observations.slice(0, 1) : observations

  const bestUnitPrice =
    observations.length > 0 ? observations[0].unitPrice.toString() : null

  return NextResponse.json({
    observations: result.map((o) => ({
      ...o,
      totalPrice: o.totalPrice.toString(),
      quantity: o.quantity.toString(),
      unitPrice: o.unitPrice.toString(),
    })),
    bestUnitPrice,
  })
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId } = await params
  if (!(await assertMember(bookId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as {
    genericItemId?: string
    storeId?: string
    storeRaw?: string
    brand?: string
    productName?: string
    barcode?: string
    totalPrice?: number
    quantity?: number
    unit?: string
    isOnSale?: boolean
    notes?: string
    observedAt?: string
  }

  // Validate required fields
  if (!body.genericItemId) {
    return NextResponse.json({ error: "genericItemId is required" }, { status: 400 })
  }
  if (!body.productName?.trim()) {
    return NextResponse.json({ error: "productName is required" }, { status: 400 })
  }
  if (!body.totalPrice || body.totalPrice <= 0) {
    return NextResponse.json({ error: "totalPrice must be positive" }, { status: 400 })
  }
  if (!body.quantity || body.quantity <= 0) {
    return NextResponse.json({ error: "quantity must be positive" }, { status: 400 })
  }
  if (!body.unit?.trim()) {
    return NextResponse.json({ error: "unit is required" }, { status: 400 })
  }

  // Compute unit price
  const unitPriceValue = body.totalPrice / body.quantity
  const unitPriceStr = unitPriceValue.toFixed(10) // enough decimal places for Decimal(10,4)

  // Get previous best price for this item to determine isNewBest
  const previousBest = await prisma.priceObservation.findFirst({
    where: { genericItemId: body.genericItemId, bookId },
    orderBy: { unitPrice: "asc" },
    select: { unitPrice: true },
  })

  const observation = await prisma.priceObservation.create({
    data: {
      bookId,
      genericItemId: body.genericItemId,
      storeId: body.storeId ?? null,
      storeRaw: body.storeRaw ?? null,
      recordedById: session.user.id,
      brand: body.brand?.trim() ?? null,
      productName: body.productName.trim(),
      barcode: body.barcode ?? null,
      totalPrice: body.totalPrice.toString(),
      quantity: body.quantity.toString(),
      unit: body.unit.trim(),
      unitPrice: unitPriceStr,
      isOnSale: body.isOnSale ?? false,
      notes: body.notes?.trim() ?? null,
      observedAt: body.observedAt ? new Date(body.observedAt) : new Date(),
    },
    select: {
      id: true,
      unitPrice: true,
      unit: true,
    },
  })

  const isNewBest =
    !previousBest || unitPriceValue < Number(previousBest.unitPrice.toString())

  return NextResponse.json(
    {
      id: observation.id,
      unitPrice: observation.unitPrice.toString(),
      unit: observation.unit,
      isNewBest,
    },
    { status: 201 }
  )
}
