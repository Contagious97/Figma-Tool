import { FigmaNode } from './types'

export interface Connection {
  id: string
  fromFrameId: string
  toFrameId: string
  triggerElementId: string | null // Button/element that triggers
  connectionType: 'prototype' | 'semantic' | 'manual'
  interactionType: 'tap' | 'hover' | 'drag' | 'key' | 'timer' | 'other'
  transitionType?: 'instant' | 'dissolve' | 'slide' | 'push' | 'move'
  duration?: number // milliseconds
  easing?: string
  confirmed: boolean // For semantic connections
  metadata?: Record<string, any>
}

export class FlowParser {
  parsePrototypeFlows(fileData: any): Connection[] {
    const connections: Connection[] = []
    const connectionId = this.createIdGenerator()

    const traverse = (node: any, currentFrameId: string | null = null) => {
      // Track current frame
      if (node.type === 'FRAME' || node.type === 'COMPONENT') {
        currentFrameId = node.id
      }

      // Parse reactions (prototype interactions)
      if (node.reactions && Array.isArray(node.reactions)) {
        for (const reaction of node.reactions) {
          const connection = this.parseReaction(
            reaction,
            node.id,
            currentFrameId,
            connectionId
          )

          if (connection) {
            connections.push(connection)
          }
        }
      }

      // Recurse
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child, currentFrameId)
        }
      }
    }

    traverse(fileData.document)

    return connections
  }

  private parseReaction(
    reaction: any,
    elementId: string,
    frameId: string | null,
    connectionId: () => string
  ): Connection | null {
    // Only handle navigation actions
    if (!reaction.action || reaction.action.type !== 'NODE') {
      return null
    }

    if (!frameId || !reaction.action.destinationId) {
      return null
    }

    // Extract interaction details
    const trigger = reaction.trigger || {}
    const action = reaction.action
    const transition = action.transition || {}

    return {
      id: connectionId(),
      fromFrameId: frameId,
      toFrameId: action.destinationId,
      triggerElementId: elementId,
      connectionType: 'prototype',
      interactionType: this.mapInteractionType(trigger.type),
      transitionType: this.mapTransitionType(transition.type),
      duration: transition.duration ? transition.duration * 1000 : undefined,
      easing: transition.easing,
      confirmed: true,
      metadata: {
        triggerType: trigger.type,
        transitionType: transition.type,
      },
    }
  }

  private mapInteractionType(type: string | undefined): Connection['interactionType'] {
    switch (type) {
      case 'ON_CLICK':
      case 'ON_PRESS':
        return 'tap'
      case 'ON_HOVER':
      case 'MOUSE_ENTER':
      case 'MOUSE_LEAVE':
        return 'hover'
      case 'ON_DRAG':
        return 'drag'
      case 'ON_KEY_DOWN':
        return 'key'
      case 'AFTER_TIMEOUT':
        return 'timer'
      default:
        return 'other'
    }
  }

  private mapTransitionType(
    type: string | undefined
  ): Connection['transitionType'] | undefined {
    switch (type) {
      case 'DISSOLVE':
        return 'dissolve'
      case 'SMART_ANIMATE':
        return 'move'
      case 'MOVE_IN':
      case 'MOVE_OUT':
        return 'slide'
      case 'PUSH':
        return 'push'
      case 'SLIDE_IN':
      case 'SLIDE_OUT':
        return 'slide'
      default:
        return 'instant'
    }
  }

  private createIdGenerator() {
    let counter = 0
    return () => `conn-${counter++}`
  }
}
