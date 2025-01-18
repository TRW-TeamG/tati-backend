import { LoggerModule } from 'nestjs-pino'

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from '@/auth/auth.module'
import { ChatModule } from '@/chat/chat.module'

import { AppService } from './app.service'
import config from './config'
import logger from './config/logger'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'sqlite',
        database: './db/dev.sqlite',
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => logger(config),
    }),
    AuthModule,
    ChatModule,
  ],
  providers: [AppService],
})
export class AppModule {}
