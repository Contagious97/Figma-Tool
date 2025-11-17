import { FigmaClient } from './client'
import { FigmaNode, Color } from './types'

export interface ExtractedFrame {
  id: string
  name: string
  type: 'FRAME' | 'COMPONENT' | 'INSTANCE'
  width: number
  height: number
  x: number
  y: number
  pageId: string
  pageName: string
  backgroundColor?: string
  hasPrototypeStartNode: boolean
  children: FigmaNode[]
}

interface RGBA {
  r: number // 0-1
  g: number // 0-1
  b: number // 0-1
  a?: number // 0-1
}

export class FigmaParser {
  constructor(private client: FigmaClient) {}

  async extractFrames(
    fileKey: string,
    pageIds: string[]
  ): Promise<ExtractedFrame[]> {
    const file = await this.client.getFile(fileKey)
    const frames: ExtractedFrame[] = []

    for (const page of file.document.children || []) {
      // Skip pages not selected by user
      if (!pageIds.includes(page.id)) continue
      if (page.type !== 'CANVAS') continue

      // Extract frames from this page
      for (const node of page.children || []) {
        if (this.isTopLevelFrame(node)) {
          frames.push(this.parseFrame(node, page))
        }
      }
    }

    return frames
  }

  private isTopLevelFrame(node: FigmaNode): boolean {
    // Include frames, components, and component instances
    return (
      (node.type === 'FRAME' ||
        node.type === 'COMPONENT' ||
        node.type === 'INSTANCE') &&
      node.absoluteBoundingBox !== undefined
    )
  }

  private parseFrame(node: FigmaNode, page: FigmaNode): ExtractedFrame {
    const bbox = node.absoluteBoundingBox!

    return {
      id: node.id,
      name: node.name,
      type: node.type as 'FRAME' | 'COMPONENT' | 'INSTANCE',
      width: Math.round(bbox.width),
      height: Math.round(bbox.height),
      x: Math.round(bbox.x),
      y: Math.round(bbox.y),
      pageId: page.id,
      pageName: page.name,
      backgroundColor: this.extractBackgroundColor(node),
      hasPrototypeStartNode: !!(node as any).prototypeStartNodeID,
      children: node.children || [],
    }
  }

  private extractBackgroundColor(node: FigmaNode): string | undefined {
    if (node.backgroundColor) {
      return this.rgbaToHex(node.backgroundColor)
    }

    // Check fills
    if (node.fills && Array.isArray(node.fills)) {
      const solidFill = node.fills.find(
        (fill: any) => fill.type === 'SOLID' && fill.visible !== false
      )
      if (solidFill && solidFill.color) {
        return this.rgbaToHex(solidFill.color as Color)
      }
    }

    return undefined
  }

  private rgbaToHex(color: Color): string {
    const r = Math.round(color.r * 255)
    const g = Math.round(color.g * 255)
    const b = Math.round(color.b * 255)
    const a = color.a !== undefined ? color.a : 1

    if (a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
    }

    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
}
