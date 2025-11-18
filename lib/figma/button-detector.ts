import { FigmaNode } from './types'

export interface DetectedButton {
  id: string
  name: string
  label: string
  type: 'primary' | 'secondary' | 'tertiary' | 'text' | 'icon' | 'unknown'
  state: 'default' | 'hover' | 'pressed' | 'disabled' | 'unknown'
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  frameId: string
  destination?: {
    frameId: string
    frameName: string
    interactionType: 'tap' | 'hover' | 'drag' | 'key'
  }
  componentId?: string
  confidence: number // 0-100
  detectionReasons: string[]
}

export class ButtonDetector {
  // Scoring weights for button detection
  private readonly WEIGHTS = {
    NAME_CONTAINS_BUTTON: 25,
    IS_COMPONENT: 15,
    HAS_INTERACTION: 30,
    HAS_TEXT_CHILD: 10,
    HAS_ROUNDED_CORNERS: 8,
    HAS_FILL_AND_STROKE: 7,
    REASONABLE_SIZE: 5,
  }

  private readonly BUTTON_KEYWORDS = [
    'button',
    'btn',
    'cta',
    'action',
    'submit',
    'confirm',
    'cancel',
    'next',
    'back',
    'save',
    'delete',
    'edit',
    'add',
    'create',
  ]

