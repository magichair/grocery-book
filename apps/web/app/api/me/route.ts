import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@grocery-book/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, createdAt: true },
  })
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(user)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json() as { name?: string }
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: body.name },
    select: { id: true, email: true, name: true },
  })
  return NextResponse.json(user)
}
