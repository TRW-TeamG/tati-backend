import { Injectable } from '@nestjs/common'

import { User } from '@/auth/db'
import { GenAIService } from '@/genai/genai.service'
import { TaskService } from '@/tasks/task.service'

import { ChatMessageDto, ChatMessageType, ChatResponse } from './types'

@Injectable()
export class ChatService {
  constructor(
    private readonly taskService: TaskService,
    private readonly genAIService: GenAIService,
  ) {}

  private readonly commands = {
    task: ['task', 'quest', 'mission', 'assignment'],
    verify: ['verify', 'check', 'complete', 'done'],
    claim: ['claim', 'reward', 'collect'],
  }

  private readonly actions = {
    getTask: ['get', 'get task', 'get quest', 'get assignment', 'get quest'],
    verifyTask: ['verify', 'check', 'complete', 'done'],
    claimReward: ['claim', 'reward', 'collect'],
  }

  private readonly cta = {
    getTask: [
      'Would you like a task to test your trading skills?',
      'Shall we start with a little task?',
      'The crypto spirits are aligning... Let me find you a worthy quest.',
    ],
    verifyTask: [
      'Let me check your progress in the crypto realm...',
      'The crypto spirits are pleased with your actions. Your tasks have been completed! Would you like to claim your reward?',
      'The crypto spirits acknowledge your progress, but no tasks are ready for verification yet.',
    ],
    claimReward: [
      'The crypto spirits are pleased with your actions. Your tasks have been completed! Would you like to claim your reward?',
      'The crypto spirits acknowledge your progress, but no tasks are ready for verification yet.',
    ],
  }

  private readonly sampleActions = [
    {
      type: ChatMessageType.MESSAGE,
      message: 'TaTi, what does my crypto future hold?',
    },
    {
      type: ChatMessageType.MESSAGE,
      message: 'How can I maximize my Solana gains?',
    },
    {
      type: ChatMessageType.MESSAGE,
      message: 'Should I start trading NFTs?',
    },
    {
      type: ChatMessageType.MESSAGE,
      message: 'What are the best DeFi opportunities?',
    },
    {
      type: ChatMessageType.MESSAGE,
      message: 'How can I stay safe while trading crypto?',
    },
  ]

  private readonly welcomeMessage: ChatResponse = {
    message:
      '✨ Greetings, seeker of crypto wisdom! I am TaTi, your mystical guide through the blockchain realms. How may I illuminate your path today?',
    actions: this.sampleActions,
  }

  private readonly defaultResponse: ChatResponse = {
    message:
      'Hmm, let me gaze deeper into the crypto cosmos to answer that question. Perhaps try asking about tasks, trading, or verification?',
    actions: this.sampleActions,
  }

  // every response here, should have a message and sample actions
  private readonly responses: Record<string, ChatResponse[]> = {
    'crypto future': [
      {
        message: 'I see volatile but promising paths ahead. Would you like a task to test your trading skills?',
        actions: this.sampleActions,
      },
    ],
    'solana gains': [
      {
        message:
          'The path to Solana prosperity lies in understanding its ecosystem. Shall we start with a trading task?',
        actions: this.sampleActions,
      },
    ],
    nft: [
      {
        message:
          'The NFT realm holds both treasures and tricks. Start small, learn the community, and trust your intuition.',
        actions: this.sampleActions,
      },
    ],
  }

  getWelcomeMessage(): ChatResponse {
    return this.welcomeMessage
  }

