"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Twitter } from "lucide-react"
import { DashcoinButton } from "@/components/ui/dashcoin-button"
import { DashcoinLogo } from "@/components/dashcoin-logo"
import { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle, DashcoinCardContent } from "@/components/ui/dashcoin-card"
import { ThemeToggle } from "@/components/theme-toggle"
import { DexscreenerChart } from "@/components/dexscreener-chart"
import { fetchTokenDetails, getTimeUntilNextDuneRefresh } from "@/app/actions/dune-actions"
import { fetchDexscreenerTokenData, getTimeUntilNextDexscreenerRefresh } from "@/app/actions/dexscreener-actions"
import { formatCurrency } from "@/lib/utils"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CopyAddress } from "@/components/copy-address"

interface TokenResearchData {
  Symbol: string
  Score: number | string
  "Founder Doxxed": number | string
  "Startup Experience": number | string
  "Successful Exit": number | string
  "Discussed Plans for Token Integration": number | string
  "Project Has Some Virality / Popularity": number | string
  "Live Product Exists": number | string
  Twitter?: string
  [key: string]: any
}

async function fetchTokenResearch(tokenSymbol: string): Promise<TokenResearchData | null> {
  const API_KEY = 'AIzaSyC8QxJez_UTHUJS7vFj1J3Sje0CWS9tXyk';
  const SHEET_ID = '1Nra5QH-JFAsDaTYSyu-KocjbkZ0MATzJ4R-rUt-gLe0';
  const SHEET_NAME = 'Dashcoin Scoring';
  const RANGE = `${SHEET_NAME}!A1:K26`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.values || data.values.length < 2) {
      console.warn('No data found in Google Sheet');
      return null;
    }

    const [header, ...rows] = data.values;
    
    const structured = rows.map((row: any) => {
      const entry: Record<string, any> = {};
      header.forEach((key: string, i: number) => {
        entry[key.trim()] = row[i] || '';
      });
      return entry;
    });

    const normalizedSymbol = tokenSymbol.toUpperCase();
    const tokenData = structured.find((entry: any) => 
      entry['Project'] && 
      entry['Project'].toString().toUpperCase() === normalizedSymbol &&
      entry['Score'] 
    );
    
    return tokenData || null;
  } catch (err) {
    console.error('Google Sheets API error:', err);
    return null;
  }
}

