import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SolanaModule } from '@/solana/solana.module'
import { TaskModule } from '@/tasks/task.module'

import { AssetController } from './asset.controller'
import { AssetService } from './asset.service'
import { Asset } from './db/asset.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Asset]), SolanaModule, TaskModule],
  providers: [AssetService],
  controllers: [AssetController],
  exports: [AssetService],
})
export class AssetModule {}
