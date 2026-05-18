import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ bookId: string; storeId: string }> }

export async function PATCH(_req: Request, _ctx: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({ updated: true })
}
