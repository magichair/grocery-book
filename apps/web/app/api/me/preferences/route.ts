import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const prefs = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
    select: { lastActiveBookId: true },
  })
  return NextResponse.json({ lastActiveBookId: prefs?.lastActiveBookId ?? null })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json() as { lastActiveBookId?: string | null }
  const prefs = await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      lastActiveBookId: body.lastActiveBookId ?? null,
    },
    update: {
      lastActiveBookId: body.lastActiveBookId ?? null,
    },
    select: { lastActiveBookId: true },
  })
  return NextResponse.json(prefs)
}
