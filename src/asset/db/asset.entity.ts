import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  collection: string

  @Column()
  mint: string

  @Column()
  name: string

  @Column()
  image: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
}
