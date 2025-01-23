import axios, { AxiosInstance } from 'axios'
import { UserAgent } from 'user-agents'

import { HttpException, Injectable } from '@nestjs/common'

@Injectable()
export class GmgnService {
  private readonly BASE_URL = 'https://gmgn.ai/defi/quotation'
  private client: AxiosInstance

  constructor() {
    this.initializeClient()
  }

  private initializeClient() {
    const userAgent = new UserAgent({
      deviceCategory: 'desktop',
      platform: 'Win32',
    }).toString()

    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        Host: 'gmgn.ai',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        DNT: '1',
        Priority: 'u=1, i',
        Referer: 'https://gmgn.ai/?chain=sol',
        'User-Agent': userAgent,
      },
    })
  }

  async getTokenInfo(contractAddress: string) {
    if (!contractAddress) {
      throw new HttpException('Contract address is required', 400)
    }
    const response = await this.client.get(`/v1/tokens/sol/${contractAddress}`)
    return response.data
  }

  async getNewPairs(limit: number = 50) {
    if (limit > 50) {
      throw new HttpException('Cannot fetch more than 50 pairs', 400)
    }
    const response = await this.client.get(
      `/v1/pairs/sol/new_pairs?limit=${limit}&orderby=open_timestamp&direction=desc&filters[]=not_honeypot`,
    )
    return response.data.data
  }

  async getTrendingWallets(timeframe: '1d' | '7d' | '30d' = '7d', walletTag: string = 'smart_degen') {
    const response = await this.client.get(
      `/v1/rank/sol/wallets/${timeframe}?tag=${walletTag}&orderby=pnl_${timeframe}&direction=desc`,
    )
    return response.data.data
  }

  async getTrendingTokens(timeframe: '1m' | '5m' | '1h' | '6h' | '24h' = '1h') {
    const url =
      timeframe === '1m'
        ? `/v1/rank/sol/swaps/${timeframe}?orderby=swaps&direction=desc&limit=20`
        : `/v1/rank/sol/swaps/${timeframe}?orderby=swaps&direction=desc`

    const response = await this.client.get(url)
    return response.data.data
  }

  async getTokensByCompletion(limit: number = 50) {
    if (limit > 50) {
      throw new HttpException('Limit cannot be above 50', 400)
    }
    const response = await this.client.get(`/v1/rank/sol/pump?limit=${limit}&orderby=progress&direction=desc&pump=true`)
    return response.data.data
  }

  async findSnipedTokens(size: number = 10) {
    if (size > 39) {
      throw new HttpException('Size cannot be more than 39', 400)
    }
    const response = await this.client.get(`/v1/signals/sol/snipe_new?size=${size}&is_show_alert=false&featured=false`)
    return response.data.data
  }

  async getGasFee() {
    const response = await this.client.get('/v1/chains/sol/gas_price')
    return response.data.data
  }

  async getTokenUsdPrice(contractAddress: string) {
    if (!contractAddress) {
      throw new HttpException('Contract address is required', 400)
    }
    const response = await this.client.get(`/v1/sol/tokens/realtime_token_price?address=${contractAddress}`)
    return response.data.data
  }

  async getTopBuyers(contractAddress: string) {
    if (!contractAddress) {
      throw new HttpException('Contract address is required', 400)
    }
    const response = await this.client.get(`/v1/tokens/top_buyers/sol/${contractAddress}`)
    return response.data.data
  }

  async getSecurityInfo(contractAddress: string) {
    if (!contractAddress) {
      throw new HttpException('Contract address is required', 400)
    }
    const response = await this.client.get(`/v1/tokens/security/sol/${contractAddress}`)
    return response.data.data
  }

  async getWalletInfo(walletAddress: string, period: '7d' | '30d' = '7d') {
    if (!walletAddress) {
      throw new HttpException('Wallet address is required', 400)
    }
    const response = await this.client.get(`/v1/smartmoney/sol/walletNew/${walletAddress}?period=${period}`)
    return response.data.data
  }
}
