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
} from "@/types/dune"

import { getCacheItem, setCacheItem, shouldFetchFromDune, shouldUseRealAPI, CACHE_KEYS } from "@/lib/cache"
import { getMockDataForQuery } from "@/lib/mock-data"

// This is your Dune API key from environment variables
const DUNE_API_KEY = process.env.DUNE_API_KEY

// Cache duration (2.5 hours in milliseconds)
const CACHE_DURATION = 2.5 * 60 * 60 * 1000

// List of disabled queries that should never be executed directly
const DISABLED_QUERIES = [5129959, 5130872, 5129347, 5119173]

// List of enabled queries
const ENABLED_QUERIES = [5140151, 5119241]

// Add a flag to track if a refresh is in progress
let isRefreshing = false
// Add a timestamp for last user-triggered refresh
let lastUserRefreshTime = 0
// Add a minimum interval between user-triggered refreshes (5 minutes)
const USER_REFRESH_INTERVAL = 5 * 60 * 1000

// Store the main token data globally to avoid redundant fetches
let globalTokenData: TokenData[] | null = null
let globalTokenDataTimestamp = 0

/**
 * Fetch results directly from a Dune query using the results endpoint
 */
async function fetchDuneQueryResults(queryId: number, limit = 1000) {
  // Check if this is a disabled query
  if (DISABLED_QUERIES.includes(queryId)) {
    console.log(`Query ${queryId} is disabled. Using mock data instead.`)
    return getMockDataForQuery(queryId)
  }

  // Check if this is an enabled query
  if (!ENABLED_QUERIES.includes(queryId)) {
    console.log(`Query ${queryId} is not in the enabled list. Using mock data instead.`)
    return getMockDataForQuery(queryId)
  }

  // Check if we should use the real API
  if (!shouldUseRealAPI()) {
    console.log(`Using mock data for query ${queryId} (API disabled or non-production environment)`)
    return getMockDataForQuery(queryId)
  }

  // Check if we should fetch from Dune based on cache status
  const cacheKey = `${CACHE_KEYS.LAST_FETCH_TIME}:${queryId}`
  const shouldFetch = await shouldFetchFromDune(cacheKey, CACHE_DURATION)

  if (!shouldFetch) {
    console.log(`Using cached data for query ${queryId}`)
    const cachedData = await getCacheItem(`${CACHE_KEYS.TOKEN_DATA}:${queryId}`)
    if (cachedData) {
      return cachedData
    }

    // If no cached data, use mock data as fallback
    console.log(`No cached data found for query ${queryId}, using mock data`)
    return getMockDataForQuery(queryId)
  }

  if (!DUNE_API_KEY) {
    console.log("DUNE_API_KEY is not set, using mock data")
    return getMockDataForQuery(queryId)
  }

  try {
    console.log(`Fetching data from Dune for query ${queryId}`)
    const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results?limit=${limit}`, {
      headers: {
        "X-Dune-API-Key": DUNE_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch query results: ${response.statusText}`)
    }

    const data = await response.json()

    // Cache the result
    await setCacheItem(`${CACHE_KEYS.TOKEN_DATA}:${queryId}`, data.result, CACHE_DURATION / 1000)

    return data.result
  } catch (error) {
    console.error("Error fetching Dune query results:", error)

    // If API call fails, try to use cached data
    const cachedData = await getCacheItem(`${CACHE_KEYS.TOKEN_DATA}:${queryId}`)
    if (cachedData) {
      console.log(`Using cached data for query ${queryId} due to API error`)
      return cachedData
    }

    // If no cached data, use mock data as fallback
    console.log(`No cached data found for query ${queryId}, using mock data as fallback`)
    return getMockDataForQuery(queryId)
  }
}

/**
 * Execute a Dune query and return the results
 */
