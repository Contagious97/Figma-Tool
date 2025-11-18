import { revalidateTag } from 'next/cache'

/**
 * Cache management utilities for Figma data
 */

/**
 * Invalidate the Figma file cache
 * Call this when you want to force refresh file data
 */
export function invalidateFigmaFileCache() {
  revalidateTag('figma-file')
}

/**
 * Cache keys used throughout the application
 */
export const CacheKeys = {
  FIGMA_FILE: 'figma-file',
  FIGMA_IMAGES: 'figma-images',
  FIGMA_NODES: 'figma-nodes',
} as const

/**
 * Cache durations in seconds
 */
export const CacheDuration = {
  FIGMA_FILE: 3600, // 1 hour
  FIGMA_IMAGES: 7200, // 2 hours (images change less frequently)
  FIGMA_NODES: 1800, // 30 minutes
  PROJECT_DATA: 300, // 5 minutes
} as const
