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
  CACHE_DURATION_LONG,
  getQueryLastRefreshTime,
  setQueryLastRefreshTime,
  getQueryTimeUntilNextRefresh
} from "@/lib/redis";
import { cache } from "react";

const IS_PREVIEW =
  process.env.VERCEL_ENV === "preview" ||
  process.env.ENABLE_DUNE_API === "false" ||
  !process.env.DUNE_API_KEY;

const DUNE_API_KEY = process.env.DUNE_API_KEY;

async function fetchDuneQueryResults(queryId: number, limit = 1000) {
  if (!DUNE_API_KEY) {
    console.error("DUNE_API_KEY is not set");
    return { rows: [] };
  }

  try {
    const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results?limit=${limit}`,
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

export async function fetchAllTokensFromDune(): Promise<TokenData[]> {
  try {
    const { lastRefreshTime } = await getQueryTimeUntilNextRefresh(
      CACHE_KEYS.ALL_TOKENS_LAST_REFRESH,
      CACHE_DURATION
    );

    if ((Date.now() - lastRefreshTime.getTime()) < CACHE_DURATION) {
      const cachedData = await getFromCache<TokenData[]>(CACHE_KEYS.ALL_TOKENS);
      if (cachedData && cachedData.length > 0) {
        console.log("Last refresh time less than 1 hour, fetching all tokens data from cache");
        return cachedData;
      }
    }

    console.log("It's time to refresh fetching all tokens data from dune");
    const result = await fetchDuneQueryResults(5140151);
    
    if (result && result.rows && result.rows.length > 0) {
      const tokens = result.rows.map((row: any) => {
        return {
          token: row.token || "",
          symbol: row.symbol || "",
          name: row.name || "",
          vol_usd: Number.parseFloat(row.vol_usd || 0),
          txs: Number.parseInt(row.txs || 0),
          created_time: row.created_time || new Date().toISOString(),
          description: row.name ? `${row.name} (${row.symbol || ""})` : "",
          price: 0, 
          marketCap: Number.parseFloat(row.market_cap_usd || 0),
          num_holders: Number.parseInt(row.num_holders || 0),
          change24h: 0, 
          change1h: 0, 
          liquidity: 0, 
          buys: 0, 
          sells: 0, 
          volume24h: Number.parseFloat(row.vol_usd || 0),
          token_url: row.token_url || "",
          first_trade_time: row.first_trade_time || "",
        };
      });

      const sortedTokens = tokens.sort(
        (a: any, b: any) => (b.marketCap || 0) - (a.marketCap || 0)
      );

      await setInCache(CACHE_KEYS.ALL_TOKENS, sortedTokens);
      await setQueryLastRefreshTime(CACHE_KEYS.ALL_TOKENS_LAST_REFRESH);
      
      return sortedTokens;
    }

    console.warn("No data returned from Dune query, using empty array");
    return [];
  } catch (error) {
    console.error("Error fetching token data from Dune:", error);
    return [];
  }
}

export async function fetchPaginatedTokens(
  page = 1,
  pageSize = 10,
  sortField = "marketCap",
  sortDirection = "desc",
  searchTerm = ""
): Promise<PaginatedTokenResponse> {
  try {
    const allTokens = await fetchAllTokensFromDune();

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

    const totalTokens = filteredTokens.length;
    const totalPages = Math.ceil(totalTokens / pageSize) || 1;
    const sortedTokens = [...filteredTokens].sort((a, b) => {
      const aValue = a[sortField as keyof typeof a] || 0;
      const bValue = b[sortField as keyof typeof a] || 0;

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalTokens);
    const pageTokens = sortedTokens.slice(startIndex, endIndex);

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

export async function fetchTokenData(): Promise<TokenData[]> {
  try {
    const paginatedResponse = await fetchPaginatedTokens(1, 10);
    return paginatedResponse.tokens;
  } catch (error) {
    console.error("Error in fetchTokenData:", error);
    return [];
  }
}

export async function fetchMarketCapOverTime(): Promise<MarketCapTimeData[]> {
  const MARKET_CAP_QUERY_ID = 5119241;
  try {
    const { lastRefreshTime } = await getQueryTimeUntilNextRefresh(
      CACHE_KEYS.MARKET_CAP_TIME_LAST_REFRESH,
      CACHE_DURATION_LONG
    );

    if ((Date.now() - lastRefreshTime.getTime()) < CACHE_DURATION_LONG) {
      const cachedData = await getFromCache<MarketCapTimeData[]>(CACHE_KEYS.MARKET_CAP_TIME);
      if (cachedData && cachedData.length > 0) {
        console.log("Market cap time: Less than 12 hours since last refresh, using cache");
        return cachedData;
      }
    }

    console.log("Market cap time: More than 12 hours since last refresh, fetching from Dune");
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

      await setInCache(CACHE_KEYS.MARKET_CAP_TIME, data);
      await setQueryLastRefreshTime(CACHE_KEYS.MARKET_CAP_TIME_LAST_REFRESH);
      
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

export async function fetchTokenMarketCaps(): Promise<TokenMarketCapData[]> {
  try {
    // const { lastRefreshTime } = await getQueryTimeUntilNextRefresh(
    //   CACHE_KEYS.TOKEN_MARKET_CAPS_LAST_REFRESH,
    //   CACHE_DURATION
    // );
    
    // if ((Date.now() - lastRefreshTime.getTime()) < CACHE_DURATION) {
    //   const cachedData = await getFromCache<TokenMarketCapData[]>(
    //     CACHE_KEYS.TOKEN_MARKET_CAPS
    //   );
    //   if (cachedData && cachedData.length > 0) {
    //     console.log("Token market caps: Less than 1 hour since last refresh, using cache");
    //     return cachedData;
    //   }
    // }

    // console.log("Token market caps: More than 1 hour since last refresh, fetching from Dune");
      const result = await fetchDuneQueryResults(5140151);

    if (result && result.rows && result.rows.length > 0) {
      const currentDate = new Date().toISOString().split("T")[0];

      const data = result.rows.map((row: any, index: number) => ({
        date: currentDate,
        token_mint_address: row.token || "",
        name: row.name || "Unknown",
        symbol: row.symbol || "???",
        market_cap_usd: Number.parseFloat(row.market_cap_usd || 0),
        num_holders: Number.parseInt(row.num_holders || 0),
        rn: index + 1,
      }));

      await setInCache(CACHE_KEYS.TOKEN_MARKET_CAPS, data);
      await setQueryLastRefreshTime(CACHE_KEYS.TOKEN_MARKET_CAPS_LAST_REFRESH);
      
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

export async function fetchTotalMarketCap(): Promise<TotalMarketCapData> {
  try {
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

export async function fetchNewTokens(limit = 10): Promise<NewTokenData[]> {
  try {
    const cachedData = await getFromCache<NewTokenData[]>(
      CACHE_KEYS.NEW_TOKENS
    );
    if (cachedData) {
      return cachedData.slice(0, limit);
    }

    const result = await fetchDuneQueryResults(5140151);

    if (result && result.rows && result.rows.length > 0) {
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

      await setInCache(CACHE_KEYS.NEW_TOKENS, data);
      return data.slice(0, limit);
    }

    throw new Error("No new token data returned from Dune query");
  } catch (error) {
    console.error("Error fetching new token data:", error);
    return [];
  }
}

export async function fetchMarketStats(): Promise<MarketStats> {
  try {
    const { lastRefreshTime } = await getQueryTimeUntilNextRefresh(
      CACHE_KEYS.MARKET_STATS_LAST_REFRESH,
      CACHE_DURATION
    );
    
    if ((Date.now() - lastRefreshTime.getTime()) < CACHE_DURATION) {
      const cachedData = await getFromCache<MarketStats>(CACHE_KEYS.MARKET_STATS);
      if (cachedData && cachedData.totalMarketCap !== undefined) {
        console.log("Market stats: Less than 1 hour since last refresh, using cache");
        return cachedData;
      }
    }

    console.log("Market stats: More than 1 hour since last refresh, fetching from Dune");
    const result = await fetchDuneQueryResults(5140151);

    if (result && result.rows && result.rows.length > 0) {
      const totalMarketCap = result.rows.reduce((sum: number, row: any) => {
        return sum + Number.parseFloat(row.market_cap_usd || 0);
      }, 0);

      const volume24h = result.rows.reduce((sum: number, row: any) => {
        return sum + Number.parseFloat(row.vol_usd || 0);
      }, 0);
      const transactions24h = result.rows.reduce((sum: number, row: any) => {
        return sum + Number.parseInt(row.txs || 0);
      }, 0);
      const feeEarnings24h = volume24h * 0.003;
      const coinLaunches = result.rows.length;
      const data = {
        totalMarketCap,
        volume24h,
        transactions24h,
        feeEarnings24h,
        lifetimeVolume: volume24h * 30,
        coinLaunches,
      };

      await setInCache(CACHE_KEYS.MARKET_STATS, data);
      await setQueryLastRefreshTime(CACHE_KEYS.MARKET_STATS_LAST_REFRESH);
      
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

export async function getTimeUntilNextDuneRefresh(): Promise<{
  timeRemaining: number;
  lastRefreshTime: Date;
}> {
  try {
    const { timeRemaining, lastRefreshTime } = await getTimeUntilNextRefresh();

    return {
      timeRemaining: timeRemaining || 0,
      lastRefreshTime: lastRefreshTime || new Date(Date.now() - CACHE_DURATION),
    };
  } catch (error) {
    console.error("Error getting time until next Dune refresh:", error);
    return {
      timeRemaining: 0,
      lastRefreshTime: new Date(Date.now() - CACHE_DURATION),
    };
  }
}