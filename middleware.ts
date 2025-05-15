import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Set to true when in maintenance mode, false to disable
const MAINTENANCE_MODE = true

export function middleware(request: NextRequest) {
  // Allow access to the maintenance page itself
  if (request.nextUrl.pathname === "/maintenance") {
    return NextResponse.next()
  }

  // Allow access to static assets
  if (
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname.startsWith("/images/") ||
    request.nextUrl.pathname.includes(".ico")
  ) {
    return NextResponse.next()
  }

  // Redirect all other requests to the maintenance page when in maintenance mode
  if (MAINTENANCE_MODE) {
    return NextResponse.redirect(new URL("/maintenance", request.url))
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
