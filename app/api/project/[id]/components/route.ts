import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFigmaToken } from '@/lib/figma/token'
import { FigmaClient } from '@/lib/figma/client'
import { ComponentDetector } from '@/lib/figma/component-detector'
import { ComponentDeduplicator } from '@/lib/figma/component-deduplicator'
import { db } from '@/lib/db'
import { projects, components, componentInstances } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = params.id

  try {
    // Get project and fileKey
    const projectResult = await db
      .select({
        figmaFileKey: projects.figmaFileKey,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)

    if (projectResult.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const fileKey = projectResult[0].figmaFileKey
    const token = await getFigmaToken(session.user.id)
    const client = new FigmaClient(token)
    const detector = new ComponentDetector()
    const deduplicator = new ComponentDeduplicator()

    // Detect components
    const { components: detectedComponents, instances: detectedInstances } =
      await detector.detectComponents(fileKey, client)

    // Deduplicate
    const { uniqueComponents, instanceReferences } = deduplicator.deduplicate(
      detectedComponents,
      detectedInstances
    )

    // Store in database
    for (const component of uniqueComponents) {
      // Check if component is actually used
      const componentInstances = detectedInstances.filter(
        (i) => i.componentId === component.id || i.componentKey === component.key
      )

      if (deduplicator.shouldExportComponent(component, componentInstances)) {
        // Insert or update component
        await db
          .insert(components)
          .values({
            projectId,
            figmaComponentId: component.id,
            figmaComponentKey: component.key,
            name: component.name,
            description: component.description,
            type: component.type,
            variantGroupId: component.variantGroupId,
            variantProperties: component.variantProperties || {},
            width: component.dimensions.width,
            height: component.dimensions.height,
            containingPage: component.containingPage,
            instanceCount: componentInstances.length,
            thumbnailUrl: component.thumbnail,
          })
          .onConflictDoUpdate({
            target: [components.projectId, components.figmaComponentKey],
            set: {
              name: component.name,
              instanceCount: componentInstances.length,
              updatedAt: new Date(),
            },
          })
      }
    }

    // Store instances
    for (const instance of detectedInstances) {
      await db
        .insert(componentInstances)
        .values({
          projectId,
          instanceId: instance.id,
          componentId: instance.componentId,
          componentKey: instance.componentKey,
          frameId: instance.frameId,
          name: instance.name,
          x: instance.position.x,
          y: instance.position.y,
          overrides: instance.overrides || {},
          scaleFactor: instance.scaleFactor || 1,
        })
        .onConflictDoNothing()
    }

    // Get statistics
    const stats = detector.getComponentStats()

    return NextResponse.json({
      success: true,
      componentsDetected: uniqueComponents.length,
      instancesDetected: detectedInstances.length,
      topComponents: stats.slice(0, 10),
    })
  } catch (error) {
    console.error('Component detection error:', error)
    return NextResponse.json(
      { error: 'Failed to detect components' },
      { status: 500 }
    )
  }
}

// GET - Retrieve components for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = params.id

  try {
    const result = await db
      .select({
        component: components,
        currentInstanceCount: sql<number>`COUNT(${componentInstances.id})`,
      })
      .from(components)
      .leftJoin(
        componentInstances,
        eq(components.figmaComponentKey, componentInstances.componentKey)
      )
      .where(eq(components.projectId, projectId))
      .groupBy(components.id)
      .orderBy(sql`COUNT(${componentInstances.id}) DESC`)

    return NextResponse.json({
      components: result,
    })
  } catch (error) {
    console.error('Component retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve components' },
      { status: 500 }
    )
  }
}
