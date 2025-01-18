import bs58 from 'bs58'
import * as crypto from 'crypto'

import { Injectable, UnauthorizedException } from '@nestjs/common'

interface SIWSMessage {
  domain: string
  address: string
  statement: string
  nonce: string
  issuedAt: string
  expirationTime: string
  resources: string[]
}

export type Challenge = {
  message: string
  nonce: string
  timestamp: number
}

@Injectable()
export class ChallengeService {
  private readonly challengeMap = new Map<string, Challenge>()

  createChallenge(address: string): Challenge {
    const nonce = bs58.encode(crypto.randomBytes(16))
    const now = new Date()
    const expiry = new Date(now.getTime() + 1 * 60000) // 1 minute from now

    const siws: SIWSMessage = {
      domain: 'tati.io',
      address: address,
      statement: 'Sign in with Solana to chat with TaTi.',
      nonce: nonce,
      issuedAt: now.toISOString(),
      expirationTime: expiry.toISOString(),
      resources: ['https://tati.io'],
    }

    const message = [
      `${siws.domain} wants you to sign in with your Solana account:`,
      `${siws.address}`,
      ``,
      `${siws.statement}`,
      ``,
      `Resources: ${siws.resources.join(', ')}`,
      `Issued At: ${siws.issuedAt}`,
      `Expiration: ${siws.expirationTime}`,
      `Nonce: ${siws.nonce}`,
    ].join('\n')

    const challenge: Challenge = {
      message,
      nonce,
      timestamp: now.getTime(),
    }

    this.challengeMap.set(address, challenge)

    return challenge
  }

  getChallenge(address: string): Challenge {
    const challenge = this.challengeMap.get(address)
    if (!challenge) {
      throw new UnauthorizedException('Challenge not found or expired')
    }
    return challenge
  }

  deleteChallenge(address: string) {
    this.challengeMap.delete(address)
  }
}
