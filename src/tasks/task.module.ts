import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { GmgnModule } from '@/gmgn/gmgn.module'
import { SolanaModule } from '@/solana/solana.module'

import { Task } from './db/task.entity'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'

@Module({
  imports: [TypeOrmModule.forFeature([Task]), SolanaModule, GmgnModule],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}
