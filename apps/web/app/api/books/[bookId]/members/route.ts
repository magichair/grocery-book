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

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId } = await params
  if (!(await assertMember(bookId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const members = await prisma.bookMember.findMany({
    where: { bookId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { invitedAt: "asc" },
  })

  return NextResponse.json(
    members.map((m) => ({
      userId: m.userId,
      role: m.role,
      invitedAt: m.invitedAt.toISOString(),
      acceptedAt: m.acceptedAt?.toISOString() ?? null,
      user: m.user,
    }))
  )
}
