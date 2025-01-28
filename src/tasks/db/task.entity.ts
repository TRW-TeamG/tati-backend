import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { User } from '@/auth/db'

export enum TaskType {
  TOKEN_BUY = 'TOKEN_BUY',
  TOKEN_SELL = 'TOKEN_SELL',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column('text')
  description: string

  @Column({
    type: 'enum',
    enum: TaskType,
  })
  type: TaskType

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus

  @Column('json')
  requirements: {
    tokenAddress?: string
    amount?: string
  }

  @ManyToOne(() => User, { eager: true })
  user: User

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date

  @Column({ default: false })
  rewardClaimed: boolean

  @Column({ type: 'timestamp', nullable: true })
  rewardClaimedAt: Date

  @Column({ nullable: true, unique: true })
  proof: string
}
