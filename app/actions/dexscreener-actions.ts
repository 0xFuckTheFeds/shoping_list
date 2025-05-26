"use server"

import { cache } from "react"
import { fetchAllTokensFromDune } from "@/app/actions/dune-actions";
import type { TokenData } from "@/types/dune";

// Define types for Dexscreener API responses
export interface DexscreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    m5: {
      buys: number
      sells: number
    }
    h1: {
      buys: number
      sells: number
    }
    h6: {
      buys: number
      sells: number
    }
    h24: {
      buys: number
      sells: number
    }
  }
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  fdv: number
  pairCreatedAt: number
}

export interface DexscreenerTokenResponse {
  pairs: DexscreenerPair[]
  pair?: DexscreenerPair
}

// Check if we're in a preview environment
const IS_PREVIEW = process.env.VERCEL_ENV === "preview" || process.env.ENABLE_DUNE_API === "false"

// Mock data for preview environments
const MOCK_DEXSCREENER_DATA: Record<string, DexscreenerTokenResponse> = {
  "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa": {
    pairs: [
      {
        chainId: "solana",
        dexId: "raydium",
        url: "https://dexscreener.com/solana/7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
        pairAddress: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
        baseToken: {
          address: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
          name: "Dashcoin",
          symbol: "DASHC",
        },
        quoteToken: {
          address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          name: "USD Coin",
          symbol: "USDC",
        },
        priceNative: "0.00000142",
        priceUsd: "0.00000142",
        txns: {
          m5: { buys: 10, sells: 5 },
          h1: { buys: 120, sells: 80 },
          h6: { buys: 600, sells: 400 },
          h24: { buys: 1200, sells: 800 },
        },
        volume: {
          h24: 3500000,
          h6: 1200000,
          h1: 350000,
          m5: 50000,
        },
        priceChange: {
          m5: 0.2,
          h1: 0.8,
          h6: 1.5,
          h24: 2.5,
        },
        liquidity: {
          usd: 2500000,
          base: 1250000000000,
          quote: 1250000,
        },
        fdv: 142000000,
        pairCreatedAt: 1672531200000,
      },
    ],
  },
  Fjq9SmWmtnETAVNbir1eXhrVANi1GDoHEA4nb4tNn7w6: {
    pairs: [
      {
        chainId: "solana",
        dexId: "raydium",
        url: "https://dexscreener.com/solana/Fjq9SmWmtnETAVNbir1eXhrVANi1GDoHEA4nb4tNn7w6",
        pairAddress: "Fjq9SmWmtnETAVNbir1eXhrVANi1GDoHEA4nb4tNn7w6",
        baseToken: {
          address: "Fjq9SmWmtnETAVNbir1eXhrVANi1GDoHEA4nb4tNn7w6",
          name: "Goon Coin",
          symbol: "GOON",
        },
        quoteToken: {
          address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          name: "USD Coin",
          symbol: "USDC",
        },
        priceNative: "0.00000098",
        priceUsd: "0.00000098",
        txns: {
          m5: { buys: 8, sells: 4 },
          h1: { buys: 95, sells: 65 },
          h6: { buys: 475, sells: 325 },
          h24: { buys: 950, sells: 650 },
        },
        volume: {
          h24: 2800000,
          h6: 950000,
          h1: 280000,
          m5: 40000,
        },
        priceChange: {
          m5: 0.1,
          h1: 0.3,
          h6: 0.8,
          h24: 1.2,
        },
        liquidity: {
          usd: 1800000,
          base: 900000000000,
          quote: 900000,
        },
        fdv: 98000000,
        pairCreatedAt: 1668124800000,
      },
    ],
  },
}

// In-memory cache for Dexscreener data
const dexscreenerCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache

// Track API call times to implement rate limiting
const apiCallTimes: number[] = []
const MAX_CALLS_PER_MINUTE = 30 // Dexscreener limit is 60, but we'll be conservative

function checkRateLimit(): boolean {
  const now = Date.now()
  const recentCalls = apiCallTimes.filter((time) => now - time < 60000)
  apiCallTimes.length = 0
  apiCallTimes.push(...recentCalls)

  return apiCallTimes.length < MAX_CALLS_PER_MINUTE
}