  async processMessage(dto: ChatMessageDto, user: User): Promise<ChatResponse> {
    // For regular messages, use Gemini to generate responses
    if (dto.type === ChatMessageType.MESSAGE) {
      try {
        const response = await this.genAIService.generateText(dto.message)
        const randomGetTaskCta = this.cta.getTask[Math.floor(Math.random() * this.cta.getTask.length)]

        return {
          message: response,
          actions: [{ type: ChatMessageType.ACTION, message: randomGetTaskCta }, ...this.sampleActions],
        }
      } catch (error) {
        return this.defaultResponse
      }
    }

    // Check is incoming dto is an action
    if (dto.type === ChatMessageType.ACTION) {
      // Check if the action is to get a task
      if (this.commands.task.some((cmd) => dto.message.toLowerCase().includes(cmd))) {
        try {
          // check if user has ongoing tasks
          const tasks = await this.taskService.getIncompletedTasks(user)
          if (tasks.length > 0) {
            // if yes, return the response with current task and sample actions and one verification action
            return {
              message: `🔮 You are already working on a task... ${tasks[0].description}`,
              actions: [{ type: ChatMessageType.ACTION, message: 'Verify my progress' }, ...this.sampleActions],
            }
          }
          // if no, return the response with a random task and sample actions and one verification action
          const task = await this.taskService.getRandomTask(user)
          return {
            message: `🔮 I have foreseen your path... ${task.description}`,
            actions: [{ type: ChatMessageType.ACTION, message: 'Verify my progress' }, ...this.sampleActions],
          }
        } catch (error) {
          console.error(error)
          // if error, return the error message with sample actions and random getTask cta
          const randomGetTaskCta = this.cta.getTask[Math.floor(Math.random() * this.cta.getTask.length)]
          return {
            message: error.message,
            actions: [{ type: ChatMessageType.ACTION, message: randomGetTaskCta }, ...this.sampleActions],
          }
        }
      }

      // Check if the action is to verify a task
      if (this.commands.verify.some((cmd) => dto.message.toLowerCase().includes(cmd))) {
        try {
          const result = await this.taskService.verifyTasksCompletion(user)
          if (result) {
            // if success, return the response with sample actions and one claim reward action
            return {
              message:
                'The crypto spirits are pleased with your actions. Your tasks have been completed! Would you like to claim your reward?',
              actions: [{ type: ChatMessageType.ACTION, message: 'Claim my reward' }, ...this.sampleActions],
            }
          }
          // otherwise, return the response with sample actions and one verification action
          return {
            message: 'The crypto spirits acknowledge your progress, but no tasks are ready for verification yet.',
            actions: [{ type: ChatMessageType.ACTION, message: 'Verify my progress' }, ...this.sampleActions],
          }
        } catch (error) {
          // if error, return the error message with sample actions and one verification action
          return {
            message: error.message,
            actions: [{ type: ChatMessageType.ACTION, message: 'Verify my progress' }, ...this.sampleActions],
          }
        }
      }

      // Check if the action is to claim a reward
      if (this.commands.claim.some((cmd) => dto.message.toLowerCase().includes(cmd))) {
        try {
          const reward = await this.taskService.claimReward(user)
          // if success, return the response with sample actions
          return {
            message: `✨ The crypto spirits bestow upon you their blessing! You have received ${reward.amount} ${reward.symbol}. May it serve you well in your journey.`,
            actions: this.sampleActions,
          }
        } catch (error) {
          // if error, return the error message with sample actions and one claim reward action
          return {
            message: error.message || 'The spirits find no rewards ready for claiming at this time.',
            actions: [{ type: ChatMessageType.ACTION, message: 'Claim my reward' }, ...this.sampleActions],
          }
        }
      }
    }

    // Default fallback to predefined responses
    const category = Object.keys(this.responses).find((key) => dto.message.toLowerCase().includes(key))

    if (category) {
      const responses = this.responses[category]
      // return a random response from the category and add random getTask cta as first element
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      const randomGetTaskCta = this.cta.getTask[Math.floor(Math.random() * this.cta.getTask.length)]
      return {
        message: randomResponse.message,
        actions: [{ type: ChatMessageType.ACTION, message: randomGetTaskCta }, ...randomResponse.actions],
      }
    }

    // Default response
    return this.defaultResponse
  }
}
