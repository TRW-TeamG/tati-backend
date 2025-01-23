import { Repository } from 'typeorm'

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { User } from '@/auth/db'
import { GmgnService } from '@/gmgn/gmgn.service'

import { Task, TaskStatus, TaskType } from './db/task.entity'

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly gmgnService: GmgnService,
  ) {}

  async createTask(
    type: TaskType,
    title: string,
    description: string,
    requirements: Task['requirements'],
    user: User,
  ): Promise<Task> {
    const task = this.taskRepository.create({
      type,
      title,
      description,
      requirements,
      user,
      status: TaskStatus.PENDING,
    })
    return this.taskRepository.save(task)
  }

  async getIncompletedTasks(user: User): Promise<Task[]> {
    return this.taskRepository.find({
      where: { user: { id: user.id }, status: TaskStatus.PENDING },
      order: { createdAt: 'DESC' },
    })
  }

  async getTask(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['user'],
    })
    if (!task) {
      throw new Error('Task not found')
    }
    return task
  }

  async verifyTasksCompletion(user: User): Promise<boolean> {
    // get all incompleted tasks
    const tasks = await this.getIncompletedTasks(user)
    // fetch the user's wallet activity
    const walletActivity = await this.gmgnService.getWalletActivity(user.publicKey)

    // Check if we have some activity
    if (!walletActivity.data.length) {
      throw new Error('No wallet activity found')
    }

    // verify that the user has bought the token from all incompleted tasks
    const tokenBought = tasks.every((task) =>
      walletActivity.data.some((activity) => activity.token_address === task.requirements.tokenAddress),
    )

    if (!tokenBought) {
      throw new Error('Ringing bells of failure fill your mind... Perhaps you should try harder?')
    }

    // mark all tasks as completed
    await this.taskRepository.update(
      { user: { id: user.id }, status: TaskStatus.PENDING },
      { status: TaskStatus.COMPLETED },
    )

    return true
  }

  async getRandomTask(user: User): Promise<Task> {
    // Get trending tokens
    const response = await this.gmgnService.getTrendingTokens('24h')

    if (!response.total || !response.data.length) {
      throw new Error('There are no trending tokens to trade for now, try again later')
    }

    // Assign weights according to the token's market_cap
    const tokens = response.data.map((token) => ({
      ...token,
      weight: token.market_cap,
    }))
    const totalWeight = tokens.reduce((sum, token) => sum + token.weight, 0)
    let random = Math.random() * totalWeight

    // Select token based on weight
    let selectedToken = tokens[0]
    for (const token of tokens) {
      random -= token.weight
      if (random <= 0) {
        selectedToken = token
        break
      }
    }

    console.log(selectedToken)

    // Only buy tokens for now
    const task = await this.createTask(
      TaskType.TOKEN_BUY,
      `Buy ${selectedToken.symbol}`,
      // creative fortune telling description for the task
      `Mysterious forces whisper in your ear, urging you to buy ${selectedToken.symbol}.`,
      {
        tokenAddress: selectedToken.address,
      },
      user,
    )

    return task
  }
}
