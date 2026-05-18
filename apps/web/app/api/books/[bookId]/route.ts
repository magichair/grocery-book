import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

type Ctx = { params: Promise<{ bookId: string }> }

async function getMembership(bookId: string, userId: string) {
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

  const { bookId } = await params
  const membership = await getMembership(bookId, session.user.id)
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      members: {
        where: { acceptedAt: { not: null } },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { invitedAt: "asc" },
      },
    },
  })

  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(book)
}

export async function PATCH(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { bookId } = await params
  const membership = await getMembership(bookId, session.user.id)
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await _req.json() as { name?: string; description?: string; visibility?: string }
  const book = await prisma.book.update({
    where: { id: bookId },
    data: {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.visibility ? { visibility: body.visibility as "PRIVATE" | "INVITE_ONLY" } : {}),
    },
    select: { id: true, name: true, description: true, visibility: true },
  })

  return NextResponse.json(book)
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { bookId } = await params
  const membership = await getMembership(bookId, session.user.id)
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.book.delete({ where: { id: bookId } })
  return NextResponse.json({ deleted: true })
}
