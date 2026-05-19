import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

type Ctx = { params: Promise<{ bookId: string; storeId: string }> }

async function assertMember(bookId: string, userId: string) {
  return prisma.bookMember.findFirst({
    where: { bookId, userId, acceptedAt: { not: null } },
    select: { role: true },
  })
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, storeId } = await params
  if (!(await assertMember(bookId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as { name?: string; location?: string }
  const store = await prisma.store.update({
    where: { id: storeId },
    data: {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.location !== undefined ? { location: body.location?.trim() ?? null } : {}),
    },
    select: { id: true, name: true, location: true },
  })

  return NextResponse.json(store)
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, storeId } = await params
  const membership = await assertMember(bookId, session.user.id)
  if (!membership || membership.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.store.delete({ where: { id: storeId } })
  return NextResponse.json({ deleted: true })
}
