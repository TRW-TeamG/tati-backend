import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { Address, Rpc, SolanaRpcApi, createSolanaRpc } from '@solana/web3.js'

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name)

  private readonly _rpc: Rpc<SolanaRpcApi>

  constructor(private readonly config: ConfigService) {
    this._rpc = createSolanaRpc(this.config.get<string>('solana.endpoint'))
  }

  get rpc() {
    return this._rpc
  }

  async getSolBalance(source: Address) {
    return this._rpc.getBalance(source)
  }
}
