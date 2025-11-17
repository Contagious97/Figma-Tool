export interface TypographyStyle {
  id: string // Unique identifier for this style
  fontFamily: string
  fontWeight: number
  fontSize: number
  lineHeight: number | 'AUTO'
  lineHeightPx?: number
  letterSpacing: number | 'AUTO'
  letterSpacingPx?: number
  textCase: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE'
  textDecoration: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH'
  usageCount: number
  category: string // h1, h2, body, caption, etc.
  examples: Array<{
    text: string
    nodeName: string
  }>
}

export class TypographyExtractor {
  private styleMap = new Map<string, TypographyStyle>()
  private styleIdCounter = 0

  extractTypography(nodes: any[]): TypographyStyle[] {
    this.styleMap.clear()
    this.styleIdCounter = 0

    for (const node of nodes) {
      this.traverseNode(node)
    }

    const styles = Array.from(this.styleMap.values())

    // Sort by usage
    styles.sort((a, b) => b.usageCount - a.usageCount)

    // Categorize
    this.categorizeTypography(styles)

    return styles
  }

  private traverseNode(node: any) {
    if (node.type === 'TEXT' && node.style) {
      const style = node.style
      const key = this.getStyleKey(style)

      if (!this.styleMap.has(key)) {
        this.styleMap.set(key, {
          id: `style-${this.styleIdCounter++}`,
          fontFamily: style.fontFamily || 'Unknown',
          fontWeight: style.fontWeight || 400,
          fontSize: style.fontSize || 16,
          lineHeight:
            style.lineHeightPercentFontSize || style.lineHeightPx || 'AUTO',
          lineHeightPx: style.lineHeightPx,
          letterSpacing: style.letterSpacing || 0,
          letterSpacingPx: style.letterSpacing || 0,
          textCase: style.textCase || 'ORIGINAL',
          textDecoration: style.textDecoration || 'NONE',
          usageCount: 0,
          category: 'unknown',
          examples: [],
        })
      }

      const styleInfo = this.styleMap.get(key)!
      styleInfo.usageCount++

      if (styleInfo.examples.length < 3) {
        styleInfo.examples.push({
          text: (node.characters || '').substring(0, 50),
          nodeName: node.name,
        })
      }
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.traverseNode(child)
      }
    }
  }

  private getStyleKey(style: any): string {
    return `${style.fontFamily}-${style.fontWeight}-${style.fontSize}-${
      style.lineHeightPx || 'auto'
    }-${style.letterSpacing || 0}`
  }

  private categorizeTypography(styles: TypographyStyle[]) {
    // Group by font size
    const sizeGroups = [...styles].sort((a, b) => b.fontSize - a.fontSize)

    // Assign categories based on size
    for (let i = 0; i < sizeGroups.length; i++) {
      const style = sizeGroups[i]

      if (style.fontSize >= 40) {
        style.category = 'h1'
      } else if (style.fontSize >= 32) {
        style.category = 'h2'
      } else if (style.fontSize >= 24) {
        style.category = 'h3'
      } else if (style.fontSize >= 20) {
        style.category = 'h4'
      } else if (style.fontSize >= 16) {
        if (style.fontWeight >= 600) {
          style.category = 'h5'
        } else {
          style.category = 'body'
        }
      } else if (style.fontSize >= 14) {
        style.category = 'body-sm'
      } else {
        style.category = 'caption'
      }
    }
  }

  // Generate type scale
  generateTypeScale(styles: TypographyStyle[]): {
    baseSize: number
    scale: number
    sizes: number[]
  } {
    const sizes = [...new Set(styles.map((s) => s.fontSize))].sort(
      (a, b) => a - b
    )

    if (sizes.length < 2) {
      return {
        baseSize: sizes[0] || 16,
        scale: 1.25,
        sizes,
      }
    }

    // Calculate average scale ratio
    const ratios: number[] = []
    for (let i = 1; i < sizes.length; i++) {
      ratios.push(sizes[i] / sizes[i - 1])
    }

    const averageRatio =
      ratios.reduce((sum, r) => sum + r, 0) / ratios.length

    return {
      baseSize: sizes[0],
      scale: Number(averageRatio.toFixed(2)),
      sizes,
    }
  }
}
