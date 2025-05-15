import { ExternalLink, Twitter } from "lucide-react"
import Image from "next/image"
import { DashcoinLogo } from "@/components/dashcoin-logo"
import { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle, DashcoinCardContent } from "@/components/ui/dashcoin-card"
import { ThemeToggle } from "@/components/theme-toggle"
import { MarketCapChart } from "@/components/market-cap-chart"
import { MarketCapPie } from "@/components/market-cap-pie"
import {
  fetchMarketCapOverTime,
  fetchMarketStats,
  fetchPaginatedTokens,
  fetchTokenMarketCaps,
  fetchTotalMarketCap,
} from "./actions/dune-actions"
import { fetchDexscreenerTokenData } from "./actions/dexscreener-actions"
import { formatCurrency } from "@/lib/utils"
import EnvSetup from "./env-setup"
import { Suspense } from "react"
import TokenTable from "@/components/token-table"
import { CopyAddress } from "@/components/copy-address"

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
  // Dashcoin X (Twitter) link
  const dashcoinXLink = "https://x.com/dune_dashcoin"

  // Fetch data from Dune
  const marketStatsPromise = fetchMarketStats()
  const tokenDataPromise = fetchPaginatedTokens(1, 10, "marketCap", "desc") // Only fetch first page with 10 tokens
  const marketCapTimeDataPromise = fetchMarketCapOverTime()
  const tokenMarketCapsPromise = fetchTokenMarketCaps()
  const totalMarketCapPromise = fetchTotalMarketCap()

  // Fetch DASHC data from Dexscreener
  const dexscreenerDataPromise = fetchDexscreenerTokenData(dashcoinCA)

  // Await the promises we need immediately
  const [marketStats, totalMarketCap, dexscreenerData] = await Promise.all([
    marketStatsPromise,
    totalMarketCapPromise,
    dexscreenerDataPromise,
  ])

  // Format numbers for display
  const formattedMarketCap = formatCurrency(totalMarketCap.total_marketcap_usd || marketStats.totalMarketCap)
  const formattedVolume = formatCurrency(marketStats.volume24h)
  const formattedFeeEarnings = formatCurrency(marketStats.feeEarnings24h)
  const formattedCoinLaunches = marketStats.coinLaunches.toLocaleString()

  // Get DASHC token data from Dexscreener
  let dashcPrice = 0
  let dashcMarketCap = 0
  let dashcVolume = 0
  let dashcChange24h = 0
  let dashcLiquidity = 0
  const dashcHolders = 0 // Dexscreener doesn't provide holders count
  let dashcPairAddress = ""
  let lastUpdated = new Date().toLocaleString()

  // Extract data from Dexscreener response if available
  if (dexscreenerData && dexscreenerData.pairs && dexscreenerData.pairs.length > 0) {
    // Use the first pair (usually the most liquid one)
    const pair = dexscreenerData.pairs[0]

    dashcPrice = Number(pair.priceUsd || 0)
    dashcMarketCap = pair.fdv || 0
    dashcVolume = pair.volume?.h24 || 0
    dashcChange24h = pair.priceChange?.h24 || 0
    dashcLiquidity = pair.liquidity?.usd || 0
    dashcPairAddress = pair.pairAddress || ""

    // If we have a timestamp for the data, use it
    if (pair.updatedAt) {
      lastUpdated = new Date(pair.updatedAt).toLocaleString()
    }
  }

  return (
    <div className="min-h-screen">
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <DashcoinLogo size={56} />
            <a
              href={dashcoinTradeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dashYellow hover:text-dashYellow-dark font-medium dashcoin-text flex items-center text-lg"
            >
              SUPPORT THE PAGE <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>
          <div>
            <ThemeToggle />
          </div>
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
          {/* DASHC Token Stats Row */}
          <div className="mt-4 mb-6 py-2 px-4 bg-dashGreen-dark rounded-lg border border-dashBlack flex flex-wrap justify-between items-center gap-2 max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="font-bold text-dashYellow">$DASHC:</span>
              <CopyAddress
                address={dashcoinCA}
                truncate={true}
                displayLength={6}
                className="text-dashYellow-light hover:text-dashYellow"
              />
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <div className="text-center">
                <span className="text-xs opacity-70">Price</span>
                <p className="font-bold">${dashcPrice.toFixed(dashcPrice < 0.01 ? 8 : 6)}</p>
              </div>

              <div className="text-center">
                <span className="text-xs opacity-70">Market Cap</span>
                <p className="font-bold">{formatCurrency(dashcMarketCap)}</p>
              </div>

              <div className="text-center">
                <span className="text-xs opacity-70">24h Volume</span>
                <p className="font-bold">{formatCurrency(dashcVolume)}</p>
              </div>

              <div className="text-center">
                <span className="text-xs opacity-70">24h Change</span>
                <p className={`font-bold ${dashcChange24h >= 0 ? "text-dashGreen-accent" : "text-dashRed"}`}>
                  {dashcChange24h >= 0 ? "+" : ""}
                  {dashcChange24h.toFixed(2)}%
                </p>
              </div>

              <div className="text-center">
                <span className="text-xs opacity-70">Liquidity</span>
                <p className="font-bold">{formatCurrency(dashcLiquidity)}</p>
              </div>
            </div>

            <div>
              <a
                href={dashcoinTradeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-dashYellow text-dashBlack font-medium rounded-md hover:bg-dashYellow-dark transition-colors text-sm flex items-center justify-center border border-dashBlack"
              >
                TRADE
              </a>
            </div>
          </div>
          {/* Last updated info */}
          <div className="mb-4 text-center">
            <p className="text-xs opacity-60">Last updated: {lastUpdated}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <a
            href={dashcoinXLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-dashYellow hover:text-dashYellow-dark transition-colors px-4 py-2 border border-dashYellow rounded-md"
          >
            <Twitter className="h-5 w-5" />
            <span className="dashcoin-text">Follow on X</span>
          </a>
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

async function TokenTableWrapper({ tokenDataPromise }: { tokenDataPromise: Promise<any> }) {
  const tokenData = await tokenDataPromise
  return <TokenTable data={tokenData} />
}
