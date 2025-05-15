import type { TokenData, MarketCapTimeData } from "@/types/dune"

// Mock token data for development and testing
export const mockTokenData: TokenData[] = [
  {
    token: "ENfpbQUM5xAnNP8ecyEQGFJ6KwbuPjMwv7ZjR29cDuAb",
    token_url: "ENfpbQUM5xAnNP8ecyEQGFJ6KwbuPjMwv7ZjR29cDuAb",
    symbol: "GOONC",
    name: "gooncoin",
    vol_usd: 176022297.64085126,
    txs: 229575,
    created_time: "2025-05-13 02:20",
    first_trade_time: "2025-05-13 02:21",
    description: "gooncoin (GOONC)",
    price: 0.00000215,
    marketCap: 30495506.827445645,
    num_holders: 7419,
    change24h: 4.2,
    change1h: 1.8,
    liquidity: 4500000,
    buys: 1500,
    sells: 1000,
    volume24h: 176022297.64085126,
  },
  {
    token: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
    token_url: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
    symbol: "DASHC",
    name: "Dashcoin",
    vol_usd: 1500000,
    txs: 2500,
    created_time: "2025-01-15T00:00:00Z",
    first_trade_time: "2025-01-15T00:10:00Z",
    description: "Dashcoin (DASHC)",
    price: 0.00000215,
    marketCap: 21500000,
    num_holders: 12500,
    change24h: 4.2,
    change1h: 1.8,
    liquidity: 4500000,
    buys: 1500,
    sells: 1000,
    volume24h: 1500000,
  },
  {
    token: "FLWRna1gxehQ9pSyZMzxfp4UhewvLPwuKfdUTgdZuMBY",
    token_url: "FLWRna1gxehQ9pSyZMzxfp4UhewvLPwuKfdUTgdZuMBY",
    symbol: "FLWR",
    name: "Flower Token",
    vol_usd: 980000,
    txs: 1800,
    created_time: "2025-02-01T00:00:00Z",
    first_trade_time: "2025-02-01T00:15:00Z",
    description: "Flower Token (FLWR)",
    price: 0.00000187,
    marketCap: 18700000,
    num_holders: 9800,
    change24h: 3.1,
    change1h: 1.2,
    liquidity: 3200000,
    buys: 1200,
    sells: 600,
    volume24h: 980000,
  },
  {
    token: "DogmxJUXJgkfLB1e7qC3jYxs3ynx3DFMcZP6BBcRwXb6",
    token_url: "DogmxJUXJgkfLB1e7qC3jYxs3ynx3DFMcZP6BBcRwXb6",
    symbol: "DOGMX",
    name: "DogMax",
    vol_usd: 2100000,
    txs: 3200,
    created_time: "2025-01-20T00:00:00Z",
    first_trade_time: "2025-01-20T00:20:00Z",
    description: "DogMax (DOGMX)",
    price: 0.00000142,
    marketCap: 14200000,
    num_holders: 15600,
    change24h: 2.5,
    change1h: 0.8,
    liquidity: 2500000,
    buys: 2000,
    sells: 1200,
    volume24h: 2100000,
  },
  {
    token: "BonkrzBnUXSC2oQKJHJMCgfzUEJJJJJJJJJJJJJJJJJJ",
    token_url: "BonkrzBnUXSC2oQKJHJMCgfzUEJJJJJJJJJJJJJJJJJJ",
    symbol: "BONK",
    name: "Bonk",
    vol_usd: 5800000,
    txs: 8500,
    created_time: "2024-12-01T00:00:00Z",
    first_trade_time: "2024-12-01T00:25:00Z",
    description: "Bonk (BONK)",
    price: 0.00000215,
    marketCap: 215000000,
    num_holders: 85000,
    change24h: 4.2,
    change1h: 1.8,
    liquidity: 4500000,
    buys: 5500,
    sells: 3000,
    volume24h: 5800000,
  },
  {
    token: "WifSoLGeL1DqzUyU9PV4sGe1AqWzBEbSJAGtK1dvWd8",
    token_url: "WifSoLGeL1DqzUyU9PV4sGe1AqWzBEbSJAGtK1dvWd8",
    symbol: "WIF",
    name: "Wif",
    vol_usd: 4200000,
    txs: 6800,
    created_time: "2024-11-15T00:00:00Z",
    first_trade_time: "2024-11-15T00:30:00Z",
    description: "Wif (WIF)",
    price: 0.00000187,
    marketCap: 187000000,
    num_holders: 68000,
    change24h: 3.1,
    change1h: 1.2,
    liquidity: 3200000,
    buys: 4200,
    sells: 2600,
    volume24h: 4200000,
  },
  {
    token: "DUPEXxEcEZFXV1dsvAX9xY7PGipJCCmkRX5cQ9iPTbx9",
    token_url: "DUPEXxEcEZFXV1dsvAX9xY7PGipJCCmkRX5cQ9iPTbx9",
    symbol: "DUPE",
    name: "Dupe",
    vol_usd: 2800000,
    txs: 4500,
    created_time: "2024-12-20T00:00:00Z",
    first_trade_time: "2024-12-20T00:35:00Z",
    description: "Dupe (DUPE)",
    price: 0.00000098,
    marketCap: 98000000,
    num_holders: 45000,
    change24h: 1.2,
    change1h: 0.3,
    liquidity: 1800000,
    buys: 2800,
    sells: 1700,
    volume24h: 2800000,
  },
  {
    token: "BOMExJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
    token_url: "BOMExJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
    symbol: "BOME",
    name: "Bome",
    vol_usd: 2100000,
    txs: 3800,
    created_time: "2025-01-05T00:00:00Z",
    first_trade_time: "2025-01-05T00:40:00Z",
    description: "Bome (BOME)",
    price: 0.00000076,
    marketCap: 76000000,
    num_holders: 38000,
    change24h: -1.5,
    change1h: -0.5,
    liquidity: 1500000,
    buys: 1800,
    sells: 2000,
    volume24h: 2100000,
  },
  {
    token: "GOONxJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
    token_url: "GOONxJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
    symbol: "GOON",
    name: "Goon",
    vol_usd: 3500000,
    txs: 5200,
    created_time: "2024-12-10T00:00:00Z",
    first_trade_time: "2024-12-10T00:45:00Z",
    description: "Goon (GOON)",
    price: 0.00000142,
    marketCap: 142000000,
    num_holders: 52000,
    change24h: 2.5,
    change1h: 0.8,
    liquidity: 2500000,
    buys: 3200,
    sells: 2000,
    volume24h: 3500000,
  },
  {
    token: "CATZxJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
    token_url: "CATZxJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
    symbol: "CATZ",
    name: "Catz",
    vol_usd: 1800000,
    txs: 3100,
    created_time: "2025-01-25T00:00:00Z",
    first_trade_time: "2025-01-25T00:50:00Z",
    description: "Catz (CATZ)",
    price: 0.00000065,
    marketCap: 65000000,
    num_holders: 31000,
    change24h: 1.8,
    change1h: 0.6,
    liquidity: 1200000,
    buys: 1700,
    sells: 1400,
    volume24h: 1800000,
  },
  {
    token: "DOGZxJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
    token_url: "DOGZxJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
    symbol: "DOGZ",
    name: "Dogz",
    vol_usd: 2200000,
    txs: 3600,
    created_time: "2025-01-10T00:00:00Z",
    first_trade_time: "2025-01-10T00:55:00Z",
    description: "Dogz (DOGZ)",
    price: 0.00000089,
    marketCap: 89000000,
    num_holders: 36000,
    change24h: 2.2,
    change1h: 0.7,
    liquidity: 1600000,
    buys: 2000,
    sells: 1600,
    volume24h: 2200000,
  },
]

