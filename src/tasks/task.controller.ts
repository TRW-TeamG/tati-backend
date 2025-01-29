import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common'

import { User } from '@/auth/db'
import { CurrentUser } from '@/auth/decorators'
import { JwtAuthGuard } from '@/auth/guards/jwt.guard'

import { Task } from './db/task.entity'
import { TaskService } from './task.service'

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get(':id')
  getTask(@Param('id') id: number): Promise<Task> {
    return this.taskService.getTask(id)
  }

  @Get('unrewarded')
  async getUnrewardedTasks(@CurrentUser() user: User): Promise<number> {
    const tasks = await this.taskService.getUnrewardedTasks(user)
    return tasks.length
  }

  @Post('verify')
  async verifyTasks(@CurrentUser() user: User): Promise<{ success: boolean; message: string }> {
    try {
      await this.taskService.verifyTasksCompletion(user)
      return { success: true, message: 'Subtle whispers of success fill your mind...' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  @Post('random')
  getRandomTask(@CurrentUser() user: User): Promise<Task> {
    return this.taskService.getRandomTask(user)
  }
}
