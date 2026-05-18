import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

type Ctx = { params: Promise<{ bookId: string; id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, id } = await params
  const obs = await prisma.priceObservation.findUnique({
    where: { id },
    include: {
      store: { select: { name: true, location: true } },
      recordedBy: { select: { name: true } },
    },
  })
  if (!obs || obs.bookId !== bookId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({
    ...obs,
    totalPrice: obs.totalPrice.toString(),
    quantity: obs.quantity.toString(),
    unitPrice: obs.unitPrice.toString(),
    observedAt: obs.observedAt.toISOString(),
    createdAt: obs.createdAt.toISOString(),
  })
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, id } = await params
  const obs = await prisma.priceObservation.findUnique({
    where: { id },
    select: { bookId: true, recordedById: true },
  })
  if (!obs || obs.bookId !== bookId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (obs.recordedById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json() as {
    brand?: string; productName?: string; totalPrice?: number
    quantity?: number; unit?: string; isOnSale?: boolean; notes?: string; observedAt?: string
  }
  const updated = await prisma.priceObservation.update({
    where: { id },
    data: {
      ...(body.brand !== undefined ? { brand: body.brand || null } : {}),
      ...(body.productName ? { productName: body.productName } : {}),
      ...(body.isOnSale !== undefined ? { isOnSale: body.isOnSale } : {}),
      ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
      ...(body.observedAt ? { observedAt: new Date(body.observedAt) } : {}),
    },
    select: { id: true, unitPrice: true, unit: true },
  })
  return NextResponse.json({ ...updated, unitPrice: updated.unitPrice.toString() })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, id } = await params
  const obs = await prisma.priceObservation.findUnique({
    where: { id },
    select: { bookId: true, recordedById: true },
  })
  if (!obs || obs.bookId !== bookId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (obs.recordedById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  await prisma.priceObservation.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
