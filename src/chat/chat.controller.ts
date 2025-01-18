import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'

import { JwtAuthGuard } from '@/auth/guards/jwt.guard'

import { ChatService } from './chat.service'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sample-questions')
  getSampleQuestions() {
    return {
      questions: this.chatService.getSampleQuestions(),
    }
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Body() chatMessageDto: { message: string }) {
    const response = this.chatService.getResponse(chatMessageDto.message)
    return { message: response }
  }
}
