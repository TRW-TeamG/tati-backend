import { mplCore } from '@metaplex-foundation/mpl-core'
import { Umi, signerIdentity } from '@metaplex-foundation/umi'
import { createSignerFromKeypair } from '@metaplex-foundation/umi'
import { createUmi as baseCreateUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters'

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
import { SendAndConfirmOnceInput, SendAssetUpdateInput } from './types'
import { SendAndConfirmInput } from './types'

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name)

  private readonly _rpc: Connection
  private readonly _serverKeypair: Keypair
  private _umi: Umi | null = null

  constructor(private readonly config: ConfigService) {
    this._rpc = new Connection(this.config.get<string>('solana.endpoint'), {
      commitment: this.config.get<Commitment>('solana.commitment'),
    })
    // we still initialize even if we don't have the server key
    const serverKey = this.config.get<string>('solana.serverKey')
    if (serverKey) {
      const secretKey: number[] = JSON.parse(serverKey)
      this._serverKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey))
    }
  }

  async getUmi() {
    if (!this._umi) {
      const umi = await baseCreateUmi(this.rpc)
      const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(this._serverKeypair))
      umi.use(signerIdentity(signer))
      umi.use(mplCore())
      this._umi = umi
    }
    return this._umi
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

  async sendAssetUpdate(input: SendAssetUpdateInput) {
    const instructions = input.instructions.map((ix) => ({
      instruction: ix,
      signers: [this.signer],
    }))

    return this.sendAndConfirm({
      instructions,
      builderOptions: { feePayer: this.signer },
      fee: input.fee,
      limit: input.limit,
    })
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
