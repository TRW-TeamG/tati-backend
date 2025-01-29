import bs58 from 'bs58'
import { createHash } from 'crypto'

import { PublicKey } from '@solana/web3.js'

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const splitArray = <T>(arr: T[], size: number) => {
  const result: Array<Array<T>> = []

  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }

  return result
}

export const flattenObject = (obj: object, parentKey?: string) => {
  let result = {}

  Object.keys(obj).forEach((key) => {
    const value = obj[key]
    const _key = parentKey ? parentKey + '.' + key : key
    if (typeof value === 'object' && value && value !== null) {
      result = { ...result, ...flattenObject(value, _key) }
    } else {
      result[_key] = value
    }
  })

  return result
}

export const randomizeAmount = (amount: number, deviancePercentage = 5) => {
  const max = amount * (1 + deviancePercentage / 100)
  const min = amount * (1 - deviancePercentage / 100)
  return Math.random() * (max - min) + min
}

export const randomElement = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export const createCryptoKey = async (publicKey: PublicKey) => {
  return crypto.subtle.importKey('raw', publicKey.toBytes(), 'Ed25519', true, ['verify'])
}

export const generateFilename = (filename: string, seed = 'tati', size = 20) =>
  bs58.encode(createHash('sha256').update(`${seed}${filename}`).digest()).slice(0, size)
