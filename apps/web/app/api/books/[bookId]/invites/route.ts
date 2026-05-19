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
  if (!(await assertMember(bookId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as { email?: string; role?: string }
  if (!body.email?.trim()) {
    return NextResponse.json({ error: "email is required" }, { status: 400 })
  }

  const email = body.email.trim().toLowerCase()
  const role = body.role === "VIEWER" ? "VIEWER" as const : "EDITOR" as const

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { name: true },
  })
  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Create the invite token — no user lookup needed
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const invite = await prisma.bookInvite.create({
    data: {
      bookId,
      email,
      role,
      invitedBy: session.user.id,
      expiresAt,
    },
    select: { id: true, token: true, email: true, role: true, expiresAt: true, createdAt: true },
  })

  // Send invite email (best-effort)
  try {
    const resend = new Resend(process.env.AUTH_RESEND_KEY)
    const inviterName = session.user.name ?? session.user.email ?? "Someone"
    const claimUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/invites/claim?token=${invite.token}`
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "noreply@example.com",
      to: email,
      subject: `${inviterName} invited you to ${book.name} on Grocery Book`,
      html: `
        <p>Hi,</p>
        <p><strong>${inviterName}</strong> invited you to join the <strong>${book.name}</strong> price book on Grocery Book.</p>
        <p>You don't need to sign up with this email address — sign in with any email you prefer.</p>
        <p><a href="${claimUrl}" style="background:#1E40AF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Accept invitation</a></p>
        <p>This link expires in 7 days. Or paste: ${claimUrl}</p>
      `,
    })
  } catch (err) {
    console.error("[invites] email send failed:", err)
  }

  return NextResponse.json(invite, { status: 201 })
}
