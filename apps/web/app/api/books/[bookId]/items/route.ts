import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

type Ctx = { params: Promise<{ bookId: string }> }

async function assertMember(bookId: string, userId: string) {
  const m = await prisma.bookMember.findFirst({
    where: { bookId, userId, acceptedAt: { not: null } },
    select: { role: true },
  })
  return m
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
  const q = searchParams.get("q")?.trim() ?? ""

  const items = await prisma.genericItem.findMany({
    where: {
      bookId,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { observations: true } },
      // Pull the single cheapest observation for each item
      observations: {
        orderBy: { unitPrice: "asc" },
        take: 1,
        select: { unitPrice: true, unit: true },
      },
    },
  })

  const response = items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    createdAt: item.createdAt,
    observationCount: item._count.observations,
    bestUnitPrice: item.observations[0]?.unitPrice.toString() ?? null,
    bestUnit: item.observations[0]?.unit ?? null,
  }))

  return NextResponse.json(response)
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

  const body = await req.json() as { name?: string; category?: string }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const item = await prisma.genericItem.create({
    data: {
      bookId,
      name: body.name.trim(),
      category: body.category?.trim() ?? null,
    },
    select: {
      id: true,
      name: true,
      category: true,
      createdAt: true,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
