import { Params } from 'nestjs-pino'

import { ConfigService } from '@nestjs/config'

export default (config: ConfigService): Params => {
  return {
    pinoHttp: {
      level: config.get<string>('logging.level'),
      transport: config.get<boolean>('logging.pretty')
        ? {
            target: 'pino-pretty',
            options: {
              singleLine: false,
            },
          }
        : undefined,
      customProps: () => ({
        context: 'HTTP',
      }),
      serializers: {
        req: (req) => {
          if (req.method === 'OPTIONS') {
            return false // Skip logging OPTIONS requests
          }
          return {
            method: req.method,
            url: req.url,
            params: req.params,
          }
        },
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
    },
  }
}
