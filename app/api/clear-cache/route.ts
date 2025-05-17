import { type NextRequest, NextResponse } from "next/server"
import { clearCache, CACHE_KEYS } from "@/lib/redis"

// This secret key should be set in your environment variables
const API_SECRET_KEY = process.env.API_SECRET_KEY || "default-secret-key-change-me"

export async function GET(request: NextRequest) {
  // Check for secret key to prevent unauthorized cache clearing
  const authHeader = request.headers.get("authorization")
  if (!authHeader || authHeader !== `Bearer ${API_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get the specific cache key to clear, if provided
    const searchParams = request.nextUrl.searchParams
    const cacheKey = searchParams.get("key")

    if (cacheKey) {
      // Clear specific cache key
      if (Object.values(CACHE_KEYS).includes(cacheKey)) {
        await clearCache(cacheKey)
        return NextResponse.json({ success: true, message: `Cache cleared for key: ${cacheKey}` })
      } else {
        return NextResponse.json({ error: "Invalid cache key" }, { status: 400 })
      }
    } else {
      // Clear all cache
      await clearCache()
      return NextResponse.json({ success: true, message: "All cache cleared" })
    }
  } catch (error) {
    console.error("Error clearing cache:", error)
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 })
  }
}
