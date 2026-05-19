import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

type Ctx = { params: Promise<{ bookId: string; inviteId: string }> }

export async function PATCH(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, inviteId } = await params

  // inviteId is the userId — the accepting user must be the invitee
  if (session.user.id !== inviteId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const pending = await prisma.bookMember.findFirst({
    where: { bookId, userId: inviteId, acceptedAt: null },
  })
  if (!pending) {
    return NextResponse.json({ error: "No pending invite found" }, { status: 404 })
  }

  const member = await prisma.bookMember.update({
    where: { bookId_userId: { bookId, userId: inviteId } },
    data: { acceptedAt: new Date() },
    select: { bookId: true, userId: true, role: true, acceptedAt: true },
  })

  return NextResponse.json({
    ...member,
    acceptedAt: member.acceptedAt?.toISOString() ?? null,
  })
}
