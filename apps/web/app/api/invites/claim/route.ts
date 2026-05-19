import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

// GET: look up token info (used to render the claim page)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 })
  }

  const invite = await prisma.bookInvite.findUnique({
    where: { token },
    select: {
      id: true,
      role: true,
      claimedAt: true,
      expiresAt: true,
      book: { select: { id: true, name: true } },
    },
  })

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 })
  }
  if (invite.claimedAt) {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 409 })
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite link has expired" }, { status: 410 })
  }

  return NextResponse.json({
    bookId: invite.book.id,
    bookName: invite.book.name,
    role: invite.role,
  })
}

// POST: claim the token — creates BookMember for the authenticated user
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as { token?: string }
  if (!body.token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 })
  }

  const invite = await prisma.bookInvite.findUnique({
    where: { token: body.token },
    select: {
      id: true,
      bookId: true,
      role: true,
      claimedAt: true,
      expiresAt: true,
    },
  })

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 })
  }
  if (invite.claimedAt) {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 409 })
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite link has expired" }, { status: 410 })
  }

  // Check if already a member
  const existing = await prisma.bookMember.findFirst({
    where: { bookId: invite.bookId, userId: session.user.id },
  })
  if (existing) {
    // Already a member (active or from a different invite) — just redirect them
    return NextResponse.json({ bookId: invite.bookId, alreadyMember: true })
  }

  // Create BookMember and mark invite as claimed in a transaction
  await prisma.$transaction([
    prisma.bookMember.create({
      data: {
        bookId: invite.bookId,
        userId: session.user.id,
        role: invite.role,
        acceptedAt: new Date(),
      },
    }),
    prisma.bookInvite.update({
      where: { id: invite.id },
      data: {
        claimedBy: session.user.id,
        claimedAt: new Date(),
      },
    }),
  ])

  return NextResponse.json({ bookId: invite.bookId, alreadyMember: false })
}
