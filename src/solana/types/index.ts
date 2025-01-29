import { AddressLookupTableAccount, Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js'

import { Amount } from '@/lib/Amount'

import {
  TransactionBuilderOptions,
  TransactionBuilderSendAndConfirmOptions,
  TransactionBuilderSendAndConfirmWithResendOptions,
  WrappedInstruction,
} from '../lib/transaction-builder'

export type ComputeLimitArgs = {
  limit?: number
}

export type PriorityFeeArgs = {
  fee?: number
}

export type LootArgs = {
  loot?: AddressLookupTableAccount[]
}

export type BaseTransferArgs = {
  source: Keypair
  destination: PublicKey
  amount?: Amount
}

export type SendAndConfirmArgs = {
  instructions: WrappedInstruction[]
  builderOptions?: TransactionBuilderOptions
  confirmOptions?: TransactionBuilderSendAndConfirmWithResendOptions
}

export type SendAndConfirmOnceArgs = {
  instructions: WrappedInstruction[]
  builderOptions?: TransactionBuilderOptions
  confirmOptions?: TransactionBuilderSendAndConfirmOptions
}

export type SendAndConfirmInput = SendAndConfirmArgs & ComputeLimitArgs & PriorityFeeArgs & LootArgs
export type SendAndConfirmOnceInput = SendAndConfirmOnceArgs & ComputeLimitArgs & PriorityFeeArgs & LootArgs

export type SendAssetUpdateInput = {
  instructions: TransactionInstruction[]
} & ComputeLimitArgs &
  PriorityFeeArgs
