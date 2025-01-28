import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'

import { User } from '@/auth/db'
import { CurrentUser } from '@/auth/decorators'
import { JwtAuthGuard } from '@/auth/guards/jwt.guard'

import { ChatService } from './chat.service'
import { ChatMessageDto } from './types'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('welcome')
  @UseGuards(JwtAuthGuard)
  getWelcomeMessage(@CurrentUser() user: User) {
    return this.chatService.getWelcomeMessage(user)
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Body() chatMessageDto: ChatMessageDto, @CurrentUser() user: User) {
    return this.chatService.processMessage(chatMessageDto, user)
  }
}
