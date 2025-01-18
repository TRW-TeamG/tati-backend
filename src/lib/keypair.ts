import { createKeyPairFromPrivateKeyBytes } from '@solana/web3.js'

export const fromSecretKey = async (keyString: string) => {
  return createKeyPairFromPrivateKeyBytes(Uint8Array.from(JSON.parse(keyString)))
}
