import { Repository } from 'typeorm'

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { User } from './db'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByPublicKey(publicKey: string): Promise<User | null> {
    return this.userRepository.findOneBy({ publicKey })
  }

  async createUser(publicKey: string): Promise<User> {
    const user = this.userRepository.create({ publicKey })
    return this.userRepository.save(user)
  }

  async findOrCreateUser(publicKey: string): Promise<User> {
    const existingUser = await this.findByPublicKey(publicKey)
    if (existingUser) {
      return existingUser
    }
    return this.createUser(publicKey)
  }
}
