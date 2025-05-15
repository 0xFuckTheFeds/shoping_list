import { DashcoinLogo } from "@/components/dashcoin-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { CreatorsTable } from "@/components/creators-table"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// Sample data - in a real app, you'd fetch this from your API or Dune
const creators = [
  {
    rank: 1,
    token: "DASHC",
    symbol: "DASHC",
    tokenAddress: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
    xHandle: "@dune_dashcoin",
    marketCap: 1000000,
    volume: 50000,
    launchDate: "2025-05-01",
  },
  // Add more creators as needed
]

export default function CreatorsPage() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <DashcoinLogo size={56} />
          <div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        <Link href="/" className="flex items-center gap-2 text-dashYellow-light hover:text-dashYellow">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="dashcoin-title text-4xl text-dashYellow">Top Creators</h1>
        <p className="opacity-80 max-w-2xl">
          Discover the top creators in the Believe ecosystem and their associated tokens.
        </p>

        <CreatorsTable creators={creators} />
      </main>
    </div>
  )
}
