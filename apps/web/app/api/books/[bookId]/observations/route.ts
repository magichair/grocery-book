import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ bookId: string }> }

export async function GET(req: Request, _ctx: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get("itemId")
  const best = searchParams.get("best")
  const storeId = searchParams.get("storeId")
  const barcode = searchParams.get("barcode")
  const since = searchParams.get("since")
  const recordedBy = searchParams.get("recordedBy")

  return NextResponse.json({
    observations: [],
    bestUnitPrice: null,
    params: { itemId, best, storeId, barcode, since, recordedBy },
  })
}

export async function POST(_req: Request, _ctx: Ctx) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({ id: "stub" }, { status: 201 })
}
