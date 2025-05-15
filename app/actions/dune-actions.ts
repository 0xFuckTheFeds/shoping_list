"use server"

import type {
  DuneExecutionResponse,
  DuneQueryParameter,
  MarketCapTimeData,
  MarketStats,
  NewTokenData,
  TokenData,
  TokenMarketCapData,
  TotalMarketCapData,
  PaginatedTokenResponse,
  VolumeByTokenData,
} from "@/types/dune"

// Check if we're in a preview environment
const IS_PREVIEW = process.env.VERCEL_ENV === "preview" || process.env.ENABLE_DUNE_API === "false"

// Mock data for preview environments
const MOCK_DATA = {
  tokens: [
    {
      token: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
      symbol: "DASHC",
      name: "Dashcoin",
      vol_usd: 3500000,
      txs: 2000,
      created_time: "2023-12-01T00:00:00Z",
      description: "Dashcoin (DASHC)",
      price: 0.00000142,
      marketCap: 142000000,
      num_holders: 12500,
      change24h: 2.5,
      change1h: 0.8,
      liquidity: 2500000,
      buys: 1200,
      sells: 800,
      volume24h: 3500000,
    },
    {
      token: "Fjq9SmWmtnETAVNbir1eXhrVANi1GDoHEA4nb4tNn7w6",
      symbol: "GOON",
      name: "Goon Coin",
      vol_usd: 2800000,
      txs: 1800,
      created_time: "2023-11-15T00:00:00Z",
      description: "Goon Coin (GOON)",
      price: 0.00000098,
      marketCap: 98000000,
      num_holders: 9800,
      change24h: 1.2,
      change1h: 0.3,
      liquidity: 1800000,
      buys: 950,
      sells: 650,
      volume24h: 2800000,
    },
    {
      token: "8JUjWjvdgaP7aLQzU4YQgvFgzxpuEpJhwTCLUdZ9icFw",
      symbol: "WIF",
      name: "Wif Coin",
      vol_usd: 4200000,
      txs: 2400,
      created_time: "2023-10-20T00:00:00Z",
      description: "Wif Coin (WIF)",
      price: 0.00000187,
      marketCap: 187000000,
      num_holders: 15000,
      change24h: 3.1,
      change1h: 1.2,
      liquidity: 3200000,
      buys: 1500,
      sells: 900,
      volume24h: 4200000,
    },
    {
      token: "5tN42n9vMi6ubp67Uy4NnmM5DMZYN8aS8GeB3bEDHr6E",
      symbol: "BOME",
      name: "Bome Token",
      vol_usd: 2100000,
      txs: 1900,
      created_time: "2023-09-05T00:00:00Z",
      description: "Bome Token (BOME)",
      price: 0.00000076,
      marketCap: 76000000,
      num_holders: 7600,
      change24h: -1.5,
      change1h: -0.5,
      liquidity: 1500000,
      buys: 800,
      sells: 1100,
      volume24h: 2100000,
    },
    {
      token: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      symbol: "BONK",
      name: "Bonk",
      vol_usd: 5800000,
      txs: 3300,
      created_time: "2023-08-10T00:00:00Z",
      description: "Bonk (BONK)",
      price: 0.00000215,
      marketCap: 215000000,
      num_holders: 21500,
      change24h: 4.2,
      change1h: 1.8,
      liquidity: 4500000,
      buys: 2200,
      sells: 1100,
      volume24h: 5800000,
    },
    {
      token: "6LUFtdLcK3ce8JZ9WfbDsqNFT7K9yfMQP5hLyJUEi8Vu",
      symbol: "DUPE",
      name: "Dupe Token",
      vol_usd: 1500000,
      txs: 1200,
      created_time: "2023-07-15T00:00:00Z",
      description: "Dupe Token (DUPE)",
      price: 0.00000056,
      marketCap: 56000000,
      num_holders: 5600,
      change24h: -2.3,
      change1h: -0.7,
      liquidity: 1200000,
      buys: 500,
      sells: 700,
      volume24h: 1500000,
    },
    {
      token: "9LYGEEMJAqRSxdKXYBRMXJ4pzoZmTLqnZRF2mCGX8h4W",
      symbol: "PEPE",
      name: "Pepe Coin",
      vol_usd: 3200000,
      txs: 2100,
      created_time: "2023-06-20T00:00:00Z",
      description: "Pepe Coin (PEPE)",
      price: 0.00000123,
      marketCap: 123000000,
      num_holders: 12300,
      change24h: 3.7,
      change1h: 1.5,
      liquidity: 2800000,
      buys: 1300,
      sells: 800,
      volume24h: 3200000,
    },
    {
      token: "3fTR8GGL2mniJP1ycpHgvDz1qhTijKHMmPvDQcHmXYXP",
      symbol: "FROG",
      name: "Frog Token",
      vol_usd: 1800000,
      txs: 1500,
      created_time: "2023-05-10T00:00:00Z",
      description: "Frog Token (FROG)",
      price: 0.00000089,
      marketCap: 89000000,
      num_holders: 8900,
      change24h: 1.9,
      change1h: 0.6,
      liquidity: 1700000,
      buys: 900,
      sells: 600,
      volume24h: 1800000,
    },
    {
      token: "7KVexUFGMpYX8xkQ4K5ZfS1bLzwcwHJQqZMXYWjErG6Z",
      symbol: "MOON",
      name: "Moon Coin",
      vol_usd: 2500000,
      txs: 1700,
      created_time: "2023-04-15T00:00:00Z",
      description: "Moon Coin (MOON)",
      price: 0.00000112,
      marketCap: 112000000,
      num_holders: 11200,
      change24h: 2.8,
      change1h: 1.0,
      liquidity: 2200000,
      buys: 1100,
      sells: 600,
      volume24h: 2500000,
    },
    {
      token: "2QK9vxydd7WoDwvVFT5JSU8cwE9xmbJSzeqbRESiXqNL",
      symbol: "DOGE",
      name: "Doge Token",
      vol_usd: 3800000,
      txs: 2300,
      created_time: "2023-03-20T00:00:00Z",
      description: "Doge Token (DOGE)",
      price: 0.00000167,
      marketCap: 167000000,
      num_holders: 16700,
      change24h: 3.5,
      change1h: 1.3,
      liquidity: 3500000,
      buys: 1400,
      sells: 900,
      volume24h: 3800000,
    },
  ],
  marketCapTimeData: [
    {
      date: "2023-01-01",
      marketcap: 500000000,
      num_holders: 50000,
      nh_diff_1d: 1000,
      nh_diff_7d: 5000,
      nh_diff_30d: 15000,
    },
    {
      date: "2023-02-01",
      marketcap: 550000000,
      num_holders: 55000,
      nh_diff_1d: 1100,
      nh_diff_7d: 5500,
      nh_diff_30d: 16500,
    },
    {
      date: "2023-03-01",
      marketcap: 600000000,
      num_holders: 60000,
      nh_diff_1d: 1200,
      nh_diff_7d: 6000,
      nh_diff_30d: 18000,
    },
    {
      date: "2023-04-01",
      marketcap: 650000000,
      num_holders: 65000,
      nh_diff_1d: 1300,
      nh_diff_7d: 6500,
      nh_diff_30d: 19500,
    },
    {
      date: "2023-05-01",
      marketcap: 700000000,
      num_holders: 70000,
      nh_diff_1d: 1400,
      nh_diff_7d: 7000,
      nh_diff_30d: 21000,
    },
    {
      date: "2023-06-01",
      marketcap: 750000000,
      num_holders: 75000,
      nh_diff_1d: 1500,
      nh_diff_7d: 7500,
      nh_diff_30d: 22500,
    },
    {
      date: "2023-07-01",
      marketcap: 800000000,
      num_holders: 80000,
      nh_diff_1d: 1600,
      nh_diff_7d: 8000,
      nh_diff_30d: 24000,
    },
    {
      date: "2023-08-01",
      marketcap: 850000000,
      num_holders: 85000,
      nh_diff_1d: 1700,
      nh_diff_7d: 8500,
      nh_diff_30d: 25500,
    },
    {
      date: "2023-09-01",
      marketcap: 900000000,
      num_holders: 90000,
      nh_diff_1d: 1800,
      nh_diff_7d: 9000,
      nh_diff_30d: 27000,
    },
    {
      date: "2023-10-01",
      marketcap: 950000000,
      num_holders: 95000,
      nh_diff_1d: 1900,
      nh_diff_7d: 9500,
      nh_diff_30d: 28500,
    },
    {
      date: "2023-11-01",
      marketcap: 1000000000,
      num_holders: 100000,
      nh_diff_1d: 2000,
      nh_diff_7d: 10000,
      nh_diff_30d: 30000,
    },
    {
      date: "2023-12-01",
      marketcap: 1050000000,
      num_holders: 105000,
      nh_diff_1d: 2100,
      nh_diff_7d: 10500,
      nh_diff_30d: 31500,
    },
  ],
  tokenMarketCaps: [
    {
      date: "2023-12-01",
      token_mint_address: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
      name: "Dashcoin",
      symbol: "DASHC",
      market_cap_usd: 142000000,
      num_holders: 12500,
      rn: 1,
    },
    {
      date: "2023-12-01",
      token_mint_address: "Fjq9SmWmtnETAVNbir1eXhrVANi1GDoHEA4nb4tNn7w6",
      name: "Goon Coin",
      symbol: "GOON",
      market_cap_usd: 98000000,
      num_holders: 9800,
      rn: 2,
    },
    {
      date: "2023-12-01",
      token_mint_address: "8JUjWjvdgaP7aLQzU4YQgvFgzxpuEpJhwTCLUdZ9icFw",
      name: "Wif Coin",
      symbol: "WIF",
      market_cap_usd: 187000000,
      num_holders: 15000,
      rn: 3,
    },
    {
      date: "2023-12-01",
      token_mint_address: "5tN42n9vMi6ubp67Uy4NnmM5DMZYN8aS8GeB3bEDHr6E",
      name: "Bome Token",
      symbol: "BOME",
      market_cap_usd: 76000000,
      num_holders: 7600,
      rn: 4,
    },
    {
      date: "2023-12-01",
      token_mint_address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      name: "Bonk",
      symbol: "BONK",
      market_cap_usd: 215000000,
      num_holders: 21500,
      rn: 5,
    },
    {
      date: "2023-12-01",
      token_mint_address: "6LUFtdLcK3ce8JZ9WfbDsqNFT7K9yfMQP5hLyJUEi8Vu",
      name: "Dupe Token",
      symbol: "DUPE",
      market_cap_usd: 56000000,
      num_holders: 5600,
      rn: 6,
    },
    {
      date: "2023-12-01",
      token_mint_address: "9LYGEEMJAqRSxdKXYBRMXJ4pzoZmTLqnZRF2mCGX8h4W",
      name: "Pepe Coin",
      symbol: "PEPE",
      market_cap_usd: 123000000,
      num_holders: 12300,
      rn: 7,
    },
    {
      date: "2023-12-01",
      token_mint_address: "3fTR8GGL2mniJP1ycpHgvDz1qhTijKHMmPvDQcHmXYXP",
      name: "Frog Token",
      symbol: "FROG",
      market_cap_usd: 89000000,
      num_holders: 8900,
      rn: 8,
    },
    {
      date: "2023-12-01",
      token_mint_address: "7KVexUFGMpYX8xkQ4K5ZfS1bLzwcwHJQqZMXYWjErG6Z",
      name: "Moon Coin",
      symbol: "MOON",
      market_cap_usd: 112000000,
      num_holders: 11200,
      rn: 9,
    },
    {
      date: "2023-12-01",
      token_mint_address: "2QK9vxydd7WoDwvVFT5JSU8cwE9xmbJSzeqbRESiXqNL",
      name: "Doge Token",
      symbol: "DOGE",
      market_cap_usd: 167000000,
      num_holders: 16700,
      rn: 10,
    },
  ],
  totalMarketCap: {
    latest_data_at: new Date().toISOString(),
    total_marketcap_usd: 1050000000,
  },
  newTokens: [
    {
      token_mint_address: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
      created_time: "2023-12-01T00:00:00Z",
      name: "Dashcoin",
      symbol: "DASHC",
      market_cap_usd: 142000000,
      num_holders: 12500,
    },
    {
      token_mint_address: "Fjq9SmWmtnETAVNbir1eXhrVANi1GDoHEA4nb4tNn7w6",
      created_time: "2023-11-15T00:00:00Z",
      name: "Goon Coin",
      symbol: "GOON",
      market_cap_usd: 98000000,
      num_holders: 9800,
    },
    {
      token_mint_address: "8JUjWjvdgaP7aLQzU4YQgvFgzxpuEpJhwTCLUdZ9icFw",
      created_time: "2023-10-20T00:00:00Z",
      name: "Wif Coin",
      symbol: "WIF",
      market_cap_usd: 187000000,
      num_holders: 15000,
    },
    {
      token_mint_address: "5tN42n9vMi6ubp67Uy4NnmM5DMZYN8aS8GeB3bEDHr6E",
      created_time: "2023-09-05T00:00:00Z",
      name: "Bome Token",
      symbol: "BOME",
      market_cap_usd: 76000000,
      num_holders: 7600,
    },
    {
      token_mint_address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      created_time: "2023-08-10T00:00:00Z",
      name: "Bonk",
      symbol: "BONK",
      market_cap_usd: 215000000,
      num_holders: 21500,
    },
  ],
  marketStats: {
    totalMarketCap: 1050000000,
    volume24h: 25000000,
    transactions24h: 18000,
    feeEarnings24h: 75000,
    lifetimeVolume: 750000000,
    coinLaunches: 10,
  },
}

