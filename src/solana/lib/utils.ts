import { Instruction as InstructionUmi } from '@metaplex-foundation/umi'
import { toWeb3JsInstruction } from '@metaplex-foundation/umi-web3js-adapters'

import { sol } from '@/lib/Amount'

export const REGULAR_FEE_AMOUNT = sol(0.000005)

export const convertUmiToWeb3JsInstruction = (ix: InstructionUmi[]) => {
  return ix.map((ix) => toWeb3JsInstruction(ix))
}
