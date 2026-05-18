import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ bookId: string; itemId: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { itemId } = await params
  return NextResponse.json({
    id: itemId,
    name: "stub",
    category: null,
    bestPrice: null,
    recentObservations: [],
    observationCount: 0,
  })
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
