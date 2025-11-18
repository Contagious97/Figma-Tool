import { FigmaNode } from './types'

export interface DetectedInput {
  id: string
  name: string
  type: 'text' | 'email' | 'password' | 'number' | 'search' | 'textarea' | 'unknown'
  placeholder?: string
  label?: string
  required: boolean
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  frameId: string
  state: 'default' | 'focus' | 'error' | 'disabled'
  confidence: number
}

export class InputDetector {
  private readonly INPUT_KEYWORDS = [
    'input',
    'field',
    'textfield',
    'textarea',
    'email',
    'password',
    'search',
    'form',
  ]

  detectInputs(nodes: FigmaNode[], frameId: string): DetectedInput[] {
    const inputs: DetectedInput[] = []

    const traverse = (node: FigmaNode, depth = 0) => {
      if (depth > 5) return

      if (this.isInputField(node)) {
        const input = this.createInput(node, frameId)
        inputs.push(input)
        return
      }

      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child, depth + 1)
        }
      }
    }

    for (const node of nodes) {
      traverse(node)
    }

    return inputs
  }

  private isInputField(node: FigmaNode): boolean {
    const lowerName = node.name.toLowerCase()

    // Check for input keywords
    for (const keyword of this.INPUT_KEYWORDS) {
      if (lowerName.includes(keyword)) {
        return true
      }
    }

    // Check for text node with single line and stroke/border
    if (node.type === 'TEXT' || node.type === 'FRAME') {
      const hasStroke =
        (node as any).strokes &&
        Array.isArray((node as any).strokes) &&
        (node as any).strokes.length > 0

      const reasonableInputSize =
        node.absoluteBoundingBox &&
        node.absoluteBoundingBox.width > 100 &&
        node.absoluteBoundingBox.height > 30 &&
        node.absoluteBoundingBox.height < 80

      return hasStroke && reasonableInputSize
    }

    return false
  }

  private createInput(node: FigmaNode, frameId: string): DetectedInput {
    const bbox = node.absoluteBoundingBox || { x: 0, y: 0, width: 0, height: 0 }
    const lowerName = node.name.toLowerCase()

    // Determine input type
    let type: DetectedInput['type'] = 'text'
    if (lowerName.includes('email')) type = 'email'
    else if (lowerName.includes('password')) type = 'password'
    else if (lowerName.includes('search')) type = 'search'
    else if (lowerName.includes('number')) type = 'number'
    else if (lowerName.includes('textarea') || bbox.height > 100) type = 'textarea'

    // Determine state
    let state: DetectedInput['state'] = 'default'
    if (lowerName.includes('focus')) state = 'focus'
    else if (lowerName.includes('error')) state = 'error'
    else if (lowerName.includes('disabled')) state = 'disabled'

    // Extract placeholder/label
    const placeholder = this.extractPlaceholder(node)
    const label = this.findAssociatedLabel(node)

    // Check if required
    const required = lowerName.includes('required') || lowerName.includes('*')

    return {
      id: node.id,
      name: node.name,
      type,
      placeholder,
      label,
      required,
      position: {
        x: Math.round(bbox.x),
        y: Math.round(bbox.y),
        width: Math.round(bbox.width),
        height: Math.round(bbox.height),
      },
      frameId,
      state,
      confidence: 85,
    }
  }

  private extractPlaceholder(node: FigmaNode): string | undefined {
    if (node.type === 'TEXT' && (node as any).characters) {
      return (node as any).characters
    }

    // Look for text in children
    if (node.children && Array.isArray(node.children)) {
      const textNode = node.children.find((c) => c.type === 'TEXT')
      if (textNode && (textNode as any).characters) {
        return (textNode as any).characters
      }
    }

    return undefined
  }

  private findAssociatedLabel(node: FigmaNode): string | undefined {
    // This would require looking at sibling nodes
    // For simplicity, extract from node name
    const name = node.name
    const parts = name.split(/[-_\s]+/)

    // Remove common input keywords
    const filtered = parts.filter(
      (p) => !this.INPUT_KEYWORDS.includes(p.toLowerCase())
    )

    return filtered.join(' ') || undefined
  }
}
