import { Module } from '@nestjs/common'

import { AuthModule } from '@/auth/auth.module'
import { GenAIModule } from '@/genai/genai.module'
import { TaskModule } from '@/tasks/task.module'

import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'

@Module({
  imports: [TaskModule, GenAIModule, AuthModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
