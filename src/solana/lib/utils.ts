import { SolAmount, sol, subtractAmounts } from '@/lib/Amount'

export const REGULAR_FEE_AMOUNT = sol(0.000005)

export const sweepSolAmount = (balance: SolAmount) => {
  return subtractAmounts(balance, REGULAR_FEE_AMOUNT)
}
