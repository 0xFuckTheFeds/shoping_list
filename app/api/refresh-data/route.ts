import { type NextRequest, NextResponse } from "next/server"
import { refreshDuneData } from "@/app/actions/dune-actions"
import { clearCache } from "@/lib/redis"

// This secret key should be set in your environment variables
const API_SECRET_KEY = process.env.API_SECRET_KEY || "default-secret-key-change-me"

export async function GET(request: NextRequest) {
  // Check for secret key to prevent unauthorized refreshes
  const authHeader = request.headers.get("authorization")
  if (!authHeader || authHeader !== `Bearer ${API_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if we should clear the cache first
    const searchParams = request.nextUrl.searchParams
    const clearCacheParam = searchParams.get("clearCache")

    if (clearCacheParam === "true") {
      await clearCache()
    }

    const refreshed = await refreshDuneData()

    if (refreshed) {
      return NextResponse.json({ success: true, message: "Data refreshed successfully" })
    } else {
      return NextResponse.json({ success: false, message: "Refresh skipped or already in progress" })
    }
  } catch (error) {
    console.error("Error refreshing data:", error)
    return NextResponse.json({ error: "Failed to refresh data" }, { status: 500 })
  }
}
