import { Module } from '@nestjs/common'

import { GenAIModule } from '@/genai/genai.module'
import { TaskModule } from '@/tasks/task.module'

import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'

@Module({
  imports: [TaskModule, GenAIModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
