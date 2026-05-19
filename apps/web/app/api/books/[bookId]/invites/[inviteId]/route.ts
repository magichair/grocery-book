import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

type Ctx = { params: Promise<{ bookId: string; inviteId: string }> }

async function assertMember(bookId: string, userId: string) {
  return prisma.bookMember.findFirst({
    where: { bookId, userId, acceptedAt: { not: null } },
    select: { role: true },
  })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, inviteId } = await params
  if (!(await assertMember(bookId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const invite = await prisma.bookInvite.findFirst({
    where: { id: inviteId, bookId },
  })
  if (!invite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.bookInvite.delete({ where: { id: inviteId } })
  return NextResponse.json({ revoked: true })
}
