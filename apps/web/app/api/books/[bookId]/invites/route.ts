import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"
import { Resend } from "resend"

type Ctx = { params: Promise<{ bookId: string }> }

async function assertMember(bookId: string, userId: string) {
  return prisma.bookMember.findFirst({
    where: { bookId, userId, acceptedAt: { not: null } },
    select: { role: true },
  })
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId } = await params
  const membership = await assertMember(bookId, session.user.id)
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as { email?: string; role?: string }
  if (!body.email?.trim()) {
    return NextResponse.json({ error: "email is required" }, { status: 400 })
  }

  const email = body.email.trim().toLowerCase()
  const role = body.role === "VIEWER" ? "VIEWER" as const : "EDITOR" as const

  // Look up invitee
  const invitee = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  })
  if (!invitee) {
    return NextResponse.json(
      { error: "No account found for that email. Ask them to sign in to Grocery Book first." },
      { status: 404 }
    )
  }

  // Check not already a member
  const existing = await prisma.bookMember.findFirst({
    where: { bookId, userId: invitee.id },
  })
  if (existing) {
    return NextResponse.json(
      { error: existing.acceptedAt ? "Already a member." : "Already invited." },
      { status: 409 }
    )
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { name: true },
  })
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 })
  }

  // Create pending invite
  const member = await prisma.bookMember.create({
    data: {
      bookId,
      userId: invitee.id,
      role,
      acceptedAt: null,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  // Send notification email (best-effort — don't fail the invite if email fails)
  try {
    const resend = new Resend(process.env.AUTH_RESEND_KEY)
    const inviterName = session.user.name ?? session.user.email ?? "Someone"
    const acceptUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/invites/${bookId}`
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "noreply@example.com",
      to: email,
      subject: `${inviterName} invited you to ${book.name} on Grocery Book`,
      html: `
        <p>Hi${invitee.name ? ` ${invitee.name}` : ""},</p>
        <p><strong>${inviterName}</strong> invited you to join the <strong>${book.name}</strong> price book on Grocery Book.</p>
        <p><a href="${acceptUrl}" style="background:#1E40AF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Accept invitation</a></p>
        <p>Or paste this link: ${acceptUrl}</p>
      `,
    })
  } catch (err) {
    console.error("[invites] email send failed:", err)
  }

  return NextResponse.json(
    {
      userId: member.userId,
      role: member.role,
      invitedAt: member.invitedAt.toISOString(),
      acceptedAt: null,
      user: member.user,
    },
    { status: 201 }
  )
}
