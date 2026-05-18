import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ bookId: string; inviteId: string }> }

export async function PATCH(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { bookId, inviteId } = await params
  return NextResponse.json({ bookId, inviteId, accepted: true })
}
