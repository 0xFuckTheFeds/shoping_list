import { ExternalLink } from "lucide-react"
import Image from "next/image"
import { DashcoinButton } from "@/components/ui/dashcoin-button"
import { DashcoinLogo } from "@/components/dashcoin-logo"
import { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle, DashcoinCardContent } from "@/components/ui/dashcoin-card"
import { ThemeToggle } from "@/components/theme-toggle"
import { MarketCapChart } from "@/components/market-cap-chart"
import { MarketCapPie } from "@/components/market-cap-pie"
import { NewTokensTable } from "@/components/new-tokens-table"
import {
  fetchMarketCapOverTime,
  fetchMarketStats,
  fetchNewTokens,
  fetchPaginatedTokens,
  fetchTokenMarketCaps,
  fetchTotalMarketCap,
} from "./actions/dune-actions"
import { formatCurrency } from "@/lib/utils"
import EnvSetup from "./env-setup"
import { Suspense } from "react"
import TokenTable from "@/components/token-table"

export default async function Home() {
  // Check if DUNE_API_KEY is set
  const hasDuneApiKey = !!process.env.DUNE_API_KEY

  // If no API key, show setup screen
  if (!hasDuneApiKey) {
    return <EnvSetup />
  }

  // Dashcoin contract address
  const dashcoinCA = "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa"
  // Dashcoin trade link
  const dashcoinTradeLink = "https://axiom.trade/meme/Fjq9SmWmtnETAVNbir1eXhrVANi1GDoHEA4nb4tNn7w6/@dashc"

  // Fetch data from Dune
  const marketStatsPromise = fetchMarketStats()
  const tokenDataPromise = fetchPaginatedTokens(1, 10, "marketCap", "desc") // Only fetch first page with 10 tokens
  const marketCapTimeDataPromise = fetchMarketCapOverTime()
  const tokenMarketCapsPromise = fetchTokenMarketCaps()
  const totalMarketCapPromise = fetchTotalMarketCap()
  const newTokensPromise = fetchNewTokens(5) // Get top 5 newest tokens

  // Await the promises we need immediately
  const [marketStats, totalMarketCap] = await Promise.all([marketStatsPromise, totalMarketCapPromise])

  // Format numbers for display
  const formattedMarketCap = formatCurrency(totalMarketCap.total_marketcap_usd || marketStats.totalMarketCap)
  const formattedVolume = formatCurrency(marketStats.volume24h)
  const formattedTransactions = `${(marketStats.transactions24h / 1000).toFixed(2)}K`
  const formattedFeeEarnings = formatCurrency(marketStats.feeEarnings24h)
  const formattedLifetimeVolume = formatCurrency(marketStats.lifetimeVolume)
  const formattedCoinLaunches = marketStats.coinLaunches.toLocaleString()

  return (
    <div className="min-h-screen">
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DashcoinLogo size={48} />
            <a
              href={dashcoinTradeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dashYellow hover:text-dashYellow-dark font-medium dashcoin-text flex items-center"
            >
              TRADE <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
          <div>
            <ThemeToggle />
          </div>
        </div>
        <div className="mt-2 text-center">
          <p className="text-sm font-mono text-dashYellow-light opacity-80">$DASHC CA:{dashcoinCA}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section with Frog Soldiers */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="w-24 h-24 md:w-32 md:h-32 relative">
              <Image
                src="/images/frog-soldier.png"
                alt="Dashcoin Frog Soldier"
                width={128}
                height={128}
                className="object-contain rounded-full overflow-hidden"
                style={{ clipPath: "circle(50%)" }} // This attempts to clip to a circle
              />
            </div>
            <h1 className="dashcoin-title text-5xl md:text-7xl text-dashYellow">DASHCOIN TRACKER</h1>
            <div className="w-24 h-24 md:w-32 md:h-32 relative">
              <Image
                src="/images/frog-soldier.png"
                alt="Dashcoin Frog Soldier"
                width={128}
                height={128}
                className="object-contain scale-x-[-1] rounded-full overflow-hidden"
                style={{ clipPath: "circle(50%)" }} // This attempts to clip to a circle
              />
            </div>
          </div>
          <p className="text-xl max-w-2xl mx-auto">Your Data Buddy for the Believe Coin Trenches</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DashcoinCard className="flex flex-col items-center justify-center py-8">
            <DashcoinCardHeader>
              <DashcoinCardTitle>Total Market Cap</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent className="text-center">
              <p className="dashcoin-text text-4xl text-dashYellow">{formattedMarketCap}</p>
              <p className="text-sm opacity-80 mt-2">
                Last updated: {new Date(totalMarketCap.latest_data_at).toLocaleString()}
              </p>
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard className="flex flex-col items-center justify-center py-8">
            <DashcoinCardHeader>
              <DashcoinCardTitle>Coin Launches</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent className="text-center">
              <p className="dashcoin-text text-4xl text-dashYellow">{formattedCoinLaunches}</p>
              <p className="text-sm opacity-80 mt-2">Total coins tracked</p>
            </DashcoinCardContent>
          </DashcoinCard>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Market Cap</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-3xl text-dashYellow">{formattedMarketCap}</p>
              <div className="mt-2 pt-2 border-t border-dashGreen-light opacity-50">
                <p className="text-sm">From Dune Analytics</p>
              </div>
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>24h Volume</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-3xl text-dashYellow">{formattedVolume}</p>
              <div className="mt-2 pt-2 border-t border-dashGreen-light opacity-50">
                <p className="text-sm">Estimated from market cap</p>
              </div>
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Transactions</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-3xl text-dashYellow">{formattedTransactions}</p>
              <div className="mt-2 pt-2 border-t border-dashGreen-light opacity-50">
                <p className="text-sm">Estimated from market cap</p>
              </div>
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Fee Earnings</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-3xl text-dashYellow">{formattedFeeEarnings}</p>
              <div className="mt-2 pt-2 border-t border-dashGreen-light opacity-50">
                <p className="text-sm">Estimated at 0.3% of volume</p>
              </div>
            </DashcoinCardContent>
          </DashcoinCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Suspense
            fallback={
              <DashcoinCard className="h-80 flex items-center justify-center">
                <p>Loading chart...</p>
              </DashcoinCard>
            }
          >
            <MarketCapChartWrapper marketCapTimeDataPromise={marketCapTimeDataPromise} />
          </Suspense>
          <Suspense
            fallback={
              <DashcoinCard className="h-80 flex items-center justify-center">
                <p>Loading chart...</p>
              </DashcoinCard>
            }
          >
            <MarketCapPieWrapper tokenMarketCapsPromise={tokenMarketCapsPromise} />
          </Suspense>
        </div>

        {/* New Tokens */}
        <div className="mt-8">
          <Suspense
            fallback={
              <DashcoinCard className="h-80 flex items-center justify-center">
                <p>Loading new tokens...</p>
              </DashcoinCard>
            }
          >
            <NewTokensWrapper newTokensPromise={newTokensPromise} />
          </Suspense>
        </div>

        {/* Token Table */}
        <div className="mt-8">
          <h2 className="dashcoin-text text-3xl text-dashYellow mb-4">Top Tokens by Market Cap</h2>
          <Suspense
            fallback={
              <DashcoinCard className="p-8 flex items-center justify-center">
                <p className="text-center">
                  Loading token data... This may take a moment as we fetch data for the top tokens.
                </p>
              </DashcoinCard>
            }
          >
            <TokenTableWrapper tokenDataPromise={tokenDataPromise} />
          </Suspense>
        </div>
      </main>

      <footer className="container mx-auto py-8 px-4 mt-12 border-t border-dashGreen-light">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <DashcoinLogo size={32} />
          <p className="text-sm opacity-80">© 2025 Dashcoin. All rights reserved.</p>
          <div className="flex gap-4">
            <DashcoinButton variant="outline" size="sm">
              Docs
            </DashcoinButton>
            <DashcoinButton variant="outline" size="sm">
              GitHub
            </DashcoinButton>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Wrapper components for async data
async function MarketCapChartWrapper({ marketCapTimeDataPromise }: { marketCapTimeDataPromise: Promise<any> }) {
  const marketCapTimeData = await marketCapTimeDataPromise
  return <MarketCapChart data={marketCapTimeData} />
}

async function MarketCapPieWrapper({ tokenMarketCapsPromise }: { tokenMarketCapsPromise: Promise<any> }) {
  const tokenMarketCaps = await tokenMarketCapsPromise
  return <MarketCapPie data={tokenMarketCaps} />
}

async function NewTokensWrapper({ newTokensPromise }: { newTokensPromise: Promise<any> }) {
  const newTokens = await newTokensPromise
  return <NewTokensTable data={newTokens} />
}

async function TokenTableWrapper({ tokenDataPromise }: { tokenDataPromise: Promise<any> }) {
  const tokenData = await tokenDataPromise
  return <TokenTable data={tokenData} />
}
