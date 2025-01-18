import bs58 from 'bs58'

import { Injectable, UnauthorizedException } from '@nestjs/common'

import { address } from '@solana/web3.js'

import { createPublicKeyForAddress } from '@/lib/helpers'

import { ChallengeService } from './challenge.service'

@Injectable()
export class AuthService {
  constructor(private challengeService: ChallengeService) {}

  async validateSignature(publicKey: string, signature: string): Promise<boolean> {
    const challenge = this.challengeService.getChallenge(publicKey)

    try {
      const signatureUint8 = bs58.decode(signature)
      const messageBytes = new TextEncoder().encode(challenge.message)
      const key = await createPublicKeyForAddress(address(publicKey))

      const isValid = await crypto.subtle.verify('Ed25519', key, signatureUint8, messageBytes)

      if (!isValid) {
        throw new UnauthorizedException('Invalid signature')
      }

      this.challengeService.deleteChallenge(publicKey)
    } catch (error) {
      throw new UnauthorizedException('Invalid signature')
    }
    return true
  }
}
