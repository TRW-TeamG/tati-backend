import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { ChallengeService } from './challenge.service'
import { JwtAuthGuard } from './guards/jwt.guard'
import { SignatureAuthGuard } from './guards/signature.guard'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly challengeService: ChallengeService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('challenge')
  async getChallenge(@Body() body: { publicKey: string }) {
    const { message } = this.challengeService.createChallenge(body.publicKey)
    return { message }
  }

  @Post('verify')
  @UseGuards(SignatureAuthGuard)
  async verifySignature(@Request() req) {
    const token = await this.jwtService.sign({ sub: req.user.publicKey })
    return { token }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return req.user
  }
}
