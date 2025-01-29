/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-this-alias */
import {
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
  | HasWrappedInstructions
  | HasWrappedInstructions[]
  | WrappedInstruction
  | WrappedInstruction[]

/**
 * The available options of a transaction builder.
 * @category Transactions
 */
export type TransactionBuilderOptions = {
  /** The blockhash that should be associated with the built transaction. */
  blockhash?: BlockhashWithExpiryBlockHeight
  /** The signer paying for the transaction fee. */
  feePayer?: Signer
}

/**
 * A set of options to use when sending and confirming
 * a transaction directly from a transaction builder.
 * @category Transactions
 */
export type TransactionBuilderSendAndConfirmOptions = {
  commitment?: Commitment
  confirm?: Omit<TransactionConfirmationStrategy, 'signature'>
  send?: SendOptions
}

/**
 * A set of options to use when sending and confirming
 * a transaction directly from a transaction builder.
 * @category Transactions
 */
export type TransactionBuilderSendAndConfirmWithResendOptions = {
  commitment?: Commitment
  delay?: number
  resendCounter?: number
  sendOptions?: SendOptions
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

  add(input: TransactionBuilderItemsInput): TransactionBuilder {
    return this.append(input)
  }

  append(input: TransactionBuilderItemsInput): TransactionBuilder {
    return new TransactionBuilder(this.connection, [...this.items, ...this.parseItems(input)], this.options)
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
      throw new Error('Setting a feePayer is required to build a transaction. Please use the `setFeePayer` method.')
    }

    const messageV0 = new TransactionMessage({
      instructions: this.getInstructions(),
      payerKey: feePayer.publicKey,
      recentBlockhash: blockhash.blockhash,
    }).compileToV0Message()

    return new VersionedTransaction(messageV0)
  }

  async buildAndSign(): Promise<VersionedTransaction> {
    const transaction = await this.buildWithLatestBlockhash()
    transaction.sign(this.getSigners())
    return transaction
  }

  async buildWithLatestBlockhash(options?: GetLatestBlockhashOptions): Promise<VersionedTransaction> {
    let builder: TransactionBuilder = this
    if (!this.options.blockhash) {
      builder = await this.setLatestBlockhash(options)
    }

    return builder.build()
  }

  empty(): TransactionBuilder {
    return new TransactionBuilder(this.connection, [], this.options)
  }

  getBlockhash(): BlockhashWithExpiryBlockHeight | undefined {
    return this.options.blockhash
  }

  getFeePayer(): Signer | undefined {
    return this.options.feePayer
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

  mapInstructions(
    fn: (wrappedInstruction: WrappedInstruction, index: number, array: WrappedInstruction[]) => WrappedInstruction,
  ): TransactionBuilder {
    return new TransactionBuilder(this.connection, this.items.map(fn), this.options)
  }

  protected parseItems(input: TransactionBuilderItemsInput): WrappedInstruction[] {
    return (Array.isArray(input) ? input : [input]).flatMap((item) => ('items' in item ? item.items : [item]))
  }

  async send(options?: SendOptions): Promise<TransactionSignature> {
    const transaction = await this.buildAndSign()
    return this.connection.sendTransaction(transaction, options)
  }

  async sendAndConfirm(options?: TransactionBuilderSendAndConfirmOptions): Promise<{
    result: RpcResponseAndContext<SignatureResult>
    signature: TransactionSignature
  }> {
    const blockhash = this.getBlockhash()
    let builder: TransactionBuilder = this
    if (!blockhash) {
      builder = await this.setLatestBlockhash()
    }

    const signature = await builder.send(options?.send)

    const strategy: TransactionConfirmationStrategy = {
      abortSignal: options?.confirm?.abortSignal,
      blockhash: builder.options.blockhash!.blockhash,
      lastValidBlockHeight: builder.options.blockhash!.lastValidBlockHeight,
      signature,
    }

    const result = await builder._confirm(strategy, options?.commitment)

    return { result, signature }
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

    // console.log(`#${resendCounter} Sending transaction.`)
    const signature = await builder.send(options?.sendOptions)
    // const signature =
    //   'vWQ6HAhppm8wvNbBwZHtXBxRkLr5whYRPj1V7eHbcUjNqVd7wYPsDzWKcgrKAs3RFFss57j1jU7ohsSHbPhasK1'

    let success = false
    while (!success) {
      await sleep(delay)

      const { value: status } = await this.connection.getSignatureStatus(signature)

      // Break loop if transaction has succeeded
      if (status && status.confirmationStatus === commitment) {
        success = true
        // console.log(`Attempt #${resendCounter}. Transaction confirmed.`)
        return signature
      }

      const hashExpired = await builder._isBlockhashExpired(resendCounter, commitment)

      // Resign and resend if blockhash has expired
      if (hashExpired) {
        console.log(`Attempt #${resendCounter}. Blockhash has expired. Attempts left: ${resendCounter - 1}`)

        // update blockhash for the builder
        let builder: TransactionBuilder = this
        builder = await this.setLatestBlockhash()
        // decrease resend counter and resign transaction and try to confirm again
        return builder.sendAndConfirmWithResend({ ...options, resendCounter: resendCounter - 1 })
      }
    }
  }

  setBlockhash(blockhash: BlockhashWithExpiryBlockHeight): TransactionBuilder {
    return new TransactionBuilder(this.connection, this.items, { ...this.options, blockhash })
  }

  setFeePayer(feePayer: Signer): TransactionBuilder {
    return new TransactionBuilder(this.connection, this.items, { ...this.options, feePayer })
  }

  async setLatestBlockhash(options?: GetLatestBlockhashOptions): Promise<TransactionBuilder> {
    return this.setBlockhash(await this.connection.getLatestBlockhash(options))
  }

  private async _confirm(
    strategy: TransactionConfirmationStrategy,
    commitment?: Commitment,
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    return this.connection.confirmTransaction(strategy, commitment)
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
    const { lastValidBlockHeight } = blockhash
    // console.log(
    //   `Attempt #${counter}.
    //     - Current slot    :${currentBlockHeight}.
    //     - Last valid slot :${lastValidBlockHeight}.
    //     - Until resend    :${lastValidBlockHeight - currentBlockHeight - SLOTS_TO_EXPIRE}`,
    // )
    // console.log(' cur:', currentBlockHeight)
    // console.log('last:', lastValidBlockHeight)
    // console.log('--------------')
    // // If Difference is positive, blockhash has expired.
    // console.log('diff:', currentBlockHeight - (lastValidBlockHeight - 250))
    // console.log('')
    return currentBlockHeight + SLOTS_TO_EXPIRE > lastValidBlockHeight
  }
}

export const transactionBuilder = (connection: Connection, options: TransactionBuilderOptions = {}) =>
  new TransactionBuilder(connection, [], options)