async function executeDuneQuery(queryId: number, parameters: DuneQueryParameter[] = []) {
  // Check if this is a disabled query
  if (DISABLED_QUERIES.includes(queryId)) {
    console.log(`Query ${queryId} is disabled. Using mock data instead.`)
    return getMockDataForQuery(queryId)
  }

  // Check if this is an enabled query
  if (!ENABLED_QUERIES.includes(queryId)) {
    console.log(`Query ${queryId} is not in the enabled list. Using mock data instead.`)
    return getMockDataForQuery(queryId)
  }

  // Check if we should use the real API
  if (!shouldUseRealAPI()) {
    console.log(`Using mock data for query execution ${queryId} (API disabled or non-production environment)`)
    return getMockDataForQuery(queryId)
  }

  try {
    console.log(`Executing query ${queryId} on Dune`)
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

    // Cache the result
    await setCacheItem(
      `${CACHE_KEYS.TOKEN_DATA}:exec:${queryId}:${JSON.stringify(parameters)}`,
      resultsData.result,
      CACHE_DURATION / 1000,
    )

    return resultsData.result
  } catch (error) {
    console.error("Error executing Dune query:", error)

    // If API call fails, try to use cached data
    const cachedData = await getCacheItem(`${CACHE_KEYS.TOKEN_DATA}:exec:${queryId}:${JSON.stringify(parameters)}`)
    if (cachedData) {
      console.log(`Using cached data for query execution ${queryId} due to API error`)
      return cachedData
    }

    // If no cached data, use mock data as fallback
    console.log(`No cached data found for query execution ${queryId}, using mock data as fallback`)
    return getMockDataForQuery(queryId)
  }
}

/**
 * Fetch all token data with fallback to cached data
 * This is the main function that fetches data from query 5140151
 */
