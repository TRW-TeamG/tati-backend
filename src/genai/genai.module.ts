import { Module } from '@nestjs/common'

import { GenAIService } from './genai.service'

@Module({
  providers: [GenAIService],
  exports: [GenAIService],
})
export class GenAIModule {}
