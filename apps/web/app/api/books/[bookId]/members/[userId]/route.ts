import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ bookId: string; userId: string }> }

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, userId } = await params
  return NextResponse.json({ bookId, userId, removed: true })
}
