"use client"

import { DashcoinButton } from "@/components/ui/dashcoin-button"
import { DashcoinLogo } from "@/components/dashcoin-logo"
import { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle, DashcoinCardContent } from "@/components/ui/dashcoin-card"
import { ThemeToggle } from "@/components/theme-toggle"
import { DexscreenerChart } from "@/components/dexscreener-chart"
import { fetchTokenDetails, getTimeUntilNextDuneRefresh } from "@/app/actions/dune-actions"
import { fetchDexscreenerTokenData, getTimeUntilNextDexscreenerRefresh } from "@/app/actions/dexscreener-actions"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useState, useEffect } from "react"
import { CopyAddress } from "@/components/copy-address"

export default function TokenPage({ params }: { params: { symbol: string } }) {
  const { symbol } = params
  const [tokenData, setTokenData] = useState<any>(null)
  const [dexscreenerData, setDexscreenerData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [duneLastRefresh, setDuneLastRefresh] = useState<Date | null>(null)
  const [duneNextRefresh, setDuneNextRefresh] = useState<Date | null>(null)
  const [duneTimeRemaining, setDuneTimeRemaining] = useState<number>(0)
  const [dexLastRefresh, setDexLastRefresh] = useState<Date | null>(null)
  const [dexNextRefresh, setDexNextRefresh] = useState<Date | null>(null)
  const [dexTimeRemaining, setDexTimeRemaining] = useState<number>(0)

  // Calculate formatted times and remaining time
  const formattedDuneLastRefresh = duneLastRefresh
    ? duneLastRefresh.toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : "N/A"
  const formattedDuneNextRefresh = duneNextRefresh
    ? duneNextRefresh.toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : "N/A"
  const formattedDexLastRefresh = dexLastRefresh
    ? dexLastRefresh.toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : "N/A"
  const formattedDexNextRefresh = dexNextRefresh
    ? dexNextRefresh.toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : "N/A"

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch token data from Dune

        const duneTokenData = await fetchTokenDetails(symbol)

        if (!duneTokenData) {
          notFound()
        }

        setTokenData(duneTokenData)

        // Get cache information for both data sources
        const duneCache = await getTimeUntilNextDuneRefresh()
        const dexCache = duneTokenData?.token
          ? await getTimeUntilNextDexscreenerRefresh(`token:${duneTokenData.token}`)
          : { timeRemaining: 0, lastRefreshTime: null }

        // Store cache information in state
        setDuneLastRefresh(duneCache.lastRefreshTime)
        setDuneNextRefresh(new Date(duneCache.lastRefreshTime.getTime() + 4 * 60 * 60 * 1000))
        setDuneTimeRemaining(duneCache.timeRemaining)

        if (dexCache.lastRefreshTime) {
          setDexLastRefresh(dexCache.lastRefreshTime)
          setDexNextRefresh(new Date(dexCache.lastRefreshTime.getTime() + 5 * 60 * 1000))
          setDexTimeRemaining(dexCache.timeRemaining)
        }

        // Fetch Dexscreener data
        if (duneTokenData && duneTokenData.token) {
          const dexData = await fetchDexscreenerTokenData(duneTokenData.token)
          if (dexData && dexData.pairs && dexData.pairs.length > 0) {
            setDexscreenerData(dexData.pairs[0])
          }
        }
      } catch (error) {
        console.error("Error loading token data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [symbol])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-dashYellow-light">Loading token data...</p>
      </div>
    )
  }

  if (!tokenData) {
    notFound()
  }

  // Use the pair address if available, otherwise use the token address
  const chartAddress = dexscreenerData?.pairAddress || (tokenData && tokenData.token) || ""

  // Get price from Dexscreener if available
  const price = dexscreenerData?.priceUsd
    ? Number.parseFloat(dexscreenerData.priceUsd)
    : (tokenData && tokenData.price) || 0

  // Get 24h change from Dexscreener if available
  const change24h = dexscreenerData?.priceChange?.h24 || (tokenData && tokenData.change24h) || 0

  // Get volume from Dexscreener if available
  const volume24h = dexscreenerData?.volume?.h24 || (tokenData && tokenData.volume24h) || 0

  // Get liquidity from Dexscreener if available
  const liquidity = dexscreenerData?.liquidity?.usd || (tokenData && tokenData.liquidity) || 0

  // Get transactions from Dexscreener if available
  const txs = dexscreenerData
    ? (dexscreenerData.txns?.h24?.buys || 0) + (dexscreenerData.txns?.h24?.sells || 0)
    : (tokenData && tokenData.txs) || 0

  // Get buys and sells from Dexscreener if available
  const buys = dexscreenerData?.txns?.h24?.buys || 0
  const sells = dexscreenerData?.txns?.h24?.sells || 0

  // Get 1h change from Dexscreener if available
  const change1h = dexscreenerData?.priceChange?.h1 || (tokenData && tokenData.change1h) || 0

  // Safely get token properties
  const tokenSymbol = tokenData?.symbol || "Unknown"
  const tokenName = tokenData?.name || tokenData?.description || "Unknown Token"
  const tokenAddress = tokenData?.token || ""
  const createdTime = tokenData?.created_time ? new Date(tokenData.created_time).toLocaleDateString() : "Unknown"
  const marketCap = tokenData?.marketCap || 0

  return (
    <div className="min-h-screen">
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <DashcoinLogo size={48} />
          <div>
            <ThemeToggle />
          </div>
        </div>
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-sm font-mono text-dashYellow-light opacity-80">$DASHC CA:</span>
            <CopyAddress
              address="7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa"
              showBackground={true}
              className="text-dashYellow-light hover:text-dashYellow"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        <Link href="/" className="flex items-center gap-2 text-dashYellow-light hover:text-dashYellow">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h1 className="dashcoin-title text-4xl text-dashYellow">{tokenSymbol}</h1>
            <p className="opacity-80">{tokenName}</p>
            <p className="text-xs opacity-60 mt-1">Created: {createdTime}</p>
          </div>
          <div className="flex gap-2">
            <a
              href={dexscreenerData?.url || `https://axiom.trade/t/${tokenAddress}/dashc`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dashYellow hover:text-dashYellow-dark font-medium dashcoin-text flex items-center"
            >
              Trade
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Price</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-2xl text-dashYellow">${price.toFixed(price < 0.01 ? 8 : 6)}</p>
              <div className="mt-2 pt-2 border-t border-dashGreen-light opacity-50">
                <p className={`text-sm ${change24h >= 0 ? "text-dashGreen-accent" : "text-dashRed"}`}>
                  {change24h >= 0 ? "↑" : "↓"}
                  {Math.abs(change24h).toFixed(2)}% (24h)
                </p>
              </div>
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Volume (24h)</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-2xl text-dashYellow">${formatCurrency(volume24h)}</p>
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Transactions</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-2xl text-dashYellow">{txs.toLocaleString()}</p>
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Market Cap</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-2xl text-dashYellow">${formatCurrency(marketCap)}</p>
            </DashcoinCardContent>
          </DashcoinCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Trading Activity (24h)</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-80">Buys</p>
                  <p className="text-xl font-bold text-dashGreen-accent">{buys.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Sells</p>
                  <p className="text-xl font-bold text-dashRed">{sells.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Liquidity</p>
                  <p className="text-xl font-bold">${formatCurrency(liquidity)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Price Change (1h)</p>
                  <p className={`text-xl font-bold ${change1h >= 0 ? "text-dashGreen-accent" : "text-dashRed"}`}>
                    {change1h >= 0 ? "+" : ""}
                    {change1h.toFixed(2)}%
                  </p>
                </div>
              </div>
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Token Details</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-80">Contract Address</span>
                  {tokenAddress ? (
                    <CopyAddress
                      address={tokenAddress}
                      showBackground={true}
                      className="text-dashYellow-light hover:text-dashYellow"
                    />
                  ) : (
                    <span className="text-sm">Not available</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-80">Symbol</span>
                  <span className="text-sm">{tokenSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-80">Created</span>
                  <span className="text-sm">{createdTime}</span>
                </div>
                {dexscreenerData?.dexId && (
                  <div className="flex justify-between">
                    <span className="text-sm opacity-80">DEX</span>
                    <span className="text-sm">{dexscreenerData.dexId}</span>
                  </div>
                )}
                {dexscreenerData?.pairAddress && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">Pair Address</span>
                    <CopyAddress
                      address={dexscreenerData.pairAddress}
                      showBackground={true}
                      className="text-dashYellow-light hover:text-dashYellow"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-dashGreen-light">
                <p className="text-xs opacity-70 mb-1">Data Refresh Information:</p>
                <div className="grid grid-cols-2 gap-2 text-xs opacity-70">
                  <div>
                    <p>Dune data last updated:</p>
                    <p className="font-mono">{formattedDuneLastRefresh}</p>
                    <p>Next refresh: {formattedDuneNextRefresh}</p>
                  </div>
                  <div>
                    <p>DEX data last updated:</p>
                    <p className="font-mono">{formattedDexLastRefresh}</p>
                    <p>Next refresh: {formattedDexNextRefresh}</p>
                  </div>
                </div>
              </div>
            </DashcoinCardContent>
          </DashcoinCard>
        </div>

        {/* Dexscreener Chart */}
        {chartAddress && <DexscreenerChart tokenAddress={chartAddress} title="Price Chart" />}
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
