import { ExtractJwt, Strategy } from 'passport-jwt'

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'

import { UserService } from '../user.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true,
    })
  }

  async validate(payload: any) {
    const user = await this.userService.findByPublicKey(payload.sub)
    if (!user) {
      throw new UnauthorizedException()
    }
    return user
  }
}
