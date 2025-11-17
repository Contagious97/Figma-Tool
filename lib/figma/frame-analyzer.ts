import { FigmaNode, Color } from './types'
import { ExtractedFrame } from './parser'

interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

export interface FrameAnalysis {
  frameId: string
  elements: ElementInfo[]
  colors: ColorInfo[]
  typography: TypographyInfo[]
  spacing: SpacingInfo
  layout: LayoutInfo
  components: ComponentUsage[]
}

interface ElementInfo {
  id: string
  name: string
  type: string
  depth: number
  x?: number
  y?: number
  width?: number
  height?: number
  textContent?: string
  fontSize?: number
  fontFamily?: string
  cornerRadius?: number
}

interface ColorInfo {
  hex: string
  rgba: RGBA
  usageCount: number
  usageType: string[] // 'fill', 'stroke', 'text'
}

interface TypographyInfo {
  fontFamily: string
  fontWeight: number
  fontSize: number
  lineHeight: number
  letterSpacing: number
  usageCount: number
  category: string // h1, h2, body, caption
}

interface SpacingInfo {
  detectedScale: number[]
  allValues: number[]
}

interface LayoutInfo {
  type: 'stack' | 'grid' | 'absolute' | 'none'
  direction?: 'vertical' | 'horizontal'
  gap?: number
  alignment?: string
  columns?: number
  gutterSize?: number
  offset?: number
}

interface ComponentUsage {
  instanceId: string
  componentId: string
  name: string
  x: number
  y: number
}

export class FrameAnalyzer {
  analyzeFrame(frame: ExtractedFrame): FrameAnalysis {
    const elements = this.extractElements(frame.children)
    const colors = this.extractColors(frame.children)
    const typography = this.extractTypography(frame.children)
    const spacing = this.analyzeSpacing(frame.children)
    const layout = this.analyzeLayout(frame)
    const components = this.extractComponents(frame.children)

    return {
      frameId: frame.id,
      elements,
      colors,
      typography,
      spacing,
      layout,
      components,
    }
  }

  private extractElements(nodes: FigmaNode[], depth = 0): ElementInfo[] {
    const elements: ElementInfo[] = []
    const maxDepth = 5 // Prevent infinite recursion

    if (depth > maxDepth) return elements

    for (const node of nodes) {
      // Extract element info based on type
      const element: ElementInfo = {
        id: node.id,
        name: node.name,
        type: node.type,
        depth,
        ...this.getElementPosition(node),
      }

      // Add type-specific properties
      if (node.type === 'TEXT') {
        element.textContent = (node as any).characters || ''
        element.fontSize = (node as any).style?.fontSize
        element.fontFamily = (node as any).style?.fontFamily
      }

      if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
        element.cornerRadius = (node as any).cornerRadius
      }

      elements.push(element)

      // Recurse into children
      if (node.children && node.children.length > 0) {
        elements.push(...this.extractElements(node.children, depth + 1))
      }
    }

