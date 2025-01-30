/* eslint-disable @typescript-eslint/no-this-alias */
import {
  AddressLookupTableAccount,
  BlockhashWithExpiryBlockHeight,
  Commitment,
  Connection,
  GetLatestBlockhashConfig,
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
  Signer,
  TransactionConfirmationStrategy,
  TransactionInstruction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js'

import { sleep } from '@/lib/helpers'

/**
 * A wrapped instruction is an instruction with its associated signers and the
 * number of bytes it will create on chain.
 * @category Transactions
 */
export type WrappedInstruction = {
  /** The wrapped instruction. */
  instruction: TransactionInstruction
  /** The signers required for the instruction to succeed. */
  signers: Signer[]
}

/**
 * Defines an generic object with wrapped instructions,
 * such as a {@link TransactionBuilder}.
 * @category Transactions
 */
export type HasWrappedInstructions = { connection: Connection; items: WrappedInstruction[] }

/**
 * Defines all the possible inputs for adding items to a transaction builder.
 * @category Transactions
 */
export type TransactionBuilderItemsInput =
  | WrappedInstruction
  | WrappedInstruction[]
  | HasWrappedInstructions
  | HasWrappedInstructions[]

/**
 * The available options of a transaction builder.
 * @category Transactions
 */
export type TransactionBuilderOptions = {
  /** The signer paying for the transaction fee. */
  feePayer?: Signer
  /** The address lookup tables to attach to the built transaction. */
  addressLookupTables?: AddressLookupTableAccount[]
  /** The blockhash that should be associated with the built transaction. */
  blockhash?: BlockhashWithExpiryBlockHeight
}

/**
 * A set of options to use when sending and confirming
 * a transaction directly from a transaction builder.
 * @category Transactions
 */
export type TransactionBuilderSendAndConfirmOptions = {
  send?: SendOptions
  confirm?: Omit<TransactionConfirmationStrategy, 'signature'>
  commitment?: Commitment
}

/**
 * A set of options to use when sending and confirming
 * a transaction directly from a transaction builder.
 * @category Transactions
 */
export type TransactionBuilderSendAndConfirmWithResendOptions = {
  delay?: number
  resendCounter?: number
  sendOptions?: SendOptions
  commitment?: Commitment
}

export type GetLatestBlockhashOptions = Commitment | GetLatestBlockhashConfig

const SLOTS_TO_EXPIRE = 150
/**
 * A builder that helps construct transactions.
 * @category Transactions
 */
export class TransactionBuilder implements HasWrappedInstructions {
  constructor(
    readonly connection: Connection,
    readonly items: WrappedInstruction[] = [],
    readonly options: TransactionBuilderOptions = {},
  ) {}

  empty(): TransactionBuilder {
    return new TransactionBuilder(this.connection, [], this.options)
  }

  append(input: TransactionBuilderItemsInput): TransactionBuilder {
    return new TransactionBuilder(this.connection, [...this.items, ...this.parseItems(input)], this.options)
  }

  add(input: TransactionBuilderItemsInput): TransactionBuilder {
    return this.append(input)
  }

  mapInstructions(
    fn: (wrappedInstruction: WrappedInstruction, index: number, array: WrappedInstruction[]) => WrappedInstruction,
  ): TransactionBuilder {
    return new TransactionBuilder(this.connection, this.items.map(fn), this.options)
  }

  setFeePayer(feePayer: Signer): TransactionBuilder {
    return new TransactionBuilder(this.connection, this.items, { ...this.options, feePayer })
  }

  getFeePayer(): Signer | undefined {
    return this.options.feePayer
  }

  setAddressLookupTables(addressLookupTables: AddressLookupTableAccount[]): TransactionBuilder {
    return new TransactionBuilder(this.connection, this.items, {
      ...this.options,
      addressLookupTables,
    })
  }

  getBlockhash(): BlockhashWithExpiryBlockHeight | undefined {
    return this.options.blockhash
  }

  setBlockhash(blockhash: BlockhashWithExpiryBlockHeight): TransactionBuilder {
    return new TransactionBuilder(this.connection, this.items, { ...this.options, blockhash })
  }

  async setLatestBlockhash(options?: GetLatestBlockhashOptions): Promise<TransactionBuilder> {
    return this.setBlockhash(await this.connection.getLatestBlockhash(options))
  }

  getInstructions(): TransactionInstruction[] {
    return this.items.map((item) => item.instruction)
  }

  getSigners(): Signer[] {
    const signers: Signer[] = this.items.flatMap((item) => item.signers)
    const feePayer = this.getFeePayer()
    if (feePayer) {
      signers.push(feePayer)
    }
    return [...new Set(signers)]
  }

  build(): VersionedTransaction {
    const blockhash = this.getBlockhash()

    if (!blockhash) {
      throw new Error(
        'Setting a blockhash is required to build a transaction. ' +
          'Please use the `setBlockhash` or `setLatestBlockhash` methods.',
      )
    }

    const feePayer = this.getFeePayer()
    if (!feePayer) {
      throw new Error(
        'Setting a feePayer is required to build a transaction. ' + 'Please use the `setFeePayer` method.',
      )
    }

    const messageV0 = new TransactionMessage({
      payerKey: feePayer.publicKey,
      recentBlockhash: blockhash.blockhash,
      instructions: this.getInstructions(),
    }).compileToV0Message(this.options.addressLookupTables)

    return new VersionedTransaction(messageV0)
  }

  async buildWithLatestBlockhash(options?: GetLatestBlockhashOptions): Promise<VersionedTransaction> {
    let builder: TransactionBuilder = this
    if (!this.options.blockhash) {
      builder = await this.setLatestBlockhash(options)
    }
    return builder.build()
  }

  async buildAndSign(): Promise<VersionedTransaction> {
    const transaction = await this.buildWithLatestBlockhash()
    transaction.sign(this.getSigners())
    return transaction
  }

  async send(options?: SendOptions): Promise<TransactionSignature> {
    const transaction = await this.buildAndSign()
    return this.connection.sendTransaction(transaction, options)
  }

  private async _confirm(
    strategy: TransactionConfirmationStrategy,
    commitment?: Commitment,
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    return this.connection.confirmTransaction(strategy, commitment)
  }

  async sendAndConfirmWithResend(
    options?: TransactionBuilderSendAndConfirmWithResendOptions,
  ): Promise<string | undefined> {
    const blockhash = this.getBlockhash()
    let builder: TransactionBuilder = this
    if (!blockhash) {
      builder = await this.setLatestBlockhash()
    }
    const delay = options?.delay || 5000
    const resendCounter = options?.resendCounter === undefined ? 10 : options?.resendCounter
    const commitment = options?.commitment || 'confirmed'

    // throw error if resendCount reached
    if (resendCounter === 0) {
      throw new Error(`Resend limit reached. Please try again later.`)
    }

    const signature = await builder.send(options?.sendOptions)

    let success = false
    while (!success) {
      await sleep(delay)

      const { value: status } = await this.connection.getSignatureStatus(signature)

      // Break loop if transaction has succeeded
      if (status && status.confirmationStatus === commitment) {
        success = true
        return signature
      }

      const hashExpired = await builder._isBlockhashExpired(resendCounter, commitment)

      // Resign and resend if blockhash has expired
      if (hashExpired) {
        // update blockhash for the builder
        let builder: TransactionBuilder = this
        builder = await this.setLatestBlockhash()
        // decrease resend counter and resign transaction and try to confirm again
        return builder.sendAndConfirmWithResend({ ...options, resendCounter: resendCounter - 1 })
      }
    }
  }
  private async _isBlockhashExpired(counter: number, commitment?: Commitment): Promise<boolean> {
    const blockhash = this.getBlockhash()
    if (!blockhash) {
      throw new Error(
        'Setting a blockhash is required to build a transaction. ' +
          'Please use the `setBlockhash` or `setLatestBlockhash` methods.',
      )
    }
    const currentBlockHeight = await this.connection.getBlockHeight(commitment)
    const lastValidBlockHeight = blockhash.lastValidBlockHeight

    return currentBlockHeight + SLOTS_TO_EXPIRE > lastValidBlockHeight
  }

  async sendAndConfirm(options?: TransactionBuilderSendAndConfirmOptions): Promise<{
    signature: TransactionSignature
    result: RpcResponseAndContext<SignatureResult>
  }> {
    const blockhash = this.getBlockhash()
    let builder: TransactionBuilder = this
    if (!blockhash) {
      builder = await this.setLatestBlockhash()
    }
    const signature = await builder.send(options?.send)

    const strategy: TransactionConfirmationStrategy = {
      signature,
      blockhash: builder.options.blockhash!.blockhash,
      lastValidBlockHeight: builder.options.blockhash!.lastValidBlockHeight,
      abortSignal: options?.confirm?.abortSignal,
    }

    const result = await builder._confirm(strategy, options?.commitment)

    return { signature, result }
  }

  protected parseItems(input: TransactionBuilderItemsInput): WrappedInstruction[] {
    return (Array.isArray(input) ? input : [input]).flatMap((item) => ('items' in item ? item.items : [item]))
  }
}

/**
 * Creates a new transaction builder.
 * @category Transactions
 */
export const transactionBuilder = (connection: Connection, options: TransactionBuilderOptions = {}) =>
  new TransactionBuilder(connection, [], options)
