import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const memberships = await prisma.bookMember.findMany({
    where: {
      userId: session.user.id,
      acceptedAt: { not: null },
    },
    include: {
      book: {
        select: {
          id: true,
          name: true,
          description: true,
          visibility: true,
          createdAt: true,
          ownerId: true,
        },
      },
    },
    orderBy: { book: { createdAt: "asc" } },
  })

  const books = memberships.map((m) => ({
    ...m.book,
    role: m.role,
  }))

  return NextResponse.json(books)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json() as { name?: string; description?: string; visibility?: string }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const book = await prisma.book.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      visibility: (body.visibility === "PRIVATE" ? "PRIVATE" : "INVITE_ONLY"),
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
          acceptedAt: new Date(),
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      createdAt: true,
      ownerId: true,
    },
  })

  return NextResponse.json(book, { status: 201 })
}
