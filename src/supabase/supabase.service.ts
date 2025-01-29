import { SupabaseClient, createClient } from '@supabase/supabase-js'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient
  private readonly publicBucket: string
  private readonly privateBucket: string

  constructor(private readonly config: ConfigService) {
    this.supabase = createClient(this.config.get<string>('supabase.url'), this.config.get<string>('supabase.anonKey'))
    this.publicBucket = this.config.get<string>('supabase.storage.publicBucket')
    this.privateBucket = this.config.get<string>('supabase.storage.privateBucket')
  }

  async moveFileToPublic(privateFilePath: string, publicFileName: string): Promise<string | null> {
    try {
      // Download from private bucket
      const { data: privateFile, error: downloadError } = await this.supabase.storage
        .from(this.privateBucket)
        .download(privateFilePath)

      if (downloadError || !privateFile) {
        throw new Error(`Failed to download file: ${downloadError?.message}`)
      }

      // Upload to public bucket with new name
      const { data: publicFile, error: uploadError } = await this.supabase.storage
        .from(this.publicBucket)
        .upload(publicFileName, privateFile, {
          contentType: privateFile.type,
          upsert: true,
        })

      if (uploadError || !publicFile) {
        throw new Error(`Failed to upload file: ${uploadError?.message}`)
      }

      // Get public URL
      const { data: publicUrl } = this.supabase.storage.from(this.publicBucket).getPublicUrl(publicFileName)

      // Delete from private bucket
      await this.supabase.storage.from(this.privateBucket).remove([privateFilePath])

      return publicUrl.publicUrl
    } catch (error) {
      console.error('Error moving file:', error)
      return null
    }
  }
}
