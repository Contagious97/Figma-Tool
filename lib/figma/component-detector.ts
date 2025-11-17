import { FigmaClient } from './client'
import { FigmaNode } from './types'

export interface ComponentDefinition {
  id: string // Figma component ID
  key: string // Figma component key (persistent across renames)
  name: string
  description: string
  type: 'component' | 'variant'
  variantGroupId?: string
  variantProperties?: Record<string, string>
  dimensions: {
    width: number
    height: number
  }
  thumbnail?: string
  containingPage: string
}

export interface ComponentInstance {
  id: string // Instance node ID
  componentId: string // References ComponentDefinition.id
  componentKey: string
  name: string
  frameId: string // Parent frame
  position: {
    x: number
    y: number
  }
  overrides?: Record<string, any>
  scaleFactor?: number
}

export class ComponentDetector {
  private components = new Map<string, ComponentDefinition>()
  private instances = new Map<string, ComponentInstance[]>()

  async detectComponents(
    fileKey: string,
    client: FigmaClient
  ): Promise<{
    components: ComponentDefinition[]
    instances: ComponentInstance[]
  }> {
    // Fetch file with components
    const file = await client.getFile(fileKey)

    // Step 1: Find all component definitions
    this.findComponentDefinitions(file.document)

    // Step 2: Find all component instances across frames
    this.findComponentInstances(file.document)

    // Step 3: Group variants
    this.groupVariants()

    return {
      components: Array.from(this.components.values()),
      instances: Array.from(this.instances.values()).flat(),
    }
  }

  private findComponentDefinitions(node: any, pageName = '') {
    // Track current page
    if (node.type === 'CANVAS') {
      pageName = node.name
    }

    // Found a component definition
    if (node.type === 'COMPONENT') {
      const component: ComponentDefinition = {
        id: node.id,
        key: node.componentKey || node.id, // Use key if available
        name: node.name,
        description: node.description || '',
        type: node.componentSetId ? 'variant' : 'component',
        variantGroupId: node.componentSetId,
        dimensions: {
          width: Math.round(node.absoluteBoundingBox?.width || 0),
          height: Math.round(node.absoluteBoundingBox?.height || 0),
        },
        containingPage: pageName,
      }

      this.components.set(node.id, component)
    }

    // Recurse into children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.findComponentDefinitions(child, pageName)
      }
    }
  }

  private findComponentInstances(node: any, parentFrameId?: string) {
    // Track current frame
    if (node.type === 'FRAME' && !parentFrameId) {
      parentFrameId = node.id
    }

    // Found a component instance
    if (node.type === 'INSTANCE' && node.componentId) {
      const instance: ComponentInstance = {
        id: node.id,
        componentId: node.componentId,
        componentKey: node.componentKey || node.componentId,
        name: node.name,
        frameId: parentFrameId || 'unknown',
        position: {
          x: Math.round(node.absoluteBoundingBox?.x || 0),
          y: Math.round(node.absoluteBoundingBox?.y || 0),
        },
        overrides: node.overrides || {},
        scaleFactor: node.scaleFactor || 1,
      }

      // Add to instances map
      if (!this.instances.has(node.componentId)) {
        this.instances.set(node.componentId, [])
      }
      this.instances.get(node.componentId)!.push(instance)
    }

    // Recurse into children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.findComponentInstances(child, parentFrameId)
      }
    }
  }

  private groupVariants() {
    // Group components by componentSetId
    const variantGroups = new Map<string, ComponentDefinition[]>()

    for (const component of this.components.values()) {
      if (component.variantGroupId) {
        if (!variantGroups.has(component.variantGroupId)) {
          variantGroups.set(component.variantGroupId, [])
        }
        variantGroups.get(component.variantGroupId)!.push(component)
      }
    }

    // Extract variant properties from names
    for (const [groupId, variants] of variantGroups.entries()) {
      for (const variant of variants) {
        variant.variantProperties = this.parseVariantProperties(variant.name)
      }
    }
  }

  private parseVariantProperties(name: string): Record<string, string> {
    // Figma variant format: "Property1=Value1, Property2=Value2"
    const properties: Record<string, string> = {}

    const parts = name.split(',')

    for (const part of parts) {
      const [key, value] = part.split('=').map((s) => s.trim())
      if (key && value) {
        properties[key] = value
      }
    }

    return properties
  }

  // Get component usage statistics
  getComponentStats(): Array<{
    component: ComponentDefinition
    instanceCount: number
    framesUsedIn: number
  }> {
    const stats: Array<{
      component: ComponentDefinition
      instanceCount: number
      framesUsedIn: number
    }> = []

    for (const [componentId, component] of this.components.entries()) {
      const instances = this.instances.get(componentId) || []
      const uniqueFrames = new Set(instances.map((i) => i.frameId))

      stats.push({
        component,
        instanceCount: instances.length,
        framesUsedIn: uniqueFrames.size,
      })
    }

    return stats.sort((a, b) => b.instanceCount - a.instanceCount)
  }

  // Check if component is used in project
  isComponentUsed(componentId: string): boolean {
    const instances = this.instances.get(componentId)
    return instances !== undefined && instances.length > 0
  }

  // Get all components used in a specific frame
  getFrameComponents(frameId: string): ComponentDefinition[] {
    const frameComponents: ComponentDefinition[] = []

    for (const [componentId, instances] of this.instances.entries()) {
      const usedInFrame = instances.some((i) => i.frameId === frameId)

      if (usedInFrame) {
        const component = this.components.get(componentId)
        if (component) {
          frameComponents.push(component)
        }
      }
    }

    return frameComponents
  }
}