  detectButtons(nodes: FigmaNode[], frameId: string): DetectedButton[] {
    const buttons: DetectedButton[] = []

    const traverse = (node: FigmaNode, depth = 0) => {
      // Don't go too deep
      if (depth > 5) return

      const score = this.scoreNode(node)

      // Threshold: 40+ points = button
      if (score.total >= 40) {
        const button = this.createButton(node, score, frameId)
        buttons.push(button)
        return // Don't traverse children if this is a button
      }

      // Continue searching in children
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child, depth + 1)
        }
      }
    }

    for (const node of nodes) {
      traverse(node)
    }

    return buttons
  }

  private scoreNode(node: FigmaNode): {
    total: number
    reasons: string[]
    breakdown: Record<string, number>
  } {
    let total = 0
    const reasons: string[] = []
    const breakdown: Record<string, number> = {}

    // 1. Name contains button keyword
    const lowerName = node.name.toLowerCase()
    for (const keyword of this.BUTTON_KEYWORDS) {
      if (lowerName.includes(keyword)) {
        total += this.WEIGHTS.NAME_CONTAINS_BUTTON
        reasons.push(`Name contains "${keyword}"`)
        breakdown.NAME_CONTAINS_BUTTON = this.WEIGHTS.NAME_CONTAINS_BUTTON
        break
      }
    }

    // 2. Is a component or instance
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      total += this.WEIGHTS.IS_COMPONENT
      reasons.push('Is a component')
      breakdown.IS_COMPONENT = this.WEIGHTS.IS_COMPONENT
    }

    // 3. Has interaction/prototype link
    if (
      (node as any).reactions &&
      Array.isArray((node as any).reactions) &&
      (node as any).reactions.length > 0
    ) {
      total += this.WEIGHTS.HAS_INTERACTION
      reasons.push('Has prototype interaction')
      breakdown.HAS_INTERACTION = this.WEIGHTS.HAS_INTERACTION
    }

    // 4. Contains text node
    if (this.hasTextChild(node)) {
      total += this.WEIGHTS.HAS_TEXT_CHILD
      reasons.push('Contains text')
      breakdown.HAS_TEXT_CHILD = this.WEIGHTS.HAS_TEXT_CHILD
    }

    // 5. Has rounded corners
    if ((node as any).cornerRadius && (node as any).cornerRadius > 4) {
      total += this.WEIGHTS.HAS_ROUNDED_CORNERS
      reasons.push(`Rounded corners (${(node as any).cornerRadius}px)`)
      breakdown.HAS_ROUNDED_CORNERS = this.WEIGHTS.HAS_ROUNDED_CORNERS
    }

    // 6. Has both fill and stroke (common button pattern)
    const hasFill =
      (node as any).fills &&
      Array.isArray((node as any).fills) &&
      (node as any).fills.length > 0
    const hasStroke =
      (node as any).strokes &&
      Array.isArray((node as any).strokes) &&
      (node as any).strokes.length > 0

    if (hasFill || hasStroke) {
      total += this.WEIGHTS.HAS_FILL_AND_STROKE
      reasons.push('Has fill/stroke')
      breakdown.HAS_FILL_AND_STROKE = this.WEIGHTS.HAS_FILL_AND_STROKE
    }

    // 7. Reasonable button size (not too small, not too large)
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox
      if (width >= 40 && width <= 400 && height >= 30 && height <= 100) {
        total += this.WEIGHTS.REASONABLE_SIZE
        reasons.push('Reasonable button dimensions')
        breakdown.REASONABLE_SIZE = this.WEIGHTS.REASONABLE_SIZE
      }
    }

    return { total, reasons, breakdown }
  }

  private hasTextChild(node: FigmaNode): boolean {
    if (node.type === 'TEXT') return true

    if (node.children && Array.isArray(node.children)) {
      return node.children.some((child) => this.hasTextChild(child))
    }

    return false
  }

  private createButton(
    node: FigmaNode,
    score: { total: number; reasons: string[] },
    frameId: string
  ): DetectedButton {
    const bbox = node.absoluteBoundingBox || { x: 0, y: 0, width: 0, height: 0 }

    // Extract button label from text children
    const label = this.extractButtonLabel(node)

    // Determine button type
    const type = this.determineButtonType(node, label)

    // Determine button state
    const state = this.determineButtonState(node)

    // Extract destination from prototype links
    const destination = this.extractDestination(node)

    return {
      id: node.id,
      name: node.name,
      label,
      type,
      state,
      position: {
        x: Math.round(bbox.x),
        y: Math.round(bbox.y),
        width: Math.round(bbox.width),
        height: Math.round(bbox.height),
      },
      frameId,
      destination,
      componentId: node.type === 'INSTANCE' ? (node as any).componentId : undefined,
      confidence: Math.min(100, score.total),
      detectionReasons: score.reasons,
    }
  }

  private extractButtonLabel(node: FigmaNode): string {
    const collectText = (n: FigmaNode): string => {
      if (n.type === 'TEXT' && (n as any).characters) {
        return (n as any).characters
      }

      if (n.children && Array.isArray(n.children)) {
        return n.children.map(collectText).filter(Boolean).join(' ')
      }

      return ''
    }

    const text = collectText(node).trim()
    return text || node.name
  }

  private determineButtonType(node: FigmaNode, label: string): DetectedButton['type'] {
    const lowerLabel = label.toLowerCase()
    const lowerName = node.name.toLowerCase()

    // Icon button (no/minimal text)
    if (label.length <= 2 || lowerName.includes('icon')) {
      return 'icon'
    }

    // Primary button keywords
    if (
      lowerLabel.includes('submit') ||
      lowerLabel.includes('confirm') ||
      lowerLabel.includes('save') ||
      lowerLabel.includes('continue') ||
      lowerName.includes('primary')
    ) {
      return 'primary'
    }

    // Secondary button keywords
    if (
      lowerLabel.includes('cancel') ||
      lowerLabel.includes('back') ||
      lowerName.includes('secondary')
    ) {
      return 'secondary'
    }

    // Text button (no background fill)
    const hasSolidFill =
      (node as any).fills &&
      Array.isArray((node as any).fills) &&
      (node as any).fills.some((f: any) => f.type === 'SOLID' && f.opacity > 0.5)

    if (!hasSolidFill) {
      return 'text'
    }

    return 'unknown'
  }

  private determineButtonState(node: FigmaNode): DetectedButton['state'] {
    const lowerName = node.name.toLowerCase()

    if (lowerName.includes('disabled') || lowerName.includes('inactive')) {
      return 'disabled'
    }

    if (lowerName.includes('hover')) {
      return 'hover'
    }

    if (lowerName.includes('pressed') || lowerName.includes('active')) {
      return 'pressed'
    }

    return 'default'
  }

  private extractDestination(node: FigmaNode): DetectedButton['destination'] | undefined {
    if (!(node as any).reactions || !Array.isArray((node as any).reactions)) {
      return undefined
    }

    // Find navigation action
    const navReaction = (node as any).reactions.find(
      (r: any) => r.action?.type === 'NODE'
    )

    if (!navReaction || !navReaction.action) {
      return undefined
    }

    return {
      frameId: navReaction.action.destinationId || '',
      frameName: '', // Will be resolved later
      interactionType: this.mapTriggerType(navReaction.trigger?.type),
    }
  }

  private mapTriggerType(type: string | undefined): 'tap' | 'hover' | 'drag' | 'key' {
    switch (type) {
      case 'ON_CLICK':
      case 'ON_PRESS':
        return 'tap'
      case 'ON_HOVER':
      case 'MOUSE_ENTER':
        return 'hover'
      case 'ON_DRAG':
        return 'drag'
      case 'ON_KEY_DOWN':
        return 'key'
      default:
        return 'tap'
    }
  }

  // Resolve frame names for destinations
  resolveDestinations(
    buttons: DetectedButton[],
    frames: Map<string, { id: string; name: string }>
  ): void {
    for (const button of buttons) {
      if (button.destination) {
        const frame = frames.get(button.destination.frameId)
        if (frame) {
          button.destination.frameName = frame.name
        }
      }
    }
  }
}