// This is your Dune API key from environment variables
const DUNE_API_KEY = process.env.DUNE_API_KEY

// In-memory cache for token data to avoid refetching from Dune
let allTokensCache: TokenData[] | null = null
let volumeTokensCache: VolumeByTokenData[] | null = null
let lastFetchTime = 0
let lastVolumeFetchTime = 0
const CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 hours

/**
 * Fetch results directly from a Dune query using the results endpoint
 */
async function fetchDuneQueryResults(queryId: number, limit = 1000) {
  if (!DUNE_API_KEY) {
    throw new Error("DUNE_API_KEY is not set")
  }

  try {
    const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results?limit=${limit}`, {
      headers: {
        "X-Dune-API-Key": DUNE_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch query results: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error fetching Dune query results:", error)
    throw error
  }
}

/**
 * Execute a Dune query and return the results
 */
async function executeDuneQuery(queryId: number, parameters: DuneQueryParameter[] = []) {
  if (!DUNE_API_KEY) {
    throw new Error("DUNE_API_KEY is not set")
  }

  try {
    // Step 1: Execute the query
    const executeResponse = await fetch(`https://api.dune.com/api/v1/query/${queryId}/execute`, {
      method: "POST",
      headers: {
        "X-Dune-API-Key": DUNE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ parameters }),
    })

    if (!executeResponse.ok) {
      throw new Error(`Failed to execute query: ${executeResponse.statusText}`)
    }

    const executeData = await executeResponse.json()
    const executionId = executeData.execution_id

    // Step 2: Poll for results
    let executionStatus: DuneExecutionResponse
    let attempts = 0
    const maxAttempts = 10

    do {
      // Wait a bit between polling attempts
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const statusResponse = await fetch(`https://api.dune.com/api/v1/execution/${executionId}/status`, {
        headers: {
          "X-Dune-API-Key": DUNE_API_KEY,
        },
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to get execution status: ${statusResponse.statusText}`)
      }

      executionStatus = await statusResponse.json()
      attempts++
    } while (
      executionStatus.state !== "QUERY_STATE_COMPLETED" &&
      executionStatus.state !== "QUERY_STATE_FAILED" &&
      attempts < maxAttempts
    )

    if (executionStatus.state === "QUERY_STATE_FAILED") {
      throw new Error("Query execution failed")
    }

    if (executionStatus.state !== "QUERY_STATE_COMPLETED") {
      throw new Error("Query execution timed out")
    }

    // Step 3: Get the results
    const resultsResponse = await fetch(`https://api.dune.com/api/v1/execution/${executionId}/results`, {
      headers: {
        "X-Dune-API-Key": DUNE_API_KEY,
      },
    })

    if (!resultsResponse.ok) {
      throw new Error(`Failed to get results: ${resultsResponse.statusText}`)
    }

    const resultsData = await resultsResponse.json()
    return resultsData.result
  } catch (error) {
    console.error("Error executing Dune query:", error)
    throw error
  }
}

