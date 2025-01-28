import axios, { AxiosInstance } from 'axios'
import { Cache } from 'cache-manager'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface Trade {
  tx: string
  amount: number
  priceUsd: number
  volume: number
  volumeSol: number
  type: 'buy' | 'sell'
  wallet: string
  time: number
  program: string
}

export interface TradesResponse {
  trades: Trade[]
  nextCursor?: number
  hasNextPage: boolean
}

export interface TrendingToken {
  token: {
    name: string
    symbol: string
    mint: string
    uri: string
    decimals: number
    image: string
    description: string
    hasFileMetaData: boolean
  }
  pools: any[] // Define specific pool type if needed
  events: any // Define specific events type if needed
  risk: any // Define specific risk type if needed
}

@Injectable()
export class SoltrackerService {
  private readonly client: AxiosInstance
  private readonly BASE_URL = 'https://data.solanatracker.io'
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'x-api-key': this.config.get<string>('soltracker.apiKey'),
      },
    })
  }

  async getTradesByWallet(
    tokenAddress: string,
    walletAddress: string,
    options?: {
      cursor?: number
      showMeta?: boolean
      parseJupiter?: boolean
      hideArb?: boolean
    },
  ): Promise<TradesResponse> {
    const params = new URLSearchParams()
    if (options?.cursor) params.append('cursor', options.cursor.toString())
    if (options?.showMeta) params.append('showMeta', 'true')
    if (options?.parseJupiter) params.append('parseJupiter', 'true')
    if (options?.hideArb) params.append('hideArb', 'true')

    const requestUrl = `/trades/${tokenAddress}/by-wallet/${walletAddress}?${params.toString()}`
    const response = await this.client.get(requestUrl)
    return response.data
  }

  async getTrendingTokens(
    timeframe?: '5m' | '15m' | '30m' | '1h' | '2h' | '3h' | '4h' | '5h' | '6h' | '12h' | '24h',
  ): Promise<TrendingToken[]> {
    const cacheKey = `trending_tokens_${timeframe || 'default'}`

    // Try to get from cache first
    const cachedData = await this.cacheManager.get<TrendingToken[]>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // If not in cache, fetch from API
    const endpoint = timeframe ? `/tokens/trending/${timeframe}` : '/tokens/trending'
    const response = await this.client.get(endpoint)
    const tokens = response.data

    // Calculate cache TTL based on timeframe
    let cacheTTL = this.CACHE_TTL
    if (timeframe) {
      const timeframeMinutes = parseInt(timeframe.replace(/[mh]/, '')) * (timeframe.endsWith('h') ? 60 : 1)
      // cache for at least CACHE_TTL
      cacheTTL = Math.max(timeframeMinutes * 60 * 1000, this.CACHE_TTL)
    }

    // Store in cache
    await this.cacheManager.set(cacheKey, tokens, cacheTTL)

    return tokens
  }

  private getTimeframeMs(timeframe: '1h' | '6h' | '24h'): number {
    return {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    }[timeframe]
  }

  /*
    Returns the array of signatures of the trades if they exist, otherwise returns null
    This is used to verify that the trade exists and is valid
  */
  async verifyTokenTrade(
    tokenAddress: string,
    walletAddress: string,
    type: 'buy' | 'sell',
    options?: {
      amount?: number
      timeframe?: '1h' | '6h' | '24h'
    },
  ): Promise<string[] | null> {
    try {
      let cursor: number | undefined
      let allTrades: Trade[] = []

      // Fetch all pages of trades
      do {
        const trades = await this.getTradesByWallet(tokenAddress, walletAddress, {
          hideArb: true,
          cursor,
        })

        allTrades = [...allTrades, ...trades.trades]
        cursor = trades.nextCursor
      } while (cursor)

      if (!allTrades.length) {
        return null
      }

      // Filter trades by type and timeframe
      const filteredTrades = allTrades.filter((trade) => {
        const isCorrectType = trade.type === type
        if (!isCorrectType) return false

        if (options?.timeframe) {
          const timeframeMs = this.getTimeframeMs(options.timeframe)
          const isWithinTimeframe = Date.now() - trade.time < timeframeMs
          if (!isWithinTimeframe) return false
        }

        if (options?.amount) {
          const diff = Math.abs(trade.volumeSol - options.amount)
          if (diff > options.amount * 0.05) return false
        }

        return true
      })

      return filteredTrades.length > 0 ? filteredTrades.map((trade) => trade.tx) : null
    } catch (error) {
      console.error('Error verifying token trade:', error)
      return null
    }
  }
}
