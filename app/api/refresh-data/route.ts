import { type NextRequest, NextResponse } from "next/server"
import { refreshDuneData } from "@/app/actions/dune-actions"

// This secret key should be set in your environment variables
const API_SECRET_KEY = process.env.API_SECRET_KEY || "default-secret-key-change-me"

export async function GET(request: NextRequest) {
  // Check for secret key to prevent unauthorized refreshes
  const authHeader = request.headers.get("authorization")
  if (!authHeader || authHeader !== `Bearer ${API_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
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
