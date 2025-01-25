import { Repository } from 'typeorm'
import { In, IsNull, Not } from 'typeorm'

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { User } from '@/auth/db'
import { GmgnService } from '@/gmgn/gmgn.service'

import { Task, TaskStatus, TaskType } from './db/task.entity'

interface TaskReward {
  amount: number
  symbol: string
  tokenAddress: string
  success: boolean
  transactionSignature?: string
}

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
    // Mock wallet activity response
    const walletActivity = {
      data: [
        {
          token_address: 'mock1111111111111111111111111111111',
          type: 'buy',
          amount: 1000,
        },
        {
          token_address: 'mock2222222222222222222222222222222',
          type: 'buy',
          amount: 500,
        },
        {
          token_address: 'mock3333333333333333333333333333333',
          type: 'buy',
          amount: 250,
        },
      ],
    }

    // Check if we have some activity
    if (!walletActivity.data.length) {
      throw new Error('You wallet activity is empty, make some trades!')
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
    // Mock trending tokens response
    const response = {
      total: 10,
      data: [
        {
          symbol: 'MOCK1',
          address: 'mock1111111111111111111111111111111',
          market_cap: 1000000,
        },
        {
          symbol: 'MOCK2',
          address: 'mock2222222222222222222222222222222',
          market_cap: 500000,
        },
        {
          symbol: 'MOCK3',
          address: 'mock3333333333333333333333333333333',
          market_cap: 250000,
        },
      ],
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

  async claimReward(user: User): Promise<TaskReward> {
    const completedTasks = await this.taskRepository.find({
      where: {
        user: { id: user.id },
        status: TaskStatus.COMPLETED,
        rewardClaimed: false,
      },
      order: { createdAt: 'DESC' },
    })

    if (!completedTasks.length) {
      throw new Error('You have not accomplished worthy quests to claim rewards for.')
    }

    // Here you would implement your reward logic
    // For example, sending tokens to the user's wallet
    // This is a placeholder implementation
    const reward: TaskReward = {
      amount: 0.1,
      symbol: 'SOL',
      tokenAddress: 'So11111111111111111111111111111111111111112',
      success: true,
      // transactionSignature would come from your actual token transfer
    }

    // Mark tasks as rewarded
    await this.taskRepository.update({ id: In(completedTasks.map((task) => task.id)) }, { rewardClaimed: true })

    return reward
  }
}