/**
 * Fetch volume by token data from Dune query 5119173
 */
async function fetchVolumeByToken(): Promise<VolumeByTokenData[]> {
  try {
    // Check if we need to refresh the cache
    const now = Date.now()
    if (volumeTokensCache && now - lastVolumeFetchTime <= CACHE_DURATION) {
      return volumeTokensCache
    }

    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log("Using mock volume by token data in preview environment")
      const tokens = MOCK_DATA.tokens.map((token) => ({
        token: token.token,
        symbol: token.symbol,
        vol_usd: token.vol_usd,
        txs: token.txs,
        created_time: token.created_time,
      }))

      // Update cache
      volumeTokensCache = tokens
      lastVolumeFetchTime = now

      return tokens
    }

    console.log("Fetching volume by token data from Dune")
    const result = await fetchDuneQueryResults(5119173, 1000)

    if (result && result.rows && result.rows.length > 0) {
      // Process the data from the query
      const tokens = result.rows.map((row: any) => {
        return {
          token: row.token,
          symbol: row.symbol,
          vol_usd: Number.parseFloat(row.vol_usd),
          txs: Number.parseInt(row.txs),
          created_time: row.created_time,
        }
      })

      // Update cache
      volumeTokensCache = tokens
      lastVolumeFetchTime = now

      return tokens
    }

    throw new Error("No volume data returned from Dune query")
  } catch (error) {
    console.error("Error fetching volume by token data from Dune:", error)
    return []
  }
}