export default function TokenResearchPage({ params }: { params: { symbol: string } }) {

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
  const router = useRouter();
  const [researchData, setResearchData] = useState<TokenResearchData | null>(null);
  const [hasScore, setHasScore] = useState(false);

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
    const getResearchData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTokenResearch(symbol);
        setResearchData(data);
        setHasScore(true);
      } catch (error) {
        console.error(`Error fetching research data for ${symbol}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getResearchData();
  }, [symbol]);

  useEffect(() => {
      async function loadData() {
        try {
          const duneTokenData = await fetchTokenDetails(symbol)
          if (!duneTokenData) {
            notFound()
          }
  
          setTokenData(duneTokenData)

          const duneCache = await getTimeUntilNextDuneRefresh()
          const dexCache = duneTokenData?.token
            ? await getTimeUntilNextDexscreenerRefresh(`token:${duneTokenData.token}`)
            : { timeRemaining: 0, lastRefreshTime: null }
  
          setDuneLastRefresh(duneCache.lastRefreshTime)
          setDuneNextRefresh(new Date(duneCache.lastRefreshTime.getTime() + 1 * 60 * 60 * 1000))
          setDuneTimeRemaining(duneCache.timeRemaining)
  
          if (dexCache.lastRefreshTime) {
            setDexLastRefresh(dexCache.lastRefreshTime)
            setDexNextRefresh(new Date(dexCache.lastRefreshTime.getTime() + 5 * 60 * 1000))
            setDexTimeRemaining(dexCache.timeRemaining)
          }
  
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

    const chartAddress = dexscreenerData?.pairAddress || (tokenData && tokenData.token) || ""
    const price = dexscreenerData?.priceUsd
      ? Number.parseFloat(dexscreenerData.priceUsd)
      : (tokenData && tokenData.price) || 0
    const change24h = dexscreenerData?.priceChange?.h24 || (tokenData && tokenData.change24h) || 0
    const volume24h = dexscreenerData?.volume?.h24 || (tokenData && tokenData.volume24h) || 0
    const liquidity = dexscreenerData?.liquidity?.usd || (tokenData && tokenData.liquidity) || 0
    const txs = dexscreenerData
      ? (dexscreenerData.txns?.h24?.buys || 0) + (dexscreenerData.txns?.h24?.sells || 0)
      : (tokenData && tokenData.txs) || 0
    const buys = dexscreenerData?.txns?.h24?.buys || 0
    const sells = dexscreenerData?.txns?.h24?.sells || 0
    const change1h = dexscreenerData?.priceChange?.h1 || (tokenData && tokenData.change1h) || 0
    const tokenSymbol = tokenData?.symbol || "Unknown"
    const tokenName = tokenData?.name || tokenData?.description || "Unknown Token"
    const tokenAddress = tokenData?.token || ""
    const createdTime = tokenData?.created_time ? new Date(tokenData.created_time).toLocaleDateString() : "Unknown"
    const marketCap = tokenData?.marketCap || 0

  const frameworkCriteria = [
    "Founder Doxxed",
    "Startup Experience",
    "Successful Exit",
    "Discussed Plans for Token Integration",
    "Project Has Some Virality / Popularity",
    "Live Product Exists"
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
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

      {/* Page header */}
      <div className="mb-8">
        <h2 className="flex items-center text-center justify-center dashcoin-text text-5xl text-dashYellow items center mt-8 mb-8">
            "FrameWork Score" table
        </h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-dashYellow" />
            <p className="mt-4 text-dashYellow-light">Loading research data...</p>
          </div>
        </div>
      ) : !hasScore ? (
        <DashcoinCard className="p-8 text-center">
          <h2 className="text-xl font-semibold text-dashYellow">No Research Available</h2>
          <p className="mt-4 text-dashYellow-light">
            Research data is not yet available for {symbol}. Check back later or try another token.
          </p>
        </DashcoinCard>
      ) : (
        <div className="space-y-8">
          {/* Research Score */}
          <DashcoinCard className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-dashYellow mb-4 md:mb-0">Research Score</h2>
              <div className="flex items-center">
                <div className="text-4xl font-bold text-dashYellow">
                  {typeof researchData?.Score === 'string' 
                    ? parseFloat(researchData.Score).toFixed(1) 
                    : researchData?.Score.toFixed(1)}
                </div>
                <div className="text-dashYellow-light ml-3">/ 10.0</div>
              </div>
            </div>
            
            {/* Framework Score Table */}
            <h3 className="text-lg font-medium text-dashYellow mb-4">Framework Criteria</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-dashGreen-card dark:bg-dashGreen-cardDark border-b-2 border-dashBlack">
                    {frameworkCriteria.map((criterion) => (
                      <th key={criterion} className="py-3 px-4 text-dashYellow text-center">
                        {criterion}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-dashGreen-light">
                    {frameworkCriteria.map((criterion) => {
                      const value = researchData?.[criterion];
                      const numValue = typeof value === 'string' ? parseInt(value) : value;
                      
                      return (
                        <td key={criterion} className="py-4 px-4 text-center border-r border-dashGreen-light last:border-r-0">
                          <div className="text-2xl">
                            {numValue === 1 ? (
                              <span className="text-green-500">✅</span>
                            ) : (
                              <span className="text-red-500">❌</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Twitter Button - Only if Twitter handle exists */}
            {researchData?.Twitter && (
              <div className="mt-8 flex justify-end">
                <a
                  href={`${researchData.Twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white px-4 py-2 rounded-md flex items-center transition-colors"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  View on Twitter
                </a>
              </div>
            )}
          </DashcoinCard>
        </div>
      )}

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
  );
}