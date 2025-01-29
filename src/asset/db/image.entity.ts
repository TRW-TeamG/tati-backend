import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  filename: string

  @Column()
  prompt: string

  @Column({ name: 's3_url' })
  s3Url: string

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
}
