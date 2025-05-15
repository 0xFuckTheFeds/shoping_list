import { getFromCache, setInCache, CACHE_KEYS } from "./redis"

// Types for our data
export interface TokenData {
  token: string
  symbol: string
  name: string
  price: number
  marketCap: number
  volume24h: number
  change24h: number
  holders: number
}

export interface MarketStats {
  totalMarketCap: number
  totalVolume24h: number
  totalTransactions: number
  totalTokens: number
  lastUpdated: number
}

// Mock data for development
const mockTokens: TokenData[] = [
  {
    token: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
    symbol: "DASHC",
    name: "Dashcoin",
    price: 0.00000215,
    marketCap: 21500000,
    volume24h: 1500000,
    change24h: 4.2,
    holders: 12500,
  },
  {
    token: "FLWRna1gxehQ9pSyZMzxfp4UhewvLPwuKfdUTgdZuMBY",
    symbol: "FLWR",
    name: "Flower Token",
    price: 0.00000187,
    marketCap: 18700000,
    volume24h: 980000,
    change24h: 3.1,
    holders: 9800,
  },
  // Add more mock tokens as needed
]

const mockMarketStats: MarketStats = {
  totalMarketCap: 142000000,
  totalVolume24h: 8500000,
  totalTransactions: 45000,
  totalTokens: 120,
  lastUpdated: Date.now(),
}

/**
 * Fetch token data with caching
 */
export async function fetchTokens(forceRefresh = false): Promise<TokenData[]> {
  // Check if we should use real API
  const useRealApi = process.env.ENABLE_DUNE_API === "true" && process.env.VERCEL_ENV === "production"

  // If not forcing refresh, try to get from cache first
  if (!forceRefresh) {
    const cachedData = await getFromCache<TokenData[]>(CACHE_KEYS.TOKEN_DATA)
    if (cachedData) {
      console.log("Using cached token data")
      return cachedData
    }
  }

  try {
    let tokens: TokenData[]

    if (useRealApi) {
      // In a real implementation, you would fetch from Dune API here
      console.log("Fetching token data from Dune API")
      // This is a placeholder - replace with actual Dune API call
      tokens = await fetchFromDuneApi()
    } else {
      // Use mock data for development/testing
      console.log("Using mock token data")
      tokens = mockTokens
    }

    // Update cache
    await setInCache(CACHE_KEYS.TOKEN_DATA, tokens)
    await setInCache(CACHE_KEYS.LAST_FETCH_TIME, Date.now())

    return tokens
  } catch (error) {
    console.error("Error fetching token data:", error)

    // Try to use cached data if available
    const cachedData = await getFromCache<TokenData[]>(CACHE_KEYS.TOKEN_DATA)
    if (cachedData) {
      console.log("Using cached token data due to error")
      return cachedData
    }

    // Fall back to mock data if no cache
    return mockTokens
  }
}

/**
 * Fetch market stats with caching
 */
export async function fetchMarketStats(forceRefresh = false): Promise<MarketStats> {
  // Check if we should use real API
  const useRealApi = process.env.ENABLE_DUNE_API === "true" && process.env.VERCEL_ENV === "production"

  // If not forcing refresh, try to get from cache first
  if (!forceRefresh) {
    const cachedData = await getFromCache<MarketStats>(CACHE_KEYS.MARKET_STATS)
    if (cachedData) {
      console.log("Using cached market stats")
      return cachedData
    }
  }

  try {
    let stats: MarketStats

    if (useRealApi) {
      // In a real implementation, you would fetch from Dune API here
      console.log("Fetching market stats from Dune API")
      // This is a placeholder - replace with actual Dune API call
      stats = await fetchMarketStatsFromDuneApi()
    } else {
      // Use mock data for development/testing
      console.log("Using mock market stats")
      stats = {
        ...mockMarketStats,
        lastUpdated: Date.now(),
      }
    }

    // Update cache
    await setInCache(CACHE_KEYS.MARKET_STATS, stats)

    return stats
  } catch (error) {
    console.error("Error fetching market stats:", error)

    // Try to use cached data if available
    const cachedData = await getFromCache<MarketStats>(CACHE_KEYS.MARKET_STATS)
    if (cachedData) {
      console.log("Using cached market stats due to error")
      return cachedData
    }

    // Fall back to mock data if no cache
    return mockMarketStats
  }
}

// Placeholder function - replace with actual Dune API call
async function fetchFromDuneApi(): Promise<TokenData[]> {
  // This would be your actual Dune API implementation
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockTokens), 500)
  })
}

// Placeholder function - replace with actual Dune API call
async function fetchMarketStatsFromDuneApi(): Promise<MarketStats> {
  // This would be your actual Dune API implementation
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...mockMarketStats, lastUpdated: Date.now() }), 500)
  })
}
