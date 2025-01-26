import { LoggerModule } from 'nestjs-pino'

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from '@/auth/auth.module'
import { ChatModule } from '@/chat/chat.module'

import { AppService } from './app.service'
import config from './config'
import logger from './config/logger'
import { GenAIModule } from './genai/genai.module'
import { GmgnModule } from './gmgn/gmgn.module'
import { TaskModule } from './tasks/task.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbConfig = config.get('database')
        const isPostgres = dbConfig.type === 'postgres'

        return {
          type: dbConfig.type,
          ...(isPostgres
            ? {
                type: 'postgres',
                url: dbConfig.url,
              }
            : {
                type: 'sqlite',
                database: dbConfig.url,
              }),
          synchronize: true,
          autoLoadEntities: true,
        }
      },
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => logger(config),
    }),
    AuthModule,
    ChatModule,
    TaskModule,
    GmgnModule,
    GenAIModule,
  ],
  providers: [AppService],
})
export class AppModule {}