/**
 * Fetch all token data directly from Dune query 5129959 (Pie Chart of Believe Coins by Market Cap)
 * This is used internally by the paginated function
 */
async function fetchAllTokensFromDune(): Promise<TokenData[]> {
  try {
    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log("Using mock token data in preview environment")
      return [...MOCK_DATA.tokens]
    }

    // Use query 5129959 which has the market cap data directly
    const result = await fetchDuneQueryResults(5129959)

    if (result && result.rows && result.rows.length > 0) {
      // Process the data from the query
      const tokens = result.rows.map((row: any) => {
        return {
          token: row.token_mint_address,
          symbol: row.symbol,
          name: row.name,
          vol_usd: 0, // Not available in this query
          txs: 0, // Not available in this query
          created_time: row.date,
          description: `${row.name} (${row.symbol})`,
          price: 0, // Not available in this query
          marketCap: Number.parseFloat(row.market_cap_usd),
          num_holders: Number.parseInt(row.num_holders),
          change24h: 0, // Not available in this query
          change1h: 0, // Not available in this query
          liquidity: 0, // Not available in this query
          buys: 0, // Not available in this query
          sells: 0, // Not available in this query
          volume24h: 0, // Not available in this query
        }
      })

      // Sort tokens by market cap (descending)
      return tokens.sort((a, b) => b.marketCap - a.marketCap)
    }

    throw new Error("No data returned from Dune query")
  } catch (error) {
    console.error("Error fetching token data from Dune:", error)
    return []
  }
}

