import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from '@/auth/auth.module'
import { SolanaModule } from '@/solana/solana.module'
import { SupabaseModule } from '@/supabase/supabase.module'
import { TaskModule } from '@/tasks/task.module'

import { AssetController } from './asset.controller'
import { AssetService } from './asset.service'
import { Asset } from './db/asset.entity'
import { Image } from './db/image.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Asset, Image]), SolanaModule, TaskModule, SupabaseModule, AuthModule],
  providers: [AssetService],
  controllers: [AssetController],
  exports: [AssetService],
})
export class AssetModule {}