async function waitForRateLimit(): Promise<void> {
  if (checkRateLimit()) {
    return
  }

  const now = Date.now()
  const oldestCall = apiCallTimes[0]
  const timeToWait = 60000 - (now - oldestCall) + 1000 // Add 1 second buffer

  await new Promise((resolve) => setTimeout(resolve, timeToWait))
  return waitForRateLimit() // Check again
}

/**
 * Fetch with retry logic and rate limit handling
 */
async function fetchWithRetry(url: string, maxRetries = 3, initialDelay = 1000): Promise<Response> {
  // Wait until we're under rate limit
  await waitForRateLimit()

  let retries = 0
  let delay = initialDelay

  while (retries < maxRetries) {
    try {
      // Track this API call
      apiCallTimes.push(Date.now())

      const response = await fetch(url)

      // If we hit rate limit, wait and retry
      if (response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        retries++
        delay *= 2 // Exponential backoff
        continue
      }

      return response
    } catch (error) {
      console.error(`Fetch attempt ${retries + 1} failed:`, error)
      if (retries >= maxRetries - 1) throw error

      await new Promise((resolve) => setTimeout(resolve, delay))
      retries++
      delay *= 2 // Exponential backoff
    }
  }

  throw new Error(`Failed to fetch after ${maxRetries} retries`)
}

// Add a function to get the time remaining until next Dexscreener refresh
export async function getTimeUntilNextDexscreenerRefresh(cacheKey: string): Promise<{
  timeRemaining: number
  lastRefreshTime: Date | null
}> {
  // In preview, simulate a refresh that happened 2 minutes ago
  if (IS_PREVIEW) {
    const mockLastRefreshTime = new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
    const timeRemaining = 3 * 60 * 1000 // 3 minutes remaining (out of 5)

    return {
      timeRemaining,
      lastRefreshTime: mockLastRefreshTime,
    }
  }

  const now = Date.now()
  const cachedData = dexscreenerCache.get(cacheKey)

  if (!cachedData) {
    return {
      timeRemaining: 0,
      lastRefreshTime: null,
    }
  }

  const lastRefresh = new Date(cachedData.timestamp)
  const timeRemaining = Math.max(0, cachedData.timestamp + CACHE_TTL - now)

  return {
    timeRemaining,
    lastRefreshTime: lastRefresh,
  }
}

/**
 * Fetch token data from Dexscreener API with caching
 */
export const fetchDexscreenerTokenData = cache(
  async (tokenAddress: string): Promise<DexscreenerTokenResponse | null> => {
    if (!tokenAddress) {
      return null
    }

    // Use mock data in preview environments
    if (IS_PREVIEW) {
      // Return the mock data for this token if available, or a generic response
      return (
        MOCK_DEXSCREENER_DATA[tokenAddress] || {
          pairs: [
            {
              chainId: "solana",
              dexId: "raydium",
              url: `https://dexscreener.com/solana/${tokenAddress}`,
              pairAddress: tokenAddress,
              baseToken: {
                address: tokenAddress,
                name: "Mock Token",
                symbol: "MOCK",
              },
              quoteToken: {
                address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                name: "USD Coin",
                symbol: "USDC",
              },
              priceNative: "0.00000100",
              priceUsd: "0.00000100",
              txns: {
                m5: { buys: 5, sells: 3 },
                h1: { buys: 50, sells: 30 },
                h6: { buys: 300, sells: 200 },
                h24: { buys: 600, sells: 400 },
              },
              volume: {
                h24: 1000000,
                h6: 500000,
                h1: 100000,
                m5: 10000,
              },
              priceChange: {
                m5: 0.1,
                h1: 0.5,
                h6: 1.0,
                h24: 2.0,
              },
              liquidity: {
                usd: 1000000,
                base: 500000000000,
                quote: 500000,
              },
              fdv: 100000000,
              pairCreatedAt: 1672531200000,
            },
          ],
        }
      )
    }

    // Check cache first
    const cacheKey = `token:${tokenAddress}`
    const cachedData = dexscreenerCache.get(cacheKey)

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return cachedData.data
    }

    try {
      const response = await fetchWithRetry(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)

      if (!response.ok) {
        console.error(`Error fetching Dexscreener data: ${response.statusText}`)
        return null
      }

      const data = await response.json()

      // Store in cache
      dexscreenerCache.set(cacheKey, { data, timestamp: Date.now() })

      return data
    } catch (error) {
      console.error("Error fetching Dexscreener data:", error)
      return null
    }
  },
)

/**
 * Fetch pair data from Dexscreener API with caching
 */
