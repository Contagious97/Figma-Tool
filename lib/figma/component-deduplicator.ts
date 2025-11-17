import { ComponentDefinition, ComponentInstance } from './component-detector'

export class ComponentDeduplicator {
  /**
   * Deduplicate components across multiple frames
   * Only keeps master definition, references instances
   */
  deduplicate(
    components: ComponentDefinition[],
    instances: ComponentInstance[]
  ): {
    uniqueComponents: ComponentDefinition[]
    instanceReferences: Map<string, string[]> // componentId -> instanceIds
  } {
    const uniqueComponents = new Map<string, ComponentDefinition>()
    const instanceReferences = new Map<string, string[]>()

    // Use component key for deduplication (persistent across renames)
    for (const component of components) {
      const key = component.key || component.id

      if (!uniqueComponents.has(key)) {
        uniqueComponents.set(key, component)
      }
    }

    // Build instance references
    for (const instance of instances) {
      const key = instance.componentKey || instance.componentId

      if (!instanceReferences.has(key)) {
        instanceReferences.set(key, [])
      }

      instanceReferences.get(key)!.push(instance.id)
    }

    return {
      uniqueComponents: Array.from(uniqueComponents.values()),
      instanceReferences,
    }
  }

  /**
   * Check if a component should be included in export
   */
  shouldExportComponent(
    component: ComponentDefinition,
    instances: ComponentInstance[]
  ): boolean {
    // Only export components that are actually used
    const isUsed = instances.some(
      (i) => i.componentId === component.id || i.componentKey === component.key
    )

    // Skip internal/private components (convention: start with underscore)
    const isPrivate = component.name.startsWith('_')

    return isUsed && !isPrivate
  }
}
