import { Color } from './types'

interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

export interface ExtractedColor {
  hex: string
  rgb: { r: number; g: number; b: number }
  rgba: RGBA
  hsl: { h: number; s: number; l: number }
  usageCount: number
  usageContexts: Array<{
    type: 'fill' | 'stroke' | 'text' | 'background'
    nodeType: string
    nodeName: string
  }>
  category?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic'
}

export class ColorExtractor {
  private colorMap = new Map<string, ExtractedColor>()

  extractColors(nodes: any[]): ExtractedColor[] {
    this.colorMap.clear()

    // Traverse all nodes
    for (const node of nodes) {
      this.traverseNode(node)
    }

    // Sort by usage count
    const colors = Array.from(this.colorMap.values())
    colors.sort((a, b) => b.usageCount - a.usageCount)

    // Categorize colors
    this.categorizeColors(colors)

    return colors
  }

  private traverseNode(node: any) {
    // Extract fills
    if (node.fills && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.visible !== false && fill.color) {
          this.addColor(fill.color, {
            type: 'fill',
            nodeType: node.type,
            nodeName: node.name,
          })
        }
      }
    }

    // Extract strokes
    if (node.strokes && Array.isArray(node.strokes)) {
      for (const stroke of node.strokes) {
        if (stroke.type === 'SOLID' && stroke.visible !== false && stroke.color) {
          this.addColor(stroke.color, {
            type: 'stroke',
            nodeType: node.type,
            nodeName: node.name,
          })
        }
      }
    }

    // Extract background color
    if (node.backgroundColor) {
      this.addColor(node.backgroundColor, {
        type: 'background',
        nodeType: node.type,
        nodeName: node.name,
      })
    }

    // Extract text color (if TEXT node)
    if (node.type === 'TEXT' && node.fills && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.visible !== false && fill.color) {
          this.addColor(fill.color, {
            type: 'text',
            nodeType: node.type,
            nodeName: node.name,
          })
        }
      }
    }

    // Recurse
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.traverseNode(child)
      }
    }
  }

  private addColor(
    color: { r: number; g: number; b: number; a?: number },
    context: { type: string; nodeType: string; nodeName: string }
  ) {
    const rgba: RGBA = {
      r: color.r,
      g: color.g,
      b: color.b,
      a: color.a !== undefined ? color.a : 1,
    }

    const hex = this.rgbaToHex(rgba)
    const rgb = {
      r: Math.round(rgba.r * 255),
      g: Math.round(rgba.g * 255),
      b: Math.round(rgba.b * 255),
    }
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b)

    if (!this.colorMap.has(hex)) {
      this.colorMap.set(hex, {
        hex,
        rgb,
        rgba,
        hsl,
        usageCount: 0,
        usageContexts: [],
      })
    }

    const colorInfo = this.colorMap.get(hex)!
    colorInfo.usageCount++
    colorInfo.usageContexts.push(context as any)
  }

  private rgbaToHex(color: RGBA): string {
    const r = Math.round(color.r * 255)
    const g = Math.round(color.g * 255)
    const b = Math.round(color.b * 255)

    if (color.a < 1) {
      const a = Math.round(color.a * 255)
      return `#${r.toString(16).padStart(2, '0')}${g
        .toString(16)
        .padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a
        .toString(16)
        .padStart(2, '0')}`
    }

    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  private rgbToHsl(
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; l: number } {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    }
  }

  private categorizeColors(colors: ExtractedColor[]) {
    // Skip if too few colors
    if (colors.length < 3) return

    // Filter out white, black, and very light/dark colors for primary analysis
    const significantColors = colors.filter((c) => {
      const { l } = c.hsl
      return l > 10 && l < 90 // Exclude very light/dark
    })

    if (significantColors.length === 0) return

    // Most used significant color = primary
    significantColors[0].category = 'primary'

    // Second most used = secondary (if different hue)
    if (significantColors.length > 1) {
      const primaryHue = significantColors[0].hsl.h
      const secondaryColor = significantColors.find(
        (c) => Math.abs(c.hsl.h - primaryHue) > 30
      )
      if (secondaryColor) {
        secondaryColor.category = 'secondary'
      }
    }

    // High saturation, high lightness = accent
    for (const color of colors) {
      if (color.category) continue

      if (color.hsl.s > 70 && color.hsl.l > 50 && color.hsl.l < 70) {
        color.category = 'accent'
        break // Only one accent
      }
    }

    // Low saturation = neutral
    for (const color of colors) {
      if (color.category) continue

      if (color.hsl.s < 20) {
        color.category = 'neutral'
      }
    }

    // Semantic colors (red, green, yellow, blue)
    for (const color of colors) {
      if (color.category) continue

      const { h, s } = color.hsl

      // Red: error/danger
      if ((h >= 350 || h <= 10) && s > 50) {
        color.category = 'semantic'
      }
      // Green: success
      else if (h >= 100 && h <= 150 && s > 40) {
        color.category = 'semantic'
      }
      // Yellow: warning
      else if (h >= 40 && h <= 60 && s > 50) {
        color.category = 'semantic'
      }
      // Blue: info
      else if (h >= 190 && h <= 240 && s > 50) {
        color.category = 'semantic'
      }
    }
  }

  // Group similar colors
  groupSimilarColors(
    colors: ExtractedColor[],
    threshold = 10
  ): Array<ExtractedColor[]> {
    const groups: Array<ExtractedColor[]> = []
    const used = new Set<string>()

    for (const color of colors) {
      if (used.has(color.hex)) continue

      const group: ExtractedColor[] = [color]
      used.add(color.hex)

      // Find similar colors
      for (const other of colors) {
        if (used.has(other.hex)) continue

        const distance = this.colorDistance(color.rgb, other.rgb)

        if (distance < threshold) {
          group.push(other)
          used.add(other.hex)
        }
      }

      groups.push(group)
    }

    return groups
  }

  private colorDistance(
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number }
  ): number {
    // Euclidean distance in RGB space
    const dr = c1.r - c2.r
    const dg = c1.g - c2.g
    const db = c1.b - c2.b
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }
}
