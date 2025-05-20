export interface DuneQueryParameter {
  key: string
  value: string | number | boolean
  type: "text" | "number" | "date" | "datetime"
}

export interface DuneExecutionResponse {
  execution_id: string
  query_id: number
  state: "QUERY_STATE_PENDING" | "QUERY_STATE_EXECUTING" | "QUERY_STATE_FAILED" | "QUERY_STATE_COMPLETED"
  submitted_at: string
  expires_at: string
  execution_started_at?: string
  execution_ended_at?: string
  result?: DuneQueryResult
}

export interface DuneQueryResult {
  rows: any[]
  metadata: {
    column_names: string[]
    column_types: string[]
  }
}

export interface VolumeByTokenData {
  token: string 
  symbol: string 
  vol_usd: number 
  txs: number 
  created_time: string 
}

export interface TokenData {
  token: string 
  symbol: string 
  vol_usd: number 
  txs: number 
  created_time: string 
  price?: number
  marketCap?: number
  change24h?: number
  change30m?: number
  liquidity?: number
  holders?: number
  buys?: number
  sells?: number
  description?: string
  volume24h?: number
  name?: string
  num_holders?: number
  changeM5?: number
}

export interface PaginatedTokenResponse {
  tokens: TokenData[]
  page: number
  pageSize: number
  totalTokens: number
  totalPages: number
}

export interface MarketStats {
  totalMarketCap: number
  volume24h: number
  transactions24h: number
  feeEarnings24h: number
  lifetimeVolume: number
  coinLaunches: number
}

export interface MarketCapTimeData {
  date: string
  marketcap: number
  num_holders: number
  nh_diff_1d: number
  nh_diff_7d: number
  nh_diff_30d: number
}

export interface TokenMarketCapData {
  date: string
  token_mint_address: string
  name: string
  symbol: string
  market_cap_usd: number
  num_holders: number
  rn: number
}

export interface TotalMarketCapData {
  latest_data_at: string
  total_marketcap_usd: number
}

export interface NewTokenData {
  token_mint_address: string
  created_time: string
  name?: string
  symbol?: string
  market_cap_usd?: number
  num_holders: number
}
