import { safeFetchAssetV1, safeFetchCollectionV1, updateV2 } from '@metaplex-foundation/mpl-core'
import { publicKey } from '@metaplex-foundation/umi'
import { Repository } from 'typeorm'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'

import { User } from '@/auth/db'
import { generateFilename } from '@/lib/helpers'
import { convertUmiToWeb3JsInstruction } from '@/solana/lib/utils'
import { SolanaService } from '@/solana/solana.service'
import { SupabaseService } from '@/supabase/supabase.service'
import { TaskService } from '@/tasks/task.service'

import { Asset } from './db/asset.entity'
import { Image } from './db/image.entity'
import { AssetMetadata } from './types/metadata'

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly taskService: TaskService,
    private readonly solanaService: SolanaService,
    private readonly config: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async createAsset(mint: string, user: User): Promise<Asset> {
    const umi = await this.solanaService.getUmi()
    const assetMint = publicKey(mint)
    const collectionMint = publicKey(this.config.get<string>('collection.mint'))

    // Check if user has completed unrewarded tasks
    const unrewardedTasks = await this.taskService.getUnrewardedTasks(user)
    if (unrewardedTasks.length === 0) {
      throw new Error('Not eligible for asset minting')
    }

    // Check if we have this asset already
    const existingAsset = await this.assetRepository.findOneBy({ mint })
    if (existingAsset) {
      // check if collection is the same, return early if so, otherwise update
      if (existingAsset.collection === collectionMint.toString()) {
        return existingAsset
      }
    }

    // Fetch asset metadata from chain
    const asset = await safeFetchAssetV1(umi, assetMint)
    if (!asset) {
      throw new Error('Asset metadata not found')
    }

    // Fetch collection metadata
    const collection = await safeFetchCollectionV1(umi, collectionMint)
    if (!collection) {
      throw new Error('Collection not found')
    }

    // Get next ID for naming
    const count = await this.assetRepository.count()
    const id = count + 1
    const name = `Tati #${id.toString().padStart(4, '0')}`

    // Get random image
    const randomImage = await this.imageRepository.createQueryBuilder().orderBy('RANDOM()').limit(1).getOne()

    // Get filename and extension
    const [filename, extension] = randomImage.filename.split('.')

    // Move image to public bucket
    const publicUrl = await this.supabaseService.moveFileToPublic(
      randomImage.s3Url,
      `${generateFilename(filename)}.${extension}`,
    )

    // Delete image from database
    await this.imageRepository.delete(randomImage.id)

    // Create asset record
    const newAsset = await this.assetRepository.save({
      name,
      collection: collection.publicKey.toString(),
      mint: asset.publicKey.toString(),
      image: publicUrl,
    })

    try {
      // Update onchain metadata
      const umiInstructions = await updateV2(umi, {
        asset: assetMint,
        newCollection: collectionMint,
        newName: newAsset.name,
        newUri: newAsset.image,
      }).getInstructions()

      const web3JsInstructions = convertUmiToWeb3JsInstruction(umiInstructions)

      // Send transaction
      const tx = await this.solanaService.sendAssetUpdate({
        instructions: web3JsInstructions,
        fee: this.config.get<number>('solana.fee.low'),
      })

      console.log('tx', tx)

      // mark tasks as rewarded
      await this.taskService.markTasksAsRewarded(unrewardedTasks)
    } catch (error) {
      console.error('Error updating asset', error)
    }

    return newAsset
  }

  async getAssetMetadata(id: number): Promise<AssetMetadata> {
    const asset = await this.assetRepository.findOneBy({ id })
    if (!asset) {
      throw new Error('Asset not found')
    }

    return {
      name: asset.name,
      description: `A unique digital collectible from the Tati Collection. This is NFT #${id} in the launch series.`,
      image: asset.image,
      attributes: [],
      properties: {
        files: [
          {
            uri: asset.image,
            type: 'image/png',
          },
        ],
        category: 'image',
      },
    }
  }
}