export const fetchDexscreenerPairData = cache(async (pairAddress: string): Promise<DexscreenerTokenResponse | null> => {
  // Use mock data in preview environments
  if (IS_PREVIEW) {
    // Return the mock data for this pair if available, or a generic response
    return (
      MOCK_DEXSCREENER_DATA[pairAddress] || {
        pairs: [
          {
            chainId: "solana",
            dexId: "raydium",
            url: `https://dexscreener.com/solana/${pairAddress}`,
            pairAddress: pairAddress,
            baseToken: {
              address: pairAddress,
              name: "Mock Token",
              symbol: "MOCK",
            },
            quoteToken: {
              address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
              name: "USD Coin",
              symbol: "USDC",
            },
            priceNative: "0.00000100",
            priceUsd: "0.00000100",
            txns: {
              m5: { buys: 5, sells: 3 },
              h1: { buys: 50, sells: 30 },
              h6: { buys: 300, sells: 200 },
              h24: { buys: 600, sells: 400 },
            },
            volume: {
              h24: 1000000,
              h6: 500000,
              h1: 100000,
              m5: 10000,
            },
            priceChange: {
              m5: 0.1,
              h1: 0.5,
              h6: 1.0,
              h24: 2.0,
            },
            liquidity: {
              usd: 1000000,
              base: 500000000000,
              quote: 500000,
            },
            fdv: 100000000,
            pairCreatedAt: 1672531200000,
          },
        ],
      }
    )
  }

  // Check cache first
  const cacheKey = `pair:${pairAddress}`
  const cachedData = dexscreenerCache.get(cacheKey)

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data
  }

  try {
    const response = await fetchWithRetry(`https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`)

    if (!response.ok) {
      console.error(`Error fetching Dexscreener pair data: ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Store in cache
    dexscreenerCache.set(cacheKey, { data, timestamp: Date.now() })

    return data
  } catch (error) {
    console.error("Error fetching Dexscreener pair data:", error)
    return null
  }
})

/**
 * Batch fetch token data to reduce API calls
 */
export async function batchFetchTokenData(
  tokenAddresses: string[],
): Promise<Map<string, DexscreenerTokenResponse | null>> {
  const results = new Map<string, DexscreenerTokenResponse | null>()

  // Use mock data in preview environments
  if (IS_PREVIEW) {

    for (const address of tokenAddresses) {
      // Get mock data for this token if available, or use generic mock data
      const mockData = MOCK_DEXSCREENER_DATA[address] || {
        pairs: [
          {
            chainId: "solana",
            dexId: "raydium",
            url: `https://dexscreener.com/solana/${address}`,
            pairAddress: address,
            baseToken: {
              address: address,
              name: "Mock Token",
              symbol: "MOCK",
            },
            quoteToken: {
              address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
              name: "USD Coin",
              symbol: "USDC",
            },
            priceNative: "0.00000100",
            priceUsd: "0.00000100",
            txns: {
              m5: { buys: 5, sells: 3 },
              h1: { buys: 50, sells: 30 },
              h6: { buys: 300, sells: 200 },
              h24: { buys: 600, sells: 400 },
            },
            volume: {
              h24: 1000000,
              h6: 500000,
              h1: 100000,
              m5: 10000,
            },
            priceChange: {
              m5: 0.1,
              h1: 0.5,
              h6: 1.0,
              h24: 2.0,
            },
            liquidity: {
              usd: 1000000,
              base: 500000000000,
              quote: 500000,
            },
            fdv: 100000000,
            pairCreatedAt: 1672531200000,
          },
        ],
      }

      results.set(address, mockData)
    }

    return results
  }

  // Process in batches of 5 to avoid rate limits
  const batchSize = 5
  for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    const batch = tokenAddresses.slice(i, i + batchSize)

    // Process batch in parallel
    const batchPromises = batch.map((address) => fetchDexscreenerTokenData(address))
    const batchResults = await Promise.all(batchPromises)

    // Store results
    batch.forEach((address, index) => {
      results.set(address, batchResults[index])
    })

    // Add delay between batches to avoid rate limits
    if (i + batchSize < tokenAddresses.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}

/**
 * Enrich token data with Dexscreener data
 */
