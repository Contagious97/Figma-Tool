import {
  FigmaFile,
  FigmaUser,
  FigmaImagesResponse,
  FigmaFileNodesResponse,
  FigmaApiError,
} from './types'

export class FigmaClient {
  private token: string
  private baseUrl = 'https://api.figma.com/v1'

  constructor(token: string) {
    this.token = token
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'X-Figma-Token': this.token,
        },
        // Add caching for better performance
        next: { revalidate: 60 }, // Cache for 60 seconds
      })

      if (!response.ok) {
        let errorMessage = `Figma API error: ${response.status}`

        if (response.status === 403) {
          errorMessage = 'Access denied. Check your Figma token or file permissions.'
        } else if (response.status === 404) {
          errorMessage = 'File not found. Check the file URL and try again.'
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.'
        }

        const errorData = await response.json().catch(() => ({}))
        throw new FigmaApiError(errorMessage, response.status, errorData)
      }

      return response.json()
    } catch (error) {
      if (error instanceof FigmaApiError) {
        throw error
      }
      throw new Error(`Failed to fetch from Figma API: ${error}`)
    }
  }

  /**
   * Get information about the current user
   */
  async getMe(): Promise<FigmaUser> {
    return this.request<FigmaUser>('/me')
  }

  /**
   * Get a Figma file by file key
   * @param fileKey - The file key from the Figma URL
   * @param options - Optional parameters
   */
  async getFile(
    fileKey: string,
    options?: {
      version?: string
      ids?: string[] // Specific node IDs to include
      depth?: number // How deep to traverse (default: entire file)
      geometry?: 'paths' // Include full vector data
    }
  ): Promise<FigmaFile> {
    let endpoint = `/files/${fileKey}`

    if (options) {
      const params = new URLSearchParams()
      if (options.version) params.append('version', options.version)
      if (options.ids) params.append('ids', options.ids.join(','))
      if (options.depth !== undefined) params.append('depth', String(options.depth))
      if (options.geometry) params.append('geometry', options.geometry)

      const queryString = params.toString()
      if (queryString) {
        endpoint += `?${queryString}`
      }
    }

    return this.request<FigmaFile>(endpoint)
  }

  /**
   * Get specific nodes from a file
   * @param fileKey - The file key
   * @param nodeIds - Array of node IDs to fetch
   */
  async getFileNodes(
    fileKey: string,
    nodeIds: string[]
  ): Promise<FigmaFileNodesResponse> {
    const params = new URLSearchParams({
      ids: nodeIds.join(','),
    })

    return this.request<FigmaFileNodesResponse>(`/files/${fileKey}/nodes?${params}`)
  }

  /**
   * Get rendered images for nodes
   * @param fileKey - The file key
   * @param options - Image rendering options
   */
  async getImages(
    fileKey: string,
    options: {
      ids: string[]
      scale?: number
      format?: 'jpg' | 'png' | 'svg' | 'pdf'
      svgIncludeId?: boolean
      svgSimplifyStroke?: boolean
      useAbsoluteBounds?: boolean
      version?: string
    }
  ): Promise<Record<string, string>> {
    const params = new URLSearchParams({
      ids: options.ids.join(','),
      scale: String(options.scale || 2),
      format: options.format || 'png',
    })

    if (options.svgIncludeId !== undefined) {
      params.append('svg_include_id', String(options.svgIncludeId))
    }
    if (options.svgSimplifyStroke !== undefined) {
      params.append('svg_simplify_stroke', String(options.svgSimplifyStroke))
    }
    if (options.useAbsoluteBounds !== undefined) {
      params.append('use_absolute_bounds', String(options.useAbsoluteBounds))
    }
    if (options.version) {
      params.append('version', options.version)
    }

    const data = await this.request<FigmaImagesResponse>(
      `/images/${fileKey}?${params}`
    )

    if (data.err) {
      throw new Error(`Failed to get images: ${data.err}`)
    }

    return data.images
  }

  /**
   * Get all frames (top-level nodes) from a file
   * Useful for importing and listing screens
   */
  async getFrames(fileKey: string): Promise<Array<{
    id: string
    name: string
    type: string
    page: string
  }>> {
    const file = await this.getFile(fileKey)
    const frames: Array<{ id: string; name: string; type: string; page: string }> = []

    // Iterate through pages (CANVAS nodes)
    file.document.children?.forEach((page) => {
      if (page.type === 'CANVAS') {
        // Iterate through frames in each page
        page.children?.forEach((node) => {
          if (node.type === 'FRAME' || node.type === 'COMPONENT') {
            frames.push({
              id: node.id,
              name: node.name,
              type: node.type,
              page: page.name,
            })
          }
        })
      }
    })

    return frames
  }

  /**
   * Validate that the API token is working
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getMe()
      return true
    } catch (error) {
      return false
    }
  }
}

/**
 * Parse a Figma URL to extract the file key
 */
export function parseFigmaUrl(input: string): {
  fileKey: string
  fileName?: string
  nodeId?: string
} | null {
  const trimmed = input.trim()

  // Pattern 1: Full URL with /file/
  const filePattern = /figma\.com\/file\/([a-zA-Z0-9]+)(?:\/([^?/]+))?/
  let match = trimmed.match(filePattern)
  if (match) {
    return {
      fileKey: match[1],
      fileName: match[2] ? decodeURIComponent(match[2]) : undefined,
    }
  }

  // Pattern 2: Full URL with /design/
  const designPattern = /figma\.com\/design\/([a-zA-Z0-9]+)(?:\/([^?/]+))?/
  match = trimmed.match(designPattern)
  if (match) {
    return {
      fileKey: match[1],
      fileName: match[2] ? decodeURIComponent(match[2]) : undefined,
    }
  }

  // Pattern 3: URL with node ID (specific frame)
  const nodePattern = /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)\/[^?]*\?node-id=([^&]+)/
  match = trimmed.match(nodePattern)
  if (match) {
    return {
      fileKey: match[1],
      nodeId: match[2].replace(/-/g, ':'), // Figma uses : in API
    }
  }

  // Pattern 4: Just the file key (22 characters)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return {
      fileKey: trimmed,
    }
  }

  return null
}

/**
 * Validate that a file key has the correct format
 */
export function validateFileKey(fileKey: string): boolean {
  return /^[a-zA-Z0-9]{22}$/.test(fileKey)
}
