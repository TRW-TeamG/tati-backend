import axios, { AxiosInstance } from 'axios'
import { UserAgent } from 'user-agents'

import { Injectable } from '@nestjs/common'

@Injectable()
export class GmgnService {
  private readonly BASE_DEFI_URL = 'https://gmgn.ai/defi/quotation/v1'
  private readonly BASE_API_URL = 'https://gmgn.ai/api/v1'
  private defiClient: AxiosInstance
  private apiClient: AxiosInstance

  constructor() {
    this.initializeClient()
  }

  private initializeClient() {
    const userAgent = new UserAgent({
      deviceCategory: 'desktop',
      platform: 'Win32',
    }).toString()

    this.defiClient = axios.create({
      baseURL: this.BASE_DEFI_URL,
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

    this.apiClient = axios.create({
      baseURL: this.BASE_API_URL,
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

  /**
   * Get the info of a token
   * @see examples/tokenInfo.json
   * @param contractAddress - The address of the token
   * @returns The info of the token
   */
  async getTokenInfo(contractAddress: string) {
    if (!contractAddress) {
      throw new Error('Contract address is required')
    }
    const response = await this.defiClient.get(`/tokens/sol/${contractAddress}`)
    return response.data
  }

  /**
   * Get the trending tokens
   * @see examples/trendingTokens.json
   * @param timeframe - The timeframe of the trending tokens
   * @returns The trending tokens
   */
  async getTrendingTokens(timeframe: '1m' | '5m' | '1h' | '6h' | '24h' = '1h') {
    const url =
      timeframe === '1m'
        ? `/rank/sol/swaps/${timeframe}?orderby=swaps&direction=desc&limit=20`
        : `/rank/sol/swaps/${timeframe}?orderby=swaps&direction=desc&limit=20`

    const response = await this.defiClient.get(url)
    return response.data.data
  }

  /**
   * Get the gas fee
   * @see examples/gasPrice.json
   * @returns The gas fee
   */
  async getGasFee() {
    const response = await this.defiClient.get('/chains/sol/gas_price')
    return response.data.data
  }

  /**
   * Get the USD price of a token
   * @see examples/tokenUsdPrice.json
   * @param contractAddress - The address of the token
   * @returns The USD price of the token
   */
  async getTokenUsdPrice(contractAddress: string) {
    if (!contractAddress) {
      throw new Error('Contract address is required')
    }
    const response = await this.defiClient.get(`/sol/tokens/realtime_token_price?address=${contractAddress}`)
    return response.data.data
  }

  /**
   * Get the info of a wallet
   * @see examples/walletInfo.json
   * @param walletAddress - The address of the wallet
   * @param period - The period of the info
   * @returns The info of the wallet
   */
  async getWalletInfo(walletAddress: string, period: '7d' | '30d' = '7d') {
    if (!walletAddress) {
      throw new Error('Wallet address is required')
    }
    const response = await this.defiClient.get(`/v1/smartmoney/sol/walletNew/${walletAddress}?period=${period}`)
    return response.data.data
  }

  /**
   * Get the holdings of a wallet
   * @see examples/walletHoldings.json
   * @param walletAddress - The address of the wallet
   * @returns The holdings of the wallet
   */
  async getWalletHoldings(walletAddress: string) {
    if (!walletAddress) {
      throw new Error('Wallet address is required')
    }
    const response = await this.apiClient.get(
      `/v1/wallet_holdings/sol/wallet_holdings/${walletAddress}?limit=50&orderby=last_active_timestamp&direction=desc`,
    )
    return response.data.data
  }

  /**
   * Get the activity of a wallet
   * @see examples/walletActivity.json
   * @param walletAddress - The address of the wallet
   * @returns The activity of the wallet
   */
  async getWalletActivity(walletAddress: string) {
    if (!walletAddress) {
      throw new Error('Wallet address is required')
    }
    const response = await this.apiClient.get(
      `/v1/wallet_activity/sol?wallet=${walletAddress}&type=buy&type=sell&limit=50`,
    )
    return response.data.data
  }
}
