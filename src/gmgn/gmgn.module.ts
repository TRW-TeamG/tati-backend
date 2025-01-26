import { Module } from '@nestjs/common'

import { GmgnService } from './gmgn.service'

@Module({
  providers: [GmgnService],
  exports: [GmgnService],
})
export class GmgnModule {}