/**
 * Fetch paginated token data directly from Dune
 */
export async function fetchPaginatedTokens(
  page = 1,
  pageSize = 10,
  sortField = "marketCap",
  sortDirection = "desc",
): Promise<PaginatedTokenResponse> {
  try {
    // Check if we need to refresh the cache
    const now = Date.now()
    if (!allTokensCache || now - lastFetchTime > CACHE_DURATION) {
      console.log("Fetching all tokens from Dune (cache expired or not initialized)")
      allTokensCache = await fetchAllTokensFromDune()
      lastFetchTime = now
    }

    // Calculate total tokens and pages
    const totalTokens = allTokensCache.length
    const totalPages = Math.ceil(totalTokens / pageSize)

    // Sort the tokens based on the requested sort field and direction
    const sortedTokens = [...allTokensCache].sort((a, b) => {
      const aValue = a[sortField as keyof typeof a] || 0
      const bValue = b[sortField as keyof typeof b] || 0

      return sortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })

    // Calculate start and end indices for the requested page
    const startIndex = (page - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalTokens)

    // Get the tokens for the current page from the sorted array
    const pageTokens = sortedTokens.slice(startIndex, endIndex)

    console.log(`Fetching page ${page} (${startIndex}-${endIndex}) of ${totalPages} pages`)

    // Return the paginated response
    return {
      tokens: pageTokens,
      page,
      pageSize,
      totalTokens,
      totalPages,
    }
  } catch (error) {
    console.error("Error fetching paginated tokens:", error)
    return {
      tokens: [],
      page,
      pageSize,
      totalTokens: 0,
      totalPages: 1,
    }
  }
}

/**
 * Legacy function to fetch all token data at once
 * This is kept for backward compatibility but should be avoided for performance reasons
 */
