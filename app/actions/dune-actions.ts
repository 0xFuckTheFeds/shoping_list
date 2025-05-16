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

// Check if we're in a preview environment or if DUNE_API_KEY is not set
const IS_PREVIEW =
  process.env.VERCEL_ENV === "preview" ||
  process.env.ENABLE_DUNE_API === "false" ||
  !process.env.DUNE_API_KEY;
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
};

// This is your Dune API key from environment variables
const DUNE_API_KEY = process.env.DUNE_API_KEY;

/**
 * Fetch results directly from a Dune query using the results endpoint
 */
async function fetchDuneQueryResults(queryId: number, limit = 1000) {
  if (IS_PREVIEW) {
    // Return mock data based on query ID
    console.log(`Using mock data for query ${queryId} in preview environment`);
    if (queryId === 5140151) {
      return { rows: MOCK_DATA.tokens };
    } else if (queryId === 5119241) {
      return { rows: MOCK_DATA.marketCapTimeData };
    }
    return { rows: [] };
  }

  if (!DUNE_API_KEY) {
    console.error("DUNE_API_KEY is not set");
    return { rows: [] };
  }

  try {
    const response = await fetch(
      `https://api.dune.com/api/v1/query/${queryId}/results?limit=${limit}`,
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
 * Execute a Dune query and return the results
 */
async function executeDuneQuery(
  queryId: number,
  parameters: DuneQueryParameter[] = []
) {
  if (!DUNE_API_KEY) {
    throw new Error("DUNE_API_KEY is not set");
  }

  try {
    // Step 1: Execute the query
    const executeResponse = await fetch(
      `https://api.dune.com/api/v1/query/${queryId}/execute`,
      {
        method: "POST",
        headers: {
          "X-Dune-API-Key": DUNE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parameters }),
      }
    );

    if (!executeResponse.ok) {
      throw new Error(`Failed to execute query: ${executeResponse.statusText}`);
    }

    const executeData = await executeResponse.json();
    const executionId = executeData.execution_id;

    // Step 2: Poll for results
    let executionStatus: DuneExecutionResponse;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Wait a bit between polling attempts
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await fetch(
        `https://api.dune.com/api/v1/execution/${executionId}/status`,
        {
          headers: {
            "X-Dune-API-Key": DUNE_API_KEY,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to get execution status: ${statusResponse.statusText}`
        );
      }

      executionStatus = await statusResponse.json();
      attempts++;
    } while (
      executionStatus.state !== "QUERY_STATE_COMPLETED" &&
      executionStatus.state !== "QUERY_STATE_FAILED" &&
      attempts < maxAttempts
    );

    if (executionStatus.state === "QUERY_STATE_FAILED") {
      throw new Error("Query execution failed");
    }

    if (executionStatus.state !== "QUERY_STATE_COMPLETED") {
      throw new Error("Query execution timed out");
    }

    // Step 3: Get the results
    const resultsResponse = await fetch(
      `https://api.dune.com/api/v1/execution/${executionId}/results`,
      {
        headers: {
          "X-Dune-API-Key": DUNE_API_KEY,
        },
      }
    );

    if (!resultsResponse.ok) {
      throw new Error(`Failed to get results: ${resultsResponse.statusText}`);
    }

    const resultsData = await resultsResponse.json();
    return resultsData.result;
  } catch (error) {
    console.error("Error executing Dune query:", error);
    throw error;
  }
}

/**
 * Fetch volume by token data from Dune query 5119173
 */
async function fetchVolumeByToken(): Promise<VolumeByTokenData[]> {
  try {
    // Check if data exists in cache
    console.log("Using mock volume by token data in preview environment");
    const cachedData = await getFromCache<VolumeByTokenData[]>(
      CACHE_KEYS.VOLUME_TOKENS
    );
    if (cachedData) {
      return cachedData;
    }

    // Use mock data in preview environments
    if (IS_PREVIEW) {
      const tokens = MOCK_DATA.tokens.map((token) => ({
        token: token.token,
        symbol: token.symbol,
        vol_usd: token.vol_usd,
        txs: token.txs,
        created_time: token.created_time,
      }));

      // Store in cache
      await setInCache(CACHE_KEYS.VOLUME_TOKENS, tokens);
      return tokens;
    }

    console.log("Fetching volume by token data from Dune");
    const result = await fetchDuneQueryResults(5140151, 1000);

    if (result && result.rows && result.rows.length > 0) {
      // Process the data from the query
      const tokens = result.rows.map((row: any) => {
        return {
          token: row.token,
          symbol: row.symbol,
          vol_usd: Number.parseFloat(row.vol_usd || 0),
          txs: Number.parseInt(row.txs || 0),
          created_time: row.created_time,
        };
      });

      // Store in cache
      await setInCache(CACHE_KEYS.VOLUME_TOKENS, tokens);
      return tokens;
    }

    throw new Error("No volume data returned from Dune query");
  } catch (error) {
    console.error("Error fetching volume by token data from Dune:", error);
    return [];
  }
}

/**
 * Fetch all token data directly from Dune query 5129959 (Pie Chart of Believe Coins by Market Cap)
 * This is used internally by the paginated function
 */
async function fetchAllTokensFromDune(): Promise<TokenData[]> {
  try {
    // Check if data exists in cache
    // const cachedData = await getFromCache<TokenData[]>(CACHE_KEYS.ALL_TOKENS)
    // console.log(cachedData, "HHHHHHHHHHHHHHHHHHH")
    // if (cachedData && cachedData.length > 0) {
    //   return cachedData
    // }

    // Use mock data in preview environments
    if (IS_PREVIEW) {
      const mockData = [...MOCK_DATA.tokens];
      await setInCache(CACHE_KEYS.ALL_TOKENS, mockData);
      return mockData;
    }

    // Use the new query 5140151 which has all the data we need
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
  sortDirection = "desc"
): Promise<PaginatedTokenResponse> {
  try {
    // Get all tokens from cache or fetch if needed
    const allTokens = await fetchAllTokensFromDune();

    // Calculate total tokens and pages
    const totalTokens = allTokens.length;
    const totalPages = Math.ceil(totalTokens / pageSize) || 1;

    // Sort the tokens based on the requested sort field and direction
    const sortedTokens = [...allTokens].sort((a, b) => {
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
      `Fetching page ${page} (${startIndex}-${endIndex}) of ${totalPages} pages`
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
    const cachedData = await getFromCache<MarketCapTimeData[]>(
      CACHE_KEYS.MARKET_CAP_TIME
    );
    if (cachedData && cachedData.length > 0) {
      return cachedData;
    }

    // Use mock data in preview environments
    console.log("Using mock market cap time data in preview environment");
    if (IS_PREVIEW) {
      const mockData = [...MOCK_DATA.marketCapTimeData];
      await setInCache(CACHE_KEYS.MARKET_CAP_TIME, mockData);
      return mockData;
    }

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
    // Check if data exists in cache
    const cachedData = await getFromCache<TokenMarketCapData[]>(
      CACHE_KEYS.TOKEN_MARKET_CAPS
    );
    if (cachedData && cachedData.length > 0) {
      return cachedData;
    }

    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log("Using mock token market cap data in preview environment");
      const mockData = [...MOCK_DATA.tokenMarketCaps];
      await setInCache(CACHE_KEYS.TOKEN_MARKET_CAPS, mockData);
      return mockData;
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

      // Store in cache
      await setInCache(CACHE_KEYS.TOKEN_MARKET_CAPS, data);
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

    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log("Using mock total market cap data in preview environment");
      const mockData = { ...MOCK_DATA.totalMarketCap };
      await setInCache(CACHE_KEYS.TOTAL_MARKET_CAP, mockData);
      return mockData;
    }

    // IMPORTANT: Make sure we're using query 5140151 consistently
    const result = await fetchDuneQueryResults(5140151);

    if (result && result.rows && result.rows.length > 0) {
      // Calculate total market cap by summing all token market caps
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

    // Use mock data in preview environments
    if (IS_PREVIEW) {
      console.log("Using mock new token data in preview environment");
      const mockData = [...MOCK_DATA.newTokens];
      await setInCache(CACHE_KEYS.NEW_TOKENS, mockData);
      return mockData.slice(0, limit);
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
    // // Check if data exists in cache
    // const cachedData = await getFromCache<MarketStats>(CACHE_KEYS.MARKET_STATS);
    // if (cachedData && cachedData.totalMarketCap !== undefined) {
    //   return cachedData;
    // }

    // Use mock data in preview environments
    if (IS_PREVIEW) {
      const mockData = { ...MOCK_DATA.marketStats };
      await setInCache(CACHE_KEYS.MARKET_STATS, mockData);
      return mockData;
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
      console.log(data, "MARKET STATS")
      await setInCache(CACHE_KEYS.MARKET_STATS, data);
      console.log(await getFromCache<MarketStats>(CACHE_KEYS.MARKET_STATS), "MARKET STATS CACHE")
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

    // Use mock data in preview environments
    if (IS_PREVIEW) {
      const token = MOCK_DATA.tokens.find(
        (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
      );
      return token || null;
    }

    // Get all tokens from cache or fetch if needed
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
    const mockLastRefreshTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const timeRemaining = 3 * 60 * 60 * 1000; // 3 hours remaining (out of 4)

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

    // If more than 30 minutes remaining, skip refresh
    if (refreshInfo.timeRemaining > 30 * 60 * 1000) {
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
