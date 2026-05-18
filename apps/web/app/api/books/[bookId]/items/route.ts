import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ bookId: string }> }

export async function GET(req: Request, _ctx: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  return NextResponse.json({ items: [], q })
}

export async function POST(_req: Request, _ctx: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({ id: "stub" }, { status: 201 })
}
