import { Repository } from 'typeorm'
import { In } from 'typeorm'

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { User } from '@/auth/db'
import { SoltrackerService, TrendingToken } from '@/soltracker/soltracker.service'

import { Task, TaskStatus, TaskType } from './db/task.entity'

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly soltrackerService: SoltrackerService,
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

  async getUnrewardedTasks(user: User): Promise<Task[]> {
    return this.taskRepository.find({
      where: { user: { id: user.id }, status: TaskStatus.COMPLETED, rewardClaimed: false },
      order: { createdAt: 'DESC' },
    })
  }

  async markTasksAsRewarded(tasks: Task[]): Promise<void> {
    await this.taskRepository.update({ id: In(tasks.map((t) => t.id)) }, { rewardClaimed: true })
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
    const tasks = await this.getIncompletedTasks(user)

    if (!tasks.length) {
      throw new Error('No tasks await verification in the ethereal plane...')
    }

    // Verify each task
    for (const task of tasks) {
      // const proofs = await this.soltrackerService.verifyTokenTrade(
      //   task.requirements.tokenAddress,
      //   user.publicKey,
      //   task.type === TaskType.TOKEN_BUY ? 'buy' : 'sell',
      //   {
      //     amount: parseFloat(task.requirements.amount),
      //     //timeframe: '24h', // Verify trades within the last 24 hours
      //   },
      // )

      // if (!proofs) {
      //   throw new Error('The spirits sense incomplete tasks. Continue your journey...')
      // }

      // // Find all existing proofs
      // const existingProofs = await this.taskRepository.find({
      //   where: { proof: In(proofs) },
      //   select: ['proof'],
      // })
      // const usedProofs = new Set(existingProofs.map((t) => t.proof))

      // // Find first unused proof
      // const unusedProof = proofs.find((proof) => !usedProofs.has(proof))

      // if (!unusedProof) {
      //   throw new Error('The spirits sense incomplete tasks. Continue your journey...')
      // }

      // Use the first unused proof to complete the task
      await this.taskRepository.update(task.id, {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        // proof: unusedProof,
      })
    }

    return true
  }

  async getRandomTask(user: User): Promise<Task> {
    try {
      // Get trending tokens from the last 24 hours
      const trendingTokens = await this.soltrackerService.getTrendingTokens('24h')

      if (!trendingTokens.length) {
        throw new Error('No trending tokens available at the moment...')
      }

      // Hardcode $DADDY to the top of the list
      const daddyToken: TrendingToken = {
        token: {
          name: 'DADDY TATE',
          symbol: 'DADDY',
          mint: '4Cnk9EPnW5ixfLZatCPJjDB1PUtcRpVVgTQukm9epump',
          uri: '',
          decimals: 6,
          image: '',
          description: '',
          hasFileMetaData: false,
        },
        pools: [],
        events: [],
        risk: [],
      }

      trendingTokens.unshift(daddyToken)

      // Assign weights based on position in trending list
      const tokens = trendingTokens.map((token, index) => ({
        ...token,
        weight: 1 / (index + 1), // Higher weight for higher ranked tokens
      }))

      // Calculate total weight
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

      // Only buy action for now
      const taskType = TaskType.TOKEN_BUY
      const action = 'Buy'

      // Generate random amount between 0.01 and 0.05 SOL worth
      const amount = (Math.random() * 0.04 + 0.01).toFixed(4)

      // Create mystical task description
      const descriptions = [
        `The crypto spirits whisper of ${action.toLowerCase()}ing ${selectedToken.token.symbol} [CA: ${selectedToken.token.mint}]. A ${action.toLowerCase()} of ${amount} SOL worth shall bring fortune.`,
        `Through the mists of market data, I foresee a ${action.toLowerCase()} of ${selectedToken.token.symbol} [CA: ${selectedToken.token.mint}]. The amount of ${amount} SOL worth appears in my vision.`,
        `The blockchain oracles reveal a path through ${selectedToken.token.symbol} [CA: ${selectedToken.token.mint}]. A ${action.toLowerCase()} of ${amount} SOL worth will align the cosmic energies.`,
        `The digital realms converge on ${selectedToken.token.symbol} [CA: ${selectedToken.token.mint}]. A ${action.toLowerCase()} of ${amount} SOL worth shall unlock hidden potential.`,
      ]

      const description = descriptions[Math.floor(Math.random() * descriptions.length)]

      const task = await this.createTask(
        taskType,
        `${action} ${selectedToken.token.symbol} [CA: ${selectedToken.token.mint}]`,
        description,
        {
          tokenAddress: selectedToken.token.mint,
          amount,
        },
        user,
      )

      return task
    } catch (error) {
      throw new Error('The crypto spirits are restless. Try again in a moment...')
    }
  }
}
