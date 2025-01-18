import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'public_key', length: 44, nullable: false, unique: true })
  publicKey: string
}