export async function fetchTokenData(): Promise<TokenData[]> {
  try {
    // Use the paginated function but get only the first 10 tokens
    const paginatedResponse = await fetchPaginatedTokens(1, 10)
    return paginatedResponse.tokens
  } catch (error) {
    console.error("Error in fetchTokenData:", error)
    return []
  }
}

/**
 * Fetch market cap over time data (5119241)
 */
export async function fetchMarketCapOverTime(): Promise<MarketCapTimeData[]> {
  try {
    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log("Using mock market cap time data in preview environment")
      return [...MOCK_DATA.marketCapTimeData]
    }

    const result = await fetchDuneQueryResults(5119241)

    if (result && result.rows && result.rows.length > 0) {
      return result.rows.map((row: any) => ({
        date: row.date,
        marketcap: Number.parseFloat(row.marketcap),
        num_holders: Number.parseInt(row.num_holders),
        nh_diff_1d: Number.parseFloat(row.nh_diff_1d),
        nh_diff_7d: Number.parseFloat(row.nh_diff_7d),
        nh_diff_30d: Number.parseFloat(row.nh_diff_30d),
      }))
    }

    throw new Error("No market cap time data returned from Dune query")
  } catch (error) {
    console.error("Error fetching market cap time data:", error)
    return []
  }
}

/**
 *    console.error("Error fetching market cap time data:", error)
    return []
  }
}

/**
 * Fetch token market cap data for pie chart (5129959)
 */
export async function fetchTokenMarketCaps(): Promise<TokenMarketCapData[]> {
  try {
    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log("Using mock token market cap data in preview environment")
      return [...MOCK_DATA.tokenMarketCaps]
    }

    const result = await fetchDuneQueryResults(5129959)

    if (result && result.rows && result.rows.length > 0) {
      return result.rows.map((row: any) => ({
        date: row.date,
        token_mint_address: row.token_mint_address,
        name: row.name,
        symbol: row.symbol,
        market_cap_usd: Number.parseFloat(row.market_cap_usd),
        num_holders: Number.parseInt(row.num_holders),
        rn: Number.parseInt(row.rn),
      }))
    }

    throw new Error("No token market cap data returned from Dune query")
  } catch (error) {
    console.error("Error fetching token market cap data:", error)
    return []
  }
}

/**
 * Fetch total market cap data (5130872)
 */
export async function fetchTotalMarketCap(): Promise<TotalMarketCapData> {
  try {
    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log("Using mock total market cap data in preview environment")
      return { ...MOCK_DATA.totalMarketCap }
    }

    const result = await fetchDuneQueryResults(5130872)

    if (result && result.rows && result.rows.length > 0) {
      const row = result.rows[0]
      return {
        latest_data_at: row.latest_data_at,
        total_marketcap_usd: Number.parseFloat(row.total_marketcap_usd),
      }
    }

    throw new Error("No total market cap data returned from Dune query")
  } catch (error) {
    console.error("Error fetching total market cap data:", error)
    return {
      latest_data_at: new Date().toISOString(),
      total_marketcap_usd: 0,
    }
  }
}

/**
 * Fetch new token data (5129347)
 */
export async function fetchNewTokens(limit = 10): Promise<NewTokenData[]> {
  try {
    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log("Using mock new token data in preview environment")
      return [...MOCK_DATA.newTokens].slice(0, limit)
    }

    const result = await fetchDuneQueryResults(5129347)

    if (result && result.rows && result.rows.length > 0) {
      return result.rows.slice(0, limit).map((row: any) => ({
        token_mint_address: row.token_mint_address,
        created_time: row.created_time,
        name: row.name || "Unknown",
        symbol: row.symbol || "???",
        market_cap_usd: row.market_cap_usd ? Number.parseFloat(row.market_cap_usd) : 0,
        num_holders: Number.parseInt(row.num_holders),
      }))
    }

    throw new Error("No new token data returned from Dune query")
  } catch (error) {
    console.error("Error fetching new token data:", error)
    return []
  }
}

/**
 * Fetch market statistics based on token data
 */
