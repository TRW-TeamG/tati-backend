import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'

import { SoltrackerService } from './soltracker.service'

@Module({
  imports: [
    CacheModule.register({
      ttl: 5 * 60 * 1000, // 5 minutes default TTL
      max: 100, // Maximum number of items in cache
    }),
  ],
  providers: [SoltrackerService],
  exports: [SoltrackerService],
})
export class SoltrackerModule {}
