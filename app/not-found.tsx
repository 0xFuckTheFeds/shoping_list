import Link from "next/link"
import { DashcoinButton } from "@/components/ui/dashcoin-button"
import { DashcoinLogo } from "@/components/dashcoin-logo"
import { ThemeToggle } from "@/components/theme-toggle"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <DashcoinLogo size={64} className="mb-8" />
      <h1 className="dashcoin-title text-6xl text-dashYellow mb-4">404</h1>
      <h2 className="dashcoin-text text-2xl text-dashYellow-light mb-4">Token Not Found</h2>
      <p className="opacity-80 mb-8 max-w-md">The token you're looking for doesn't exist or has been removed.</p>
      <DashcoinButton asChild>
        <Link href="/">Return to Dashboard</Link>
      </DashcoinButton>
    </div>
  )
}
