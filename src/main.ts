#!/usr/bin/env node
import { Logger } from 'nestjs-pino'

import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  })
  const logger = app.get(Logger)
  app.enableCors()
  app.useLogger(logger)

  const config = app.get(ConfigService)

  const port = config.get<string>('port')
  await app.listen(port, '0.0.0.0')
}
bootstrap()
