import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'

import { User } from '@/auth/db'
import { CurrentUser } from '@/auth/decorators'
import { JwtAuthGuard } from '@/auth/guards/jwt.guard'

import { AssetService } from './asset.service'
import { Asset } from './db/asset.entity'
import { AssetMetadata } from './types/metadata'

export class MintDto {
  mint: string
}

@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post('mint')
  @UseGuards(JwtAuthGuard)
  mintAsset(@CurrentUser() user: User, @Body() { mint }: MintDto): Promise<Asset> {
    return this.assetService.createAsset(mint, user)
  }

  @Get(':id.json')
  getAsset(@Param('id') id: number): Promise<AssetMetadata> {
    return this.assetService.getAssetMetadata(id)
  }
}