    return elements
  }

  private getElementPosition(node: FigmaNode) {
    if (node.absoluteBoundingBox) {
      return {
        x: Math.round(node.absoluteBoundingBox.x),
        y: Math.round(node.absoluteBoundingBox.y),
        width: Math.round(node.absoluteBoundingBox.width),
        height: Math.round(node.absoluteBoundingBox.height),
      }
    }
    return {}
  }

  private extractColors(nodes: FigmaNode[]): ColorInfo[] {
    const colorMap = new Map<string, ColorInfo>()

    const traverse = (node: FigmaNode) => {
      // Extract fill colors
      if ((node as any).fills && Array.isArray((node as any).fills)) {
        for (const fill of (node as any).fills) {
          if (fill.type === 'SOLID' && fill.visible !== false && fill.color) {
            const hex = this.rgbaToHex(fill.color)

            if (!colorMap.has(hex)) {
              colorMap.set(hex, {
                hex,
                rgba: {
                  r: fill.color.r,
                  g: fill.color.g,
                  b: fill.color.b,
                  a: fill.color.a !== undefined ? fill.color.a : 1,
                },
                usageCount: 0,
                usageType: [],
              })
            }

            const colorInfo = colorMap.get(hex)!
            colorInfo.usageCount++
            if (!colorInfo.usageType.includes('fill')) {
              colorInfo.usageType.push('fill')
            }
          }
        }
      }

      // Extract stroke colors
      if ((node as any).strokes && Array.isArray((node as any).strokes)) {
        for (const stroke of (node as any).strokes) {
          if (
            stroke.type === 'SOLID' &&
            stroke.visible !== false &&
            stroke.color
          ) {
            const hex = this.rgbaToHex(stroke.color)

            if (!colorMap.has(hex)) {
              colorMap.set(hex, {
                hex,
                rgba: {
                  r: stroke.color.r,
                  g: stroke.color.g,
                  b: stroke.color.b,
                  a: stroke.color.a !== undefined ? stroke.color.a : 1,
                },
                usageCount: 0,
                usageType: [],
              })
            }

            const colorInfo = colorMap.get(hex)!
            colorInfo.usageCount++
            if (!colorInfo.usageType.includes('stroke')) {
              colorInfo.usageType.push('stroke')
            }
          }
        }
      }

      // Recurse
      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    nodes.forEach(traverse)

    return Array.from(colorMap.values()).sort(
      (a, b) => b.usageCount - a.usageCount
    )
  }

  private extractTypography(nodes: FigmaNode[]): TypographyInfo[] {
    const typographyMap = new Map<string, TypographyInfo>()

    const traverse = (node: FigmaNode) => {
      if (node.type === 'TEXT') {
        const textNode = node as any
        const style = textNode.style || {}

        const key = `${style.fontFamily}-${style.fontWeight}-${style.fontSize}-${style.lineHeightPx}`

        if (!typographyMap.has(key)) {
          typographyMap.set(key, {
            fontFamily: style.fontFamily || 'Unknown',
            fontWeight: style.fontWeight || 400,
            fontSize: style.fontSize || 16,
            lineHeight: style.lineHeightPx || style.fontSize * 1.2,
            letterSpacing: style.letterSpacing || 0,
            usageCount: 0,
            category: this.categorizeTypography(style.fontSize),
          })
        }

        typographyMap.get(key)!.usageCount++
      }

      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    nodes.forEach(traverse)

    return Array.from(typographyMap.values()).sort(
      (a, b) => b.usageCount - a.usageCount
    )
  }

  private categorizeTypography(fontSize: number): string {
    if (fontSize >= 40) return 'h1'
    if (fontSize >= 32) return 'h2'
    if (fontSize >= 24) return 'h3'
    if (fontSize >= 20) return 'h4'
    if (fontSize >= 16) return 'h5'
    if (fontSize >= 14) return 'h6'
    if (fontSize >= 12) return 'body'
    return 'caption'
  }

  private analyzeSpacing(nodes: FigmaNode[]): SpacingInfo {
    const spacingValues: number[] = []

    const traverse = (node: FigmaNode) => {
      // Check for Auto Layout spacing
      if ((node as any).layoutMode) {
        const itemSpacing = (node as any).itemSpacing
        if (itemSpacing && itemSpacing > 0) {
          spacingValues.push(itemSpacing)
        }

        const paddingLeft = (node as any).paddingLeft || 0
        const paddingRight = (node as any).paddingRight || 0
        const paddingTop = (node as any).paddingTop || 0
        const paddingBottom = (node as any).paddingBottom || 0

        if (paddingLeft > 0) spacingValues.push(paddingLeft)
        if (paddingRight > 0) spacingValues.push(paddingRight)
        if (paddingTop > 0) spacingValues.push(paddingTop)
        if (paddingBottom > 0) spacingValues.push(paddingBottom)
      }

      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    nodes.forEach(traverse)

    // Detect spacing scale (common values)
    const spacingScale = this.detectSpacingScale(spacingValues)

    return {
      detectedScale: spacingScale,
      allValues: [...new Set(spacingValues)].sort((a, b) => a - b),
    }
  }

  private detectSpacingScale(values: number[]): number[] {
    // Common design system scales
    const commonScales = [
      [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
      [2, 4, 8, 16, 32, 64],
      [8, 16, 24, 32, 40, 48],
    ]

    // Count how many values match each scale
    const scaleScores = commonScales.map((scale) => {
      const matches = values.filter((v) => scale.includes(v)).length
      return { scale, matches }
    })

    // Return scale with most matches, or custom scale
    const bestScale = scaleScores.sort((a, b) => b.matches - a.matches)[0]

    if (bestScale.matches >= 3) {
      return bestScale.scale
    }

    // Return custom detected scale (values that appear 3+ times)
    const valueFrequency = new Map<number, number>()
    values.forEach((v) => {
      valueFrequency.set(v, (valueFrequency.get(v) || 0) + 1)
    })

    return Array.from(valueFrequency.entries())
      .filter(([, count]) => count >= 3)
      .map(([value]) => value)
      .sort((a, b) => a - b)
  }

  private analyzeLayout(frame: ExtractedFrame): LayoutInfo {
    const rootNode = frame.children[0] // Assume first child is main container

    if (!rootNode) {
      return {
        type: 'none',
      }
    }

    const layoutMode = (rootNode as any).layoutMode

    if (layoutMode === 'VERTICAL') {
      return {
        type: 'stack',
        direction: 'vertical',
        gap: (rootNode as any).itemSpacing || 0,
        alignment: (rootNode as any).primaryAxisAlignItems,
      }
    }

    if (layoutMode === 'HORIZONTAL') {
      return {
        type: 'stack',
        direction: 'horizontal',
        gap: (rootNode as any).itemSpacing || 0,
        alignment: (rootNode as any).primaryAxisAlignItems,
      }
    }

    // Check for grid layout
    if (
      (rootNode as any).layoutGrids &&
      (rootNode as any).layoutGrids.length > 0
    ) {
      const grid = (rootNode as any).layoutGrids[0]
      return {
        type: 'grid',
        columns: grid.count || 12,
        gutterSize: grid.gutterSize || 0,
        offset: grid.offset || 0,
      }
    }

    return {
      type: 'absolute',
    }
  }

  private extractComponents(nodes: FigmaNode[]): ComponentUsage[] {
    const components: ComponentUsage[] = []

    const traverse = (node: FigmaNode) => {
      if (node.type === 'INSTANCE') {
        const instance = node as any
        components.push({
          instanceId: node.id,
          componentId: instance.componentId,
          name: node.name,
          x: node.absoluteBoundingBox?.x || 0,
          y: node.absoluteBoundingBox?.y || 0,
        })
      }

      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    nodes.forEach(traverse)

    return components
  }

  private rgbaToHex(color: Color): string {
    const r = Math.round(color.r * 255)
    const g = Math.round(color.g * 255)
    const b = Math.round(color.b * 255)
    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
}
