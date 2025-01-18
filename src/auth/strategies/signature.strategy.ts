import { FastifyRequest } from 'fastify'
import { Strategy } from 'passport-custom'

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'

import { AuthService } from '../auth.service'
import { User } from '../db'
import { UserService } from '../user.service'

@Injectable()
export class SignatureStrategy extends PassportStrategy(Strategy, 'signature') {
  static key = 'signature'

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super()
  }

  async validate(request: FastifyRequest): Promise<User | null> {
    const { publicKey, signature } = request.body as { publicKey: string; signature: string }
    const isValid = await this.authService.validateSignature(publicKey, signature)
    if (!isValid) {
      throw new UnauthorizedException()
    }
    return this.userService.findOrCreateUser(publicKey)
  }
}
