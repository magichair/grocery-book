import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ bookId: string; id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  return NextResponse.json({ id })
}

export async function PATCH(_req: Request, _ctx: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({ updated: true })
}

export async function DELETE(_req: Request, _ctx: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({ deleted: true })
}
