import { type NextRequest, NextResponse } from "next/server"
import { clearCache, CACHE_KEYS } from "@/lib/redis"

const API_SECRET_KEY = process.env.API_SECRET_KEY || "default-secret-key-change-me"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || authHeader !== `Bearer ${API_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const cacheKey = searchParams.get("key")

    if (cacheKey) {
      if (Object.values(CACHE_KEYS).includes(cacheKey)) {
        await clearCache(cacheKey)
        return NextResponse.json({ success: true, message: `Cache cleared for key: ${cacheKey}` })
      } else {
        return NextResponse.json({ error: "Invalid cache key" }, { status: 400 })
      }
    } else {
      await clearCache()
      return NextResponse.json({ success: true, message: "All cache cleared" })
    }
  } catch (error) {
    console.error("Error clearing cache:", error)
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 })
  }
}
