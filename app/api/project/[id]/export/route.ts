import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects, figmaFrames, components, flowConnections, figmaPages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CSVGenerator } from '@/lib/export/csv-generator'
import { LLMContextFormatter } from '@/lib/export/llm-context-formatter'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv' // csv or llm

    // Fetch all project data
    const [projectResult, framesResult, componentsResult, connectionsResult] = await Promise.all([
      db.select().from(projects).where(eq(projects.id, projectId)),
      db
        .select()
        .from(figmaFrames)
        .leftJoin(figmaPages, eq(figmaFrames.pageId, figmaPages.id))
        .where(eq(figmaPages.projectId, projectId)),
      db.select().from(components).where(eq(components.projectId, projectId)),
      db.select().from(flowConnections).where(eq(flowConnections.projectId, projectId)),
    ])

    if (projectResult.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projectResult[0]
    const frames = framesResult.map((r) => ({
      ...r.figma_frames,
      page_name: r.figma_pages?.name,
    }))

    // Extract design system from frames
    const designSystem = extractDesignSystem(frames)

    const projectData = {
      project: {
        ...project,
        frame_count: frames.length,
        mobile_count: frames.filter((f) => f.deviceType === 'mobile').length,
        tablet_count: frames.filter((f) => f.deviceType === 'tablet').length,
        desktop_count: frames.filter((f) => f.deviceType === 'desktop').length,
      },
      frames,
      components: componentsResult,
      connections: connectionsResult,
      designSystem,
    }

    let content: string
    let filename: string
    let contentType: string

    if (format === 'llm') {
      const formatter = new LLMContextFormatter()
      content = formatter.formatForLLM(projectData)
      filename = `${project.fileName}-llm-context.txt`
      contentType = 'text/plain'
    } else {
      const generator = new CSVGenerator()
      content = generator.generateProjectExport(projectData)
      filename = `${project.fileName}-export.csv`
      contentType = 'text/csv'
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
  }
}

function extractDesignSystem(frames: any[]): any {
  const allColors: any[] = []
  const allTypography: any[] = []
  const allSpacing: number[] = []

  for (const frame of frames) {
    if (frame.analysisData) {
      const analysis =
        typeof frame.analysisData === 'string'
          ? JSON.parse(frame.analysisData)
          : frame.analysisData

      if (analysis.colors) allColors.push(...analysis.colors)
      if (analysis.typography) allTypography.push(...analysis.typography)
      if (analysis.spacing?.allValues) allSpacing.push(...analysis.spacing.allValues)
    }
  }

  // Deduplicate and aggregate colors
  const colorMap = new Map()
  for (const color of allColors) {
    if (colorMap.has(color.hex)) {
      colorMap.get(color.hex).usageCount += color.usageCount
    } else {
      colorMap.set(color.hex, { ...color })
    }
  }

  // Deduplicate typography
  const typoMap = new Map()
  for (const typo of allTypography) {
    const key = `${typo.fontFamily}-${typo.fontWeight}-${typo.fontSize}`
    if (typoMap.has(key)) {
      typoMap.get(key).usageCount += typo.usageCount
    } else {
      typoMap.set(key, { ...typo })
    }
  }

  // Detect spacing scale
  const spacingFreq = allSpacing.reduce((acc: any, val: number) => {
    acc[val] = (acc[val] || 0) + 1
    return acc
  }, {})

  const detectedScale = Object.entries(spacingFreq)
    .filter(([, count]) => (count as number) >= 3)
    .map(([val]) => Number(val))
    .sort((a, b) => a - b)

  return {
    colors: Array.from(colorMap.values()).sort((a, b) => b.usageCount - a.usageCount),
    typography: Array.from(typoMap.values()).sort((a, b) => b.usageCount - a.usageCount),
    spacing: {
      detectedScale,
      allValues: Array.from(new Set(allSpacing)).sort((a, b) => a - b),
    },
  }
}
