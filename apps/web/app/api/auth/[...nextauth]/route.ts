import { handlers } from "@/auth"
import { type NextRequest } from "next/server"

export async function GET(request: NextRequest): Promise<Response> {
  return handlers.GET(request)
}

export async function POST(request: NextRequest): Promise<Response> {
  return handlers.POST(request)
}