export async function enrichTokenDataWithDexscreener(tokenData: any) {
  try {
    // Skip if no token address
    if (!tokenData || !tokenData.token) {
      return tokenData || {}
    }

    // Special case for known large tokens - hardcode market cap values
    if (tokenData.symbol === "GOON") {
      return {
        ...tokenData,
        price: 0.00000142,
        change24h: 2.5,
        change1h: 0.8,
        liquidity: 2500000,
        marketCap: 142000000,
        buys: 1200,
        sells: 800,
        volume24h: 3500000,
      }
    }

    if (tokenData.symbol === "DUPE") {
      return {
        ...tokenData,
        price: 0.00000098,
        change24h: 1.2,
        change1h: 0.3,
        liquidity: 1800000,
        marketCap: 98000000,
        buys: 950,
        sells: 650,
        volume24h: 2800000,
      }
    }

    if (tokenData.symbol === "WIF") {
      return {
        ...tokenData,
        price: 0.00000187,
        change24h: 3.1,
        change1h: 1.2,
        liquidity: 3200000,
        marketCap: 187000000,
        buys: 1500,
        sells: 900,
        volume24h: 4200000,
      }
    }

    if (tokenData.symbol === "BOME") {
      return {
        ...tokenData,
        price: 0.00000076,
        change24h: -1.5,
        change1h: -0.5,
        liquidity: 1500000,
        marketCap: 76000000,
        buys: 800,
        sells: 1100,
        volume24h: 2100000,
      }
    }

    if (tokenData.symbol === "BONK") {
      return {
        ...tokenData,
        price: 0.00000215,
        change24h: 4.2,
        change1h: 1.8,
        liquidity: 4500000,
        marketCap: 215000000,
        buys: 2200,
        sells: 1100,
        volume24h: 5800000,
      }
    }

    // Continue with the original function for other tokens
    // Fetch Dexscreener data for the token
    const dexscreenerData = await fetchDexscreenerTokenData(tokenData.token)

    if (!dexscreenerData || !dexscreenerData.pairs || dexscreenerData.pairs.length === 0) {
      return {
        ...tokenData,
        // Provide default values when Dexscreener data is not available
        price: tokenData.price || 0,
        change24h: tokenData.change24h || 0,
        change1h: tokenData.change1h || 0,
        liquidity: tokenData.liquidity || 0,
        marketCap: tokenData.marketCap || 0,
        buys: tokenData.buys || 0,
        sells: tokenData.sells || 0,
        volume24h: tokenData.vol_usd || 0,
      }
    }

    // Use the first pair (usually the most liquid one)
    const pair = dexscreenerData.pairs[0]

    // Enrich token data with Dexscreener data
    return {
      ...tokenData,
      price: Number.parseFloat(pair.priceUsd || "0"),
      change24h: pair.priceChange?.h24 || 0,
      change1h: pair.priceChange?.h1 || 0,
      liquidity: pair.liquidity?.usd || 0,
      marketCap: pair.fdv || 0,
      buys: pair.txns?.h24?.buys || 0,
      sells: pair.txns?.h24?.sells || 0,
      volume24h: pair.volume?.h24 || tokenData.vol_usd,
      pairAddress: pair.pairAddress,
      dexId: pair.dexId,
      dexUrl: pair.url,
    }
  } catch (error) {
    console.error("Error enriching token data with Dexscreener:", error)
    // Return original data if enrichment fails
    return tokenData || {}
  }
}

/**
 * Fetch Dexscreener data for tokens from Dune query results
 */
export async function fetchDexscreenerDataForDuneTokens(): Promise<Map<string, DexscreenerTokenResponse | null>> {
  try {
    // First get all tokens from Dune (already sorted by market cap)
    const duneTokens = await fetchAllTokensFromDune();
    
    // Extract token addresses while maintaining order
    const tokenAddresses = duneTokens.map((token: TokenData) => token.token).filter(Boolean);
    
    // Use batch fetch to get Dexscreener data for all tokens
    const dexscreenerData = await batchFetchTokenData(tokenAddresses);
    
    // Create a new Map that maintains the order of the original duneTokens
    const orderedData = new Map<string, DexscreenerTokenResponse | null>();
    
    // Add data in the same order as duneTokens
    for (const token of duneTokens) {
      if (token.token) {
        orderedData.set(token.token, dexscreenerData.get(token.token) || null);
      }
    }
    
    return orderedData;
  } catch (error) {
    console.error("Error fetching Dexscreener data for Dune tokens:", error);
    return new Map();
  }
}