export async function fetchAllTokensFromDune(): Promise<TokenData[]> {
  try {
    // Check if we have recent global data (less than 5 minutes old)
    const now = Date.now()
    if (globalTokenData && now - globalTokenDataTimestamp < 5 * 60 * 1000) {
      console.log("Using global token data (less than 5 minutes old)")
      return globalTokenData
    }

    // Check if we should fetch from Dune based on cache status
    const shouldFetch = await shouldFetchFromDune(CACHE_KEYS.LAST_FETCH_TIME, CACHE_DURATION)

    // If we have cached token data and shouldn't fetch, use that
    if (!shouldFetch) {
      const cachedData = await getCacheItem<TokenData[]>(CACHE_KEYS.TOKEN_DATA)
      if (cachedData) {
        // Update global data
        globalTokenData = cachedData
        globalTokenDataTimestamp = now
        return cachedData
      }
    }

    // Use the new query 5140151 which has more comprehensive token data
    const result = await fetchDuneQueryResults(5140151)

    if (result && result.rows && result.rows.length > 0) {
      // Process the data from the query
      const tokens = result.rows.map((row: any) => {
        return {
          token: row.token,
          token_url: row.token_url,
          symbol: row.symbol,
          name: row.name,
          vol_usd: Number.parseFloat(row.vol_usd),
          txs: Number.parseInt(row.txs),
          created_time: row.created_time,
          first_trade_time: row.first_trade_time,
          description: `${row.name} (${row.symbol})`,
          price: 0, // Will be enriched with Dexscreener data
          marketCap: Number.parseFloat(row.market_cap_usd),
          num_holders: Number.parseInt(row.num_holders),
          change24h: 0, // Will be enriched with Dexscreener data
          change1h: 0, // Will be enriched with Dexscreener data
          liquidity: 0, // Will be enriched with Dexscreener data
          buys: 0, // Will be enriched with Dexscreener data
          sells: 0, // Will be enriched with Dexscreener data
          volume24h: Number.parseFloat(row.vol_usd),
        }
      })

      // Sort tokens by market cap (descending)
      const sortedTokens = tokens.sort((a, b) => b.marketCap - a.marketCap)

      // Update cache
      await setCacheItem(CACHE_KEYS.TOKEN_DATA, sortedTokens, CACHE_DURATION / 1000)
      await setCacheItem(CACHE_KEYS.LAST_FETCH_TIME, now)

      // Update global data
      globalTokenData = sortedTokens
      globalTokenDataTimestamp = now

      return sortedTokens
    } else {
      // If the query fails but we have cached data, use that instead
      const cachedData = await getCacheItem<TokenData[]>(CACHE_KEYS.TOKEN_DATA)
      if (cachedData) {
        console.log("Dune query failed, using cached token data")
        // Update global data
        globalTokenData = cachedData
        globalTokenDataTimestamp = now
        return cachedData
      }
    }

    throw new Error("No data returned from Dune query and no cached data available")
  } catch (error) {
    console.error("Error fetching token data from Dune:", error)

    // If we have cached data, return that instead
    const cachedData = await getCacheItem<TokenData[]>(CACHE_KEYS.TOKEN_DATA)
    if (cachedData) {
      console.log("Using cached token data due to error")
      // Update global data
      globalTokenData = cachedData
      globalTokenDataTimestamp = Date.now()
      return cachedData
    }

    // If all else fails, return mock data
    console.log("No cached data available, using mock data")
    const mockData = getMockDataForQuery(5140151).rows
    // Update global data
    globalTokenData = mockData
    globalTokenDataTimestamp = Date.now()
    return mockData
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
    // Fetch all tokens (this will use cache if available)
    const allTokens = await fetchAllTokensFromDune()

    // Calculate total tokens and pages
    const totalTokens = allTokens.length
    const totalPages = Math.ceil(totalTokens / pageSize)

    // Sort the tokens based on the requested sort field and direction
    const sortedTokens = [...allTokens].sort((a, b) => {
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
 * Fetch market cap over time data with fallback to estimated data
 * This is the only function that still uses the original query (5119241)
 */
export async function fetchMarketCapOverTime(): Promise<MarketCapTimeData[]> {
  try {
    // Try to fetch from Dune using the original query
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

    // If Dune query fails, generate estimated data
    console.log("Generating estimated market cap time data")

    // Fetch all tokens (this will use cache if available)
    const allTokens = await fetchAllTokensFromDune()

    // Generate estimated time series data based on current market cap
    const totalMarketCap = allTokens.reduce((sum, token) => sum + (token.marketCap || 0), 0)
    const totalHolders = allTokens.reduce((sum, token) => sum + (token.num_holders || 0), 0)

    // Generate data points for the last 30 days
    const timeSeriesData: MarketCapTimeData[] = []
    const today = new Date()

    // Create synthetic data points with some randomness to simulate real data
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // Add some randomness to market cap (±10%)
      const randomFactor = 0.9 + Math.random() * 0.2
      // Market cap generally increases over time
      const growthFactor = 1 - i / 35 // Older dates have lower market caps

      const marketcap = totalMarketCap * randomFactor * growthFactor

      // Holders also increase over time but more steadily
      const holderGrowthFactor = 1 - i / 40
      const num_holders = Math.round(totalHolders * holderGrowthFactor)

      // Calculate daily changes
      const prevDay = timeSeriesData[timeSeriesData.length - 1]
      const nh_diff_1d = prevDay ? num_holders - prevDay.num_holders : Math.round(num_holders * 0.01)

      // Weekly and monthly changes
      const nh_diff_7d = Math.round(num_holders * 0.05)
      const nh_diff_30d = Math.round(num_holders * 0.15)

      timeSeriesData.push({
        date: date.toISOString().split("T")[0],
        marketcap,
        num_holders,
        nh_diff_1d,
        nh_diff_7d,
        nh_diff_30d,
      })
    }

    return timeSeriesData
  } catch (error) {
    console.error("Error generating market cap time data:", error)
    return getMockDataForQuery(5119241).rows
  }
}

/**
 * Fetch token market cap data for pie chart
 * Now uses the main token data from query 5140151
 */
export async function fetchTokenMarketCaps(): Promise<TokenMarketCapData[]> {
  console.log("Note: Using data derived from query 5140151 instead of the original query 5129959")
  try {
    // Fetch all tokens (this will use cache if available)
    const allTokens = await fetchAllTokensFromDune()

    // Convert to the format needed for the pie chart
    return allTokens.map((token, index) => ({
      date: new Date().toISOString().split("T")[0],
      token_mint_address: token.token,
      name: token.name || "",
      symbol: token.symbol,
      market_cap_usd: token.marketCap || 0,
      num_holders: token.num_holders || 0,
      rn: index + 1,
    }))
  } catch (error) {
    console.error("Error fetching token market cap data:", error)
    return getMockDataForQuery(5129959).rows
  }
}

/**
 * Fetch total market cap data
 * Now uses the main token data from query 5140151
 */
export async function fetchTotalMarketCap(): Promise<TotalMarketCapData> {
  console.log("Note: Using data derived from query 5140151 instead of the original query 5130872")
  try {
    // Fetch all tokens (this will use cache if available)
    const allTokens = await fetchAllTokensFromDune()

    // Calculate total market cap from the token data
    const totalMarketCap = allTokens.reduce((sum, token) => sum + (token.marketCap || 0), 0)

    // Get the last fetch time
    const lastFetchTime = (await getCacheItem<number>(CACHE_KEYS.LAST_FETCH_TIME)) || Date.now()

    return {
      latest_data_at: new Date(lastFetchTime).toISOString(),
      total_marketcap_usd: totalMarketCap,
    }
  } catch (error) {
    console.error("Error fetching total market cap data:", error)
    return getMockDataForQuery(5130872).rows[0]
  }
}

/**
 * Fetch new token data
 * Now uses the main token data from query 5140151
 */
export async function fetchNewTokens(limit = 10): Promise<NewTokenData[]> {
  console.log("Note: Using data derived from query 5140151 instead of the original query 5129347")
  try {
    // Fetch all tokens (this will use cache if available)
    const allTokens = await fetchAllTokensFromDune()

    // Sort by created_time (newest first) and take the first 'limit' tokens
    const newTokens = [...allTokens]
      .sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())
      .slice(0, limit)
      .map((token) => ({
        token_mint_address: token.token,
        created_time: token.created_time,
        name: token.name || "Unknown",
        symbol: token.symbol || "???",
        market_cap_usd: token.marketCap || 0,
        num_holders: token.num_holders || 0,
      }))

    return newTokens
  } catch (error) {
    console.error("Error fetching new token data:", error)
    return getMockDataForQuery(5129347).rows.slice(0, limit)
  }
}

/**
 * Fetch data from Dexscreener API in batches
 */
async function batchFetchTokenData(tokenAddresses: string[]): Promise<any[]> {
  const batchSize = 10
  const results = []

  for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    const batch = tokenAddresses.slice(i, i + batchSize)
    const addresses = batch.join(",")
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/multichain/tokens/${addresses}`)
      if (response.ok) {
        const data = await response.json()
        results.push(data)
      } else {
        console.error(`Failed to fetch Dexscreener data: ${response.statusText}`)
        results.push(null) // Push null to maintain the order of results
      }
    } catch (error) {
      console.error("Error fetching Dexscreener data:", error)
      results.push(null) // Push null to maintain the order of results
    }
  }

  return results
}

/**
 * Fetch market statistics based on token data and Dexscreener
 * Now uses the main token data from query 5140151
 */
export async function fetchMarketStats(): Promise<MarketStats> {
  try {
    // Fetch all tokens (this will use cache if available)
    const allTokens = await fetchAllTokensFromDune()

    // Calculate total market cap from the token data
    const totalMarketCap = allTokens.reduce((sum, token) => sum + (token.marketCap || 0), 0)

    // Calculate total volume from the token data
    const totalVolume = allTokens.reduce((sum, token) => sum + (token.vol_usd || 0), 0)

    // Calculate total transactions from the token data
    const totalTransactions = allTokens.reduce((sum, token) => sum + (token.txs || 0), 0)

    // Calculate fee earnings (0.3% of volume)
    const feeEarnings24h = totalVolume * 0.003

    // Count total number of tokens
    const coinLaunches = allTokens.length

    return {
      totalMarketCap,
      volume24h: totalVolume,
      transactions24h: totalTransactions,
      feeEarnings24h,
      lifetimeVolume: totalVolume * 30, // Estimate lifetime as 30 days of volume
      coinLaunches,
    }
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
 * Now uses the main token data from query 5140151
 */
export async function fetchTokenDetails(symbol: string): Promise<TokenData | null> {
  try {
    // Fetch all tokens (this will use cache if available)
    const allTokens = await fetchAllTokensFromDune()

    // Find the token in the cache
    const token = allTokens.find((token) => token.symbol.toLowerCase() === symbol.toLowerCase())

    if (!token) {
      return null
    }

    return token
  } catch (error) {
    console.error("Error fetching token details:", error)
    return null
  }
}

/**
 * Trigger a manual refresh of all data
 * This will only refresh if the minimum interval has passed since the last refresh
 */
export async function triggerManualRefresh(): Promise<{ success: boolean; message: string }> {
  const now = Date.now()

  // Check if a refresh is already in progress
  if (isRefreshing) {
    return {
      success: false,
      message: "A data refresh is already in progress. Please wait.",
    }
  }

  // Check if minimum interval has passed since last user refresh
  if (now - lastUserRefreshTime < USER_REFRESH_INTERVAL) {
    const remainingSeconds = Math.ceil((USER_REFRESH_INTERVAL - (now - lastUserRefreshTime)) / 1000)
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before refreshing again.`,
    }
  }

  try {
    isRefreshing = true
    lastUserRefreshTime = now

    // Clear caches to force refresh
    await setCacheItem(CACHE_KEYS.LAST_FETCH_TIME, 0)

    // Clear global cache
    globalTokenData = null
    globalTokenDataTimestamp = 0

    // Fetch new data
    await fetchAllTokensFromDune()

    isRefreshing = false
    return {
      success: true,
      message: "Data refreshed successfully!",
    }
  } catch (error) {
    isRefreshing = false
    console.error("Error during manual refresh:", error)
    return {
      success: false,
      message: "Failed to refresh data. Please try again later.",
    }
  }
}

/**
 * Get the timestamp of the last data refresh
 */
export async function getLastUpdateTime(): Promise<number> {
  const lastFetchTime = await getCacheItem<number>(CACHE_KEYS.LAST_FETCH_TIME)
  return lastFetchTime || Date.now()
}
