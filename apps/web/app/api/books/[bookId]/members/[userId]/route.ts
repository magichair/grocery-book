import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

type Ctx = { params: Promise<{ bookId: string; userId: string }> }

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, userId } = await params

  const requesterMembership = await prisma.bookMember.findFirst({
    where: { bookId, userId: session.user.id, acceptedAt: { not: null } },
    select: { role: true },
  })
  if (!requesterMembership || requesterMembership.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden — owners only" }, { status: 403 })
  }

  // Prevent removing the last owner
  if (userId === session.user.id) {
    const ownerCount = await prisma.bookMember.count({
      where: { bookId, role: "OWNER", acceptedAt: { not: null } },
    })
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the only owner. Transfer ownership first." },
        { status: 409 }
      )
    }
  }

  await prisma.bookMember.delete({
    where: { bookId_userId: { bookId, userId } },
  })

  return NextResponse.json({ removed: true })
}
