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

// This is your Dune API key from environment variables
const DUNE_API_KEY = process.env.DUNE_API_KEY

// In-memory cache for token data to avoid refetching from Dune
let allTokensCache: TokenData[] | null = null
let volumeTokensCache: VolumeByTokenData[] | null = null
let lastFetchTime = 0
let lastVolumeFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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
 * Fetch token market cap data for pie chart (5129959)
 */
export async function fetchTokenMarketCaps(): Promise<TokenMarketCapData[]> {
  try {
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