export async function fetchMarketStats(): Promise<MarketStats> {
  try {
    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log("Using mock market stats in preview environment")
      return { ...MOCK_DATA.marketStats }
    }

    // Fetch volume by token data for more accurate stats
    const volumeTokens = await fetchVolumeByToken()
    const totalMarketCapData = await fetchTotalMarketCap()

    if (volumeTokens.length > 0) {
      // Calculate totals
      const totalMarketCap = totalMarketCapData.total_marketcap_usd || 0

      // Calculate total volume from the volume data
      const volume24h = volumeTokens.reduce((sum, token) => sum + (token.vol_usd || 0), 0)

      // Calculate total transactions from the volume data
      const transactions24h = volumeTokens.reduce((sum, token) => sum + (token.txs || 0), 0)

      // Calculate fee earnings (e.g., 0.3% of volume)
      const feeEarnings24h = volume24h * 0.003

      // Count total number of tokens
      const coinLaunches = volumeTokens.length

      return {
        totalMarketCap,
        volume24h,
        transactions24h,
        feeEarnings24h,
        lifetimeVolume: volume24h * 30, // Estimate lifetime as 30 days of volume
        coinLaunches,
      }
    }

    throw new Error("No token data available to calculate market stats")
  } catch (error) {
    console.error("Error calculating market stats:", error)
    // Return default values in case of error
    return {
      totalMarketCap: 0,
      volume24h: 0,
      transactions24h: 0,
      feeEarnings24h: 0,
      lifetimeVolume: 0,
      coinLaunches: 0,
    }
  }
}

/**
 * Fetch data for a specific token
 */
export async function fetchTokenDetails(symbol: string): Promise<TokenData | null> {
  try {
    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log(`Using mock token details for ${symbol} in preview environment`)
      const token = MOCK_DATA.tokens.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase())
      return token || null
    }

    // Check if we need to refresh the cache
    const now = Date.now()
    if (!allTokensCache || now - lastFetchTime > CACHE_DURATION) {
      console.log("Fetching all tokens from Dune (cache expired or not initialized)")
      allTokensCache = await fetchAllTokensFromDune()
      lastFetchTime = now
    }

    // Find the token in the cache
    const token = allTokensCache.find((token) => token.symbol.toLowerCase() === symbol.toLowerCase())

    if (!token) {
      return null
    }

    // Try to enrich with volume data if available
    if (!volumeTokensCache || now - lastVolumeFetchTime > CACHE_DURATION) {
      console.log("Fetching volume data for token details")
      volumeTokensCache = await fetchVolumeByToken()
      lastVolumeFetchTime = now
    }

    // Find matching volume data
    const volumeData = volumeTokensCache.find((vt) => vt.token === token.token || vt.symbol === token.symbol)

    if (volumeData) {
      return {
        ...token,
        vol_usd: volumeData.vol_usd || 0,
        txs: volumeData.txs || 0,
        volume24h: volumeData.vol_usd || 0,
      }
    }

    return token
  } catch (error) {
    console.error("Error fetching token details:", error)
    return null
  }
}

// Modify getTimeUntilNextDuneRefresh to use mock data in preview
export async function getTimeUntilNextDuneRefresh(): Promise<{ timeRemaining: number; lastRefreshTime: Date }> {
  // In preview, simulate a refresh that happened 1 hour ago
  if (IS_PREVIEW) {
    console.log("Using mock refresh time data in preview environment")
    const mockLastRefreshTime = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    const timeRemaining = 3 * 60 * 60 * 1000 // 3 hours remaining (out of 4)

    return {
      timeRemaining,
      lastRefreshTime: mockLastRefreshTime,
    }
  }

  const now = Date.now()
  const lastRefresh = new Date(lastFetchTime)
  const nextRefresh = new Date(lastFetchTime + CACHE_DURATION)
  const timeRemaining = Math.max(0, lastFetchTime + CACHE_DURATION - now)

  return {
    timeRemaining,
    lastRefreshTime: lastRefresh,
  }
}

// Modify forceDuneDataRefresh to use mock data in preview
export async function forceDuneDataRefresh(): Promise<boolean> {
  try {
    if (IS_PREVIEW) {
      console.log("Simulating force refresh in preview environment")
      // Just reset the timestamps but keep using mock data
      lastFetchTime = Date.now()
      lastVolumeFetchTime = Date.now()
      return true
    }

    // Reset cache
    allTokensCache = null
    volumeTokensCache = null
    lastFetchTime = 0
    lastVolumeFetchTime = 0

    // Fetch new data to populate cache
    await fetchAllTokensFromDune()
    await fetchVolumeByToken()

    return true
  } catch (error) {
    console.error("Error forcing Dune data refresh:", error)
    return false
  }
}
