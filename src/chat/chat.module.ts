import { Module } from '@nestjs/common'

import { TaskModule } from '@/tasks/task.module'

import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'

@Module({
  imports: [TaskModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
