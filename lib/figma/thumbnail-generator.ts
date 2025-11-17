import { FigmaClient } from './client'
import { ExtractedFrame } from './parser'

export class ThumbnailGenerator {
  constructor(private client: FigmaClient) {}

  async generateThumbnails(
    fileKey: string,
    frames: ExtractedFrame[]
  ): Promise<Map<string, string>> {
    const thumbnailMap = new Map<string, string>()

    // Batch frame IDs for efficiency (Figma API allows comma-separated IDs)
    const batchSize = 50
    const batches = this.chunkArray(frames, batchSize)

    for (const batch of batches) {
      const frameIds = batch.map((f) => f.id)

      try {
        const images = await this.client.getImages(fileKey, {
          ids: frameIds,
          scale: 2, // 2x for retina
          format: 'png',
        })

        // Map results
        for (const [nodeId, url] of Object.entries(images)) {
          if (url) {
            thumbnailMap.set(nodeId, url)
          }
        }
      } catch (error) {
        console.error(`Failed to generate thumbnails for batch:`, error)
        // Continue with other batches
      }
    }

    return thumbnailMap
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}
