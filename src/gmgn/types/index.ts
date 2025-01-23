export interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  price: number
  price_change_24h: number
  volume_24h: number
  market_cap: number
  total_supply: number
  holders: number
  transactions: number
  is_verified: boolean
  is_mintable: boolean
  is_blacklisted: boolean
  created_at: string
  last_updated_at: string
  social_links?: {
    website?: string
    twitter?: string
    telegram?: string
    discord?: string
  }
}

export interface TrendingToken {
  address: string
  name: string
  symbol: string
  price: number
  price_change: number
  volume: number
  swaps: number
  holders: number
  market_cap: number
  created_at: string
}

export interface GasPrice {
  current: number
  average: number
  max: number
  min: number
  updated_at: string
}

export interface TokenUsdPrice {
  price: number
  timestamp: number
  volume_24h: number
  price_change_24h: number
}

export interface WalletInfo {
  address: string
  balance: number
  total_value_usd: number
  pnl: number
  pnl_percentage: number
  trades: {
    total: number
    successful: number
    failed: number
  }
  tags: string[]
  last_active: string
  created_at: string
}

export interface WalletHolding {
  token_address: string
  token_name: string
  token_symbol: string
  balance: number
  value_usd: number
  percentage_of_total: number
  last_active_timestamp: number
}

export interface WalletActivity {
  transaction_hash: string
  timestamp: number
  type: 'buy' | 'sell'
  token_address: string
  token_name: string
  token_symbol: string
  amount: number
  price_usd: number
  total_value_usd: number
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
