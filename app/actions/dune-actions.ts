"use server";

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
} from "@/types/dune";
import {
  CACHE_KEYS,
  getFromCache,
  setInCache,
  getTimeUntilNextRefresh,
  acquireRefreshLock,
  releaseRefreshLock,
  CACHE_DURATION,
} from "@/lib/redis";
import { cache } from "react";

// Check if we're in a preview environment or if DUNE_API_KEY is not set
const IS_PREVIEW =
  process.env.VERCEL_ENV === "preview" ||
  process.env.ENABLE_DUNE_API === "false" ||
  !process.env.DUNE_API_KEY;
// Mock data for preview environments

// This is your Dune API key from environment variables
const DUNE_API_KEY = process.env.DUNE_API_KEY;

/**
 * Fetch results directly from a Dune query using the results endpoint
 */
async function fetchDuneQueryResults(queryId: number, limit = 1000) {

  if (!DUNE_API_KEY) {
    console.error("DUNE_API_KEY is not set");
    return { rows: [] };
  }

  try {
    const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results?limit=${limit}`,

      //  -------------! previous api
      
      // `'https://api.dune.com/api/v1/materialized-views/dune.dashers.result_believe_token_summary_latest`,
      {
        headers: {
          "X-Dune-API-Key": DUNE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch query results: ${response.statusText}`);
      return { rows: [] };
    }

    const data = await response.json();
    return data.result || { rows: [] };
  } catch (error) {
    console.error("Error fetching Dune query results:", error);
    return { rows: [] };
  }
}


/**
 * Fetch all token data directly from Dune query 5129959 (Pie Chart of Believe Coins by Market Cap)
 * This is used internally by the paginated function
 */
export async function fetchAllTokensFromDune(): Promise<TokenData[]> {
  try {

    let lastRefreshTime = new Date(Date.now() -  34 * 60 * 1000); // Default to 1 hours ago

    try {
      const refreshInfo = await getTimeUntilNextDuneRefresh();
      lastRefreshTime = refreshInfo.lastRefreshTime;
    } catch (error) {
      console.error("Error getting refresh time info:", error);
    }

    if ( (Date.now() - lastRefreshTime.getTime()) > 1 * 60 * 60 * 1000) {
        const cachedData = await getFromCache<TokenData[]>(CACHE_KEYS.ALL_TOKENS)
          if (cachedData && cachedData.length > 0) {
          return cachedData
        }
      }
    
    
    const result = await fetchDuneQueryResults(5140151);
    
    if (result && result.rows && result.rows.length > 0) {
      // Process the data from the query
      const tokens = result.rows.map((row: any) => {
        return {
          token: row.token || "",
          symbol: row.symbol || "",
          name: row.name || "",
          vol_usd: Number.parseFloat(row.vol_usd || 0),
          txs: Number.parseInt(row.txs || 0),
          created_time: row.created_time || new Date().toISOString(),
          description: row.name ? `${row.name} (${row.symbol || ""})` : "",
          price: 0, // Not available in this query
          marketCap: Number.parseFloat(row.market_cap_usd || 0),
          num_holders: Number.parseInt(row.num_holders || 0),
          change24h: 0, // Not available in this query
          change1h: 0, // Not available in this query
          liquidity: 0, // Not available in this query
          buys: 0, // Not available in this query
          sells: 0, // Not available in this query
          volume24h: Number.parseFloat(row.vol_usd || 0),
          token_url: row.token_url || "",
          first_trade_time: row.first_trade_time || "",
        };
      });

      // Sort tokens by market cap (descending)
      const sortedTokens = tokens.sort(
        (a: any, b: any) => (b.marketCap || 0) - (a.marketCap || 0)
      );

      // Store in cache
      await setInCache(CACHE_KEYS.ALL_TOKENS, sortedTokens);
      return sortedTokens;
    }

    console.warn("No data returned from Dune query, using empty array");
    return [];
  } catch (error) {
    console.error("Error fetching token data from Dune:", error);
    return [];
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
  searchTerm = ""
): Promise<PaginatedTokenResponse> {
  try {
    // Get all tokens from cache or fetch if needed
    const allTokens = await fetchAllTokensFromDune();

    // Filter tokens based on search term if provided
    const filteredTokens = searchTerm.trim() !== "" 
      ? allTokens.filter((token) => {
          const symbolMatch = token.symbol ? 
            token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) : false;
          const nameMatch = token.name ? 
            token.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
          const descriptionMatch = token.description ? 
            token.description.toLowerCase().includes(searchTerm.toLowerCase()) : false;
          
          return symbolMatch || nameMatch || descriptionMatch;
        })
      : allTokens;

    // Calculate total tokens and pages based on filtered tokens
    const totalTokens = filteredTokens.length;
    const totalPages = Math.ceil(totalTokens / pageSize) || 1;

    // Sort the filtered tokens based on the requested sort field and direction
    const sortedTokens = [...filteredTokens].sort((a, b) => {
      const aValue = a[sortField as keyof typeof a] || 0;
      const bValue = b[sortField as keyof typeof a] || 0;

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    // Calculate start and end indices for the requested page
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalTokens);

    // Get the tokens for the current page from the sorted array
    const pageTokens = sortedTokens.slice(startIndex, endIndex);

    console.log(
      `Fetching page ${page} (${startIndex}-${endIndex}) of ${totalPages} pages with search: ${searchTerm}`
    );
    
    // Return the paginated response
    return {
      tokens: pageTokens,
      page,
      pageSize,
      totalTokens,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching paginated tokens:", error);
    return {
      tokens: [],
      page,
      pageSize,
      totalTokens: 0,
      totalPages: 1,
    };
  }
}

/**
 * Legacy function to fetch all token data at once
 * This is kept for backward compatibility but should be avoided for performance reasons
 */
export async function fetchTokenData(): Promise<TokenData[]> {
  try {
    // Use the paginated function but get only the first 10 tokens
    const paginatedResponse = await fetchPaginatedTokens(1, 10);
    return paginatedResponse.tokens;
  } catch (error) {
    console.error("Error in fetchTokenData:", error);
    return [];
  }
}

/**
 * Fetch market cap over time data (5119241)
 */
export async function fetchMarketCapOverTime(): Promise<MarketCapTimeData[]> {
  const MARKET_CAP_QUERY_ID = 5119241;
  try {
    // Check if data exists in cache
    // const cachedData = await getFromCache<MarketCapTimeData[]>(
    //   CACHE_KEYS.MARKET_CAP_TIME
    // );
    // if (cachedData && cachedData.length > 0) {
    //   return cachedData;
    // }

    // Use mock data in preview environments

    const result = await fetchDuneQueryResults(MARKET_CAP_QUERY_ID);

    if (result && result.rows && result.rows.length > 0) {
      const data = result.rows.map((row: any) => ({
        date: row.date || new Date().toISOString().split("T")[0],
        marketcap: Number.parseFloat(row.marketcap || 0),
        num_holders: Number.parseInt(row.num_holders || 0),
        nh_diff_1d: Number.parseFloat(row.nh_diff_1d || 0),
        nh_diff_7d: Number.parseFloat(row.nh_diff_7d || 0),
        nh_diff_30d: Number.parseFloat(row.nh_diff_30d || 0),
      }));

      // Store in cache
      await setInCache(CACHE_KEYS.MARKET_CAP_TIME, data);
      return data;
    }

    console.warn(
      "No market cap time data returned from Dune query, using empty array"
    );
    return [];
  } catch (error) {
    console.error("Error fetching market cap time data:", error);
    return [];
  }
}

/**
 * Fetch token market cap data for pie chart (5129959)
 */
export async function fetchTokenMarketCaps(): Promise<TokenMarketCapData[]> {
  try {

    let lastRefreshTime = new Date(Date.now() -  34 * 60 * 1000); // Default to 1 hours ago

    try {
      const refreshInfo = await getTimeUntilNextDuneRefresh();
      lastRefreshTime = refreshInfo.lastRefreshTime;

      console.log("Last refresh time------------------------->", lastRefreshTime)
    } catch (error) {
      console.error("Error getting refresh time info:", error);
    }

    if(Date.now() - lastRefreshTime.getTime() > 1 * 60 * 60 *1000){
      const cachedData = await getFromCache<TokenMarketCapData[]>(
        CACHE_KEYS.TOKEN_MARKET_CAPS
      );
      if (cachedData && cachedData.length > 0) {
        console.log("It's not time to refresh, fetching token market cap data from cache HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");
        return cachedData;
      }
    }

    const result = await fetchDuneQueryResults(5140151);

    if (result && result.rows && result.rows.length > 0) {
      // Get the current date for all entries
      const currentDate = new Date().toISOString().split("T")[0];

      const data = result.rows.map((row: any, index: number) => ({
        date: currentDate,
        token_mint_address: row.token || "",
        name: row.name || "Unknown",
        symbol: row.symbol || "???",
        market_cap_usd: Number.parseFloat(row.market_cap_usd || 0),
        num_holders: Number.parseInt(row.num_holders || 0),
        rn: index + 1, // Assign rank based on array index
      }));

      const now = Date.now();
      const nextRefresh = now + CACHE_DURATION;

      try {
        await setInCache(CACHE_KEYS.TOKEN_MARKET_CAPS, data);
        await setInCache(CACHE_KEYS.LAST_REFRESH_TIME, now);
        await setInCache(CACHE_KEYS.NEXT_REFRESH_TIME, nextRefresh);
      } catch (error) {
        console.error("Error updating refresh timestamps:", error);
      }

      const cachedData = await getFromCache<TokenMarketCapData[]>(
        CACHE_KEYS.TOKEN_MARKET_CAPS
      );
      console.log("It's time to refresh, fetching token market cap data from dune HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");
      return data;
    }

    console.warn(
      "No token market cap data returned from Dune query, using empty array"
    );
    return [];
  } catch (error) {
    console.error("Error fetching token market cap data:", error);
    return [];
  }
}

/**
 * Fetch total market cap data (5130872)
 */
export async function fetchTotalMarketCap(): Promise<TotalMarketCapData> {
  try {
    // Check if data exists in cache
    const cachedData = await getFromCache<TotalMarketCapData>(
      CACHE_KEYS.TOTAL_MARKET_CAP
    );
    if (cachedData && cachedData.latest_data_at) {
      return cachedData;
    }

    const result = await fetchDuneQueryResults(5140151);

    if (result && result.rows && result.rows.length > 0) {

      const totalMarketCap = result.rows.reduce((sum: number, row: any) => {
        return sum + Number.parseFloat(row.market_cap_usd || 0);
      }, 0);

      const data = {
        latest_data_at: new Date().toISOString(),
        total_marketcap_usd: totalMarketCap,
      };

      // Store in cache
      await setInCache(CACHE_KEYS.TOTAL_MARKET_CAP, data);
      return data;
    }

    console.warn(
      "No total market cap data returned from Dune query, using default values"
    );
    return {
      latest_data_at: new Date().toISOString(),
      total_marketcap_usd: 0,
    };
  } catch (error) {
    console.error("Error fetching total market cap data:", error);
    return {
      latest_data_at: new Date().toISOString(),
      total_marketcap_usd: 0,
    };
  }
}

/**
 * Fetch new token data (5129347)
 */
export async function fetchNewTokens(limit = 10): Promise<NewTokenData[]> {
  try {
    // Check if data exists in cache
    const cachedData = await getFromCache<NewTokenData[]>(
      CACHE_KEYS.NEW_TOKENS
    );
    if (cachedData) {
      return cachedData.slice(0, limit);
    }

    const result = await fetchDuneQueryResults(5140151);

    if (result && result.rows && result.rows.length > 0) {
      // Sort by created_time (newest first)
      const sortedRows = [...result.rows].sort((a, b) => {
        return (
          new Date(b.created_time).getTime() -
          new Date(a.created_time).getTime()
        );
      });

      const data = sortedRows.map((row: any) => ({
        token_mint_address: row.token,
        created_time: row.created_time,
        name: row.name || "Unknown",
        symbol: row.symbol || "???",
        market_cap_usd: row.market_cap_usd
          ? Number.parseFloat(row.market_cap_usd)
          : 0,
        num_holders: Number.parseInt(row.num_holders || 0),
      }));

      // Store in cache
      await setInCache(CACHE_KEYS.NEW_TOKENS, data);
      return data.slice(0, limit);
    }

    throw new Error("No new token data returned from Dune query");
  } catch (error) {
    console.error("Error fetching new token data:", error);
    return [];
  }
}

/**
 * Fetch market statistics based on token data
 */




export async function fetchMarketStats(): Promise<MarketStats> {
  try {

    let lastRefreshTime = new Date(Date.now() -  34 * 60 * 1000); // Default to 1 hours ago

    try {
      const refreshInfo = await getTimeUntilNextDuneRefresh();
      lastRefreshTime = refreshInfo.lastRefreshTime;

    } catch (error) {
      console.error("Error getting refresh time info:", error);
    }

    if ( (Date.now() - lastRefreshTime.getTime()) < 1 * 60 * 60 * 1000) {
      const cachedData = await getFromCache<MarketStats>(CACHE_KEYS.MARKET_STATS);
      console.log("It's not time to refresh, fetching data from cache HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH", cachedData);
      if (cachedData && cachedData.totalMarketCap !== undefined) {
        return cachedData;
      }
    }

    // Fetch data from the new query
    const result = await fetchDuneQueryResults(5140151);

    if (result && result.rows && result.rows.length > 0) {
      // Calculate total market cap
      const totalMarketCap = result.rows.reduce((sum: number, row: any) => {
        return sum + Number.parseFloat(row.market_cap_usd || 0);
      }, 0);

      // Calculate total volume
      const volume24h = result.rows.reduce((sum: number, row: any) => {
        return sum + Number.parseFloat(row.vol_usd || 0);
      }, 0);

      // Calculate total transactions
      const transactions24h = result.rows.reduce((sum: number, row: any) => {
        return sum + Number.parseInt(row.txs || 0);
      }, 0);

      // Calculate fee earnings (e.g., 0.3% of volume)
      const feeEarnings24h = volume24h * 0.003;

      // Count total number of tokens
      const coinLaunches = result.rows.length;

      const data = {
        totalMarketCap,
        volume24h,
        transactions24h,
        feeEarnings24h,
        lifetimeVolume: volume24h * 30, // Estimate lifetime as 30 days of volume
        coinLaunches,
      };

      // Store in cache
      const now = Date.now();
      const nextRefresh = now + CACHE_DURATION;
      try {
        await setInCache(CACHE_KEYS.MARKET_STATS, data);
        await setInCache(CACHE_KEYS.LAST_REFRESH_TIME, now);
        await setInCache(CACHE_KEYS.NEXT_REFRESH_TIME, nextRefresh);
      } catch (error) {
        console.error("Error updating refresh timestamps:", error);
      }

      console.log("It's time to fetch data from dune and storing this data to cach HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");
      return data;
    }

    console.warn(
      "No token data available to calculate market stats, using default values"
    );

    return {
      totalMarketCap: 0,
      volume24h: 0,
      transactions24h: 0,
      feeEarnings24h: 0,
      lifetimeVolume: 0,
      coinLaunches: 0,
    };
  } catch (error) {
    console.error("Error calculating market stats:", error);
    // Return default values in case of error
    return {
      totalMarketCap: 0,
      volume24h: 0,
      transactions24h: 0,
      feeEarnings24h: 0,
      lifetimeVolume: 0,
      coinLaunches: 0,
    };
  }
}

/**
 * Fetch data for a specific token
 */
export async function fetchTokenDetails(
  symbol: string
): Promise<TokenData | null> {
  try {
    if (!symbol) {
      console.warn("No symbol provided to fetchTokenDetails");
      return null;
    }

    const allTokens = await fetchAllTokensFromDune();
    console.log("Successfully fetched all tokens data");
    // Find the token in the cache
    const token = allTokens.find(
      (token) => token.symbol.toLowerCase() === symbol.toLowerCase()
    );

    if (!token) {
      console.warn(`Token with symbol ${symbol} not found`);
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error fetching token details:", error);
    return null;
  }
}

// Get time until next refresh using Redis cache
export async function getTimeUntilNextDuneRefresh(): Promise<{
  timeRemaining: number;
  lastRefreshTime: Date;
}> {
  // In preview, simulate a refresh that happened 1 hour ago
  if (IS_PREVIEW) {
    const mockLastRefreshTime = new Date(Date.now() - 30 * 60 * 1000); // 1 hour ago
    const timeRemaining = 30 * 60 * 1000; // 3 hours remaining (out of 4)

    return {
      timeRemaining,
      lastRefreshTime: mockLastRefreshTime,
    };
  }

  try {
    const { timeRemaining, lastRefreshTime } = await getTimeUntilNextRefresh();

    return {
      timeRemaining: timeRemaining || 0,
      lastRefreshTime: lastRefreshTime || new Date(Date.now() - CACHE_DURATION),
    };
  } catch (error) {
    console.error("Error getting time until next Dune refresh:", error);
    // Return default values in case of error
    return {
      timeRemaining: 0,
      lastRefreshTime: new Date(Date.now() - CACHE_DURATION),
    };
  }
}



// Force refresh all Dune data
export async function forceDuneDataRefresh(): Promise<boolean> {
  try {
    console.log("Forcing Dune data refresh...", IS_PREVIEW);
    if (IS_PREVIEW) {
      return true;
    }

    // Try to acquire the refresh lock
    let lockAcquired = false;
    try {
      lockAcquired = await acquireRefreshLock();
    } catch (error) {
      console.error("Error acquiring refresh lock:", error);
      // Continue without lock in case of error
    }

    if (!lockAcquired) {
      return false;
    }

    try {
      // Fetch data from each query separately with error handling
      try {
        await fetchAllTokensFromDune(); // Uses query 5140151
      } catch (error) {
        console.error("Error fetching all tokens data:", error);
      }

      try {
        await fetchMarketCapOverTime(); // Uses query 5119241
        console.log("Successfully fetched market cap over time data");
      } catch (error) {
        console.error("Error fetching market cap over time data:", error);
      }

      // Update refresh timestamps
      const now = Date.now();
      const nextRefresh = now + CACHE_DURATION;

      try {
        await setInCache(CACHE_KEYS.LAST_REFRESH_TIME, now);
        await setInCache(CACHE_KEYS.NEXT_REFRESH_TIME, nextRefresh);
      } catch (error) {
        console.error("Error updating refresh timestamps:", error);
      }

      return true;
    } finally {
      // Always release the lock when done
      try {
        await releaseRefreshLock();
      } catch (error) {
        console.error("Error releasing refresh lock:", error);
      }
    }
  } catch (error) {
    console.error("Error forcing Dune data refresh:", error);
    return false;
  }
}

// This function will be called by the cron job to refresh data
export async function refreshDuneData(): Promise<boolean> {
  try {
    // Skip in preview environments
    if (IS_PREVIEW) {
      return true;
    }

    // Check if it's time to refresh
    let refreshInfo;
    try {
      refreshInfo = await getTimeUntilNextRefresh();
    } catch (error) {
      console.error("Error getting refresh time info:", error);
      // If we can't get refresh info, assume it's time to refresh
      refreshInfo = {
        timeRemaining: 0,
        lastRefreshTime: null,
        nextRefreshTime: null,
      };
    }

    // If more than 1 minutes remaining, skip refresh
    if (refreshInfo.timeRemaining > 1 * 60 * 1000) {
      return false;
    }

    // Try to acquire the refresh lock
    let lockAcquired = false;
    try {
      lockAcquired = await acquireRefreshLock();
    } catch (error) {
      console.error("Error acquiring refresh lock:", error);
    }

    if (!lockAcquired) {
      return false;
    }

    try {
      try {
        await fetchAllTokensFromDune(); // Uses query 5140151
      } catch (error) {
        console.error("Error fetching all tokens data:", error);
      }

      try {
        await fetchMarketCapOverTime(); // Uses query 5119241
      } catch (error) {
        console.error("Error fetching market cap over time data:", error);
      }

      const now = Date.now();
      const nextRefresh = now + CACHE_DURATION;

      try {
        await setInCache(CACHE_KEYS.LAST_REFRESH_TIME, now);
        await setInCache(CACHE_KEYS.NEXT_REFRESH_TIME, nextRefresh);
      } catch (error) {
        console.error("Error updating refresh timestamps:", error);
      }
      console.log("Scheduled data refresh completed successfully");
      return true;
    } finally {
      // Always release the lock when done
      try {
        await releaseRefreshLock();
      } catch (error) {
        console.error("Error releasing refresh lock:", error);
      }
    }
  } catch (error) {
    console.error("Error during scheduled Dune data refresh:", error);
    return false;
  }
}
