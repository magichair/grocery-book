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

  const [members, invites] = await Promise.all([
    prisma.bookMember.findMany({
      where: { bookId, acceptedAt: { not: null } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { invitedAt: "asc" },
    }),
    prisma.bookInvite.findMany({
      where: { bookId, claimedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
    }),
  ])

  return NextResponse.json({
    members: members.map((m) => ({
      userId: m.userId,
      role: m.role,
      acceptedAt: m.acceptedAt!.toISOString(),
      user: m.user,
    })),
    pendingInvites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
    })),
  })
}
