import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from '@/auth/auth.module'
import { UserService } from '@/auth/user.service'
import { SolanaModule } from '@/solana/solana.module'
import { SoltrackerModule } from '@/soltracker/soltracker.module'

import { Task } from './db/task.entity'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'

@Module({
  imports: [TypeOrmModule.forFeature([Task]), SoltrackerModule, SolanaModule, AuthModule],
  providers: [TaskService, UserService],
  controllers: [TaskController],
  exports: [TaskService, TypeOrmModule],
})
export class TaskModule {}