// Generate mock market cap time data
export function generateMockMarketCapTimeData(): MarketCapTimeData[] {
  const timeSeriesData: MarketCapTimeData[] = []
  const today = new Date()

  // Calculate total market cap from mock token data
  const totalMarketCap = mockTokenData.reduce((sum, token) => sum + (token.marketCap || 0), 0)
  const totalHolders = mockTokenData.reduce((sum, token) => sum + (token.num_holders || 0), 0)

  // Create synthetic data points for the last 30 days
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
}

// Get mock data for a specific Dune query
export function getMockDataForQuery(queryId: number) {
  // List of disabled queries
  const DISABLED_QUERIES = [5129959, 5130872, 5129347, 5119173]

  // Add a warning log for disabled queries
  if (DISABLED_QUERIES.includes(queryId)) {
    console.log(`WARNING: Accessing mock data for disabled query ${queryId}. This query should not be used directly.`)
  }

  switch (queryId) {
    case 5119241: // Market cap over time data - this is the only query we still use directly
      return {
        rows: generateMockMarketCapTimeData(),
      }
    case 5140151: // New comprehensive token data - this is our main query now
      return {
        rows: mockTokenData,
      }
    // For all other queries, we'll derive the data from mockTokenData
    case 5119173: // Volume by token data
      return {
        rows: mockTokenData.map((token) => ({
          token: token.token,
          symbol: token.symbol,
          vol_usd: token.vol_usd,
          txs: token.txs,
          created_time: token.created_time,
        })),
      }
    case 5129959: // Token market cap data for pie chart
      return {
        rows: mockTokenData.map((token, index) => ({
          date: new Date().toISOString().split("T")[0],
          token_mint_address: token.token,
          name: token.name || "",
          symbol: token.symbol,
          market_cap_usd: token.marketCap || 0,
          num_holders: token.num_holders || 0,
          rn: index + 1,
        })),
      }
    case 5130872: // Total market cap data
      return {
        rows: [
          {
            latest_data_at: new Date().toISOString(),
            total_marketcap_usd: mockTokenData.reduce((sum, token) => sum + (token.marketCap || 0), 0),
          },
        ],
      }
    case 5129347: // New token data
      return {
        rows: mockTokenData
          .sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())
          .slice(0, 5)
          .map((token) => ({
            token_mint_address: token.token,
            created_time: token.created_time,
            name: token.name || "Unknown",
            symbol: token.symbol,
            market_cap_usd: token.marketCap,
            num_holders: token.num_holders || 0,
          })),
      }
    default:
      console.log(`No mock data available for query ${queryId}`)
      return {
        rows: [],
      }
  }
}
