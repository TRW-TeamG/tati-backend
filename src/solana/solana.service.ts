import bs58 from 'bs58'

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import {
  Commitment,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  SimulateTransactionConfig,
  VersionedTransaction,
} from '@solana/web3.js'

import { WrappedInstruction, transactionBuilder } from './lib/transaction-builder'
import { SendAndConfirmOnceInput } from './types'
import { SendAndConfirmInput } from './types'

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name)

  private readonly _rpc: Connection
  private readonly _serverKeypair: Keypair

  constructor(private readonly config: ConfigService) {
    this._rpc = new Connection(this.config.get<string>('solana.endpoint'), {
      commitment: this.config.get<Commitment>('solana.commitment'),
    })
    this._serverKeypair = Keypair.fromSecretKey(bs58.decode(this.config.get<string>('solana.serverKey')))
  }

  get rpc() {
    return this._rpc
  }

  get commitment() {
    return this.rpc.commitment
  }

  get signer() {
    return this._serverKeypair
  }

  getDefaultComputeLimit(): number {
    return this.config.get<number>('solana.compute.limit')
  }

  getDefaultComputePrice(): number {
    return this.config.get<number>('solana.compute.price')
  }

  async getTransaction(txHash: string) {
    return this.rpc.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 })
  }

  async simulateTransaction(tx: VersionedTransaction, config?: SimulateTransactionConfig) {
    return this.rpc.simulateTransaction(tx, config)
  }

  async sendAndConfirm(input: SendAndConfirmInput) {
    let builder = transactionBuilder(this.rpc, input.builderOptions)
    if (input.limit) builder = builder.add(this._setComputeUnitLimit(input.limit))
    if (input.fee) builder = builder.add(this._setComputeUnitPrice(input.fee))
    if (input.loot) builder = builder.setAddressLookupTables(input.loot)
    builder = builder.add(input.instructions)
    return builder.sendAndConfirmWithResend(input.confirmOptions)
  }

  async sendAndConfirmOnce(input: SendAndConfirmOnceInput) {
    let builder = transactionBuilder(this.rpc, input.builderOptions)
    if (input.limit) builder = builder.add(this._setComputeUnitLimit(input.limit))
    if (input.fee) builder = builder.add(this._setComputeUnitPrice(input.fee))
    if (input.loot) builder = builder.setAddressLookupTables(input.loot)
    builder = builder.add(input.instructions)
    return builder.sendAndConfirm(input.confirmOptions)
  }

  async getRecentBlockhash() {
    return this.rpc.getLatestBlockhash(this.commitment)
  }

  private _setComputeUnitLimit(limit?: number): WrappedInstruction {
    return {
      instruction: ComputeBudgetProgram.setComputeUnitLimit({
        units: limit || this.config.get<number>('solana.compute.limit'),
      }),
      signers: [],
    }
  }

  private _setComputeUnitPrice(price?: number): WrappedInstruction {
    return {
      instruction: ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: price || this.config.get<number>('solana.compute.price'),
      }),
      signers: [],
    }
  }
}
