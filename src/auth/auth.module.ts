import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { ChallengeService } from './challenge.service'
import { User } from './db'
import { JwtStrategy } from './strategies/jwt.strategy'
import { SignatureStrategy } from './strategies/signature.strategy'
import { UserService } from './user.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.expiresIn', '1d'),
        },
      }),
    }),
  ],
  providers: [UserService, AuthService, ChallengeService, JwtStrategy, SignatureStrategy],
  controllers: [AuthController],
  exports: [TypeOrmModule, UserService, AuthService],
})
export class AuthModule {}
