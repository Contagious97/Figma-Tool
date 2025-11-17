import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFigmaToken } from '@/lib/figma/token'
import { FigmaClient } from '@/lib/figma/client'
import { db } from '@/lib/db'
import { projects, figmaPages, figmaFrames } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { fileKey, fileName, pages: selectedPageIds } = await req.json()

    if (!fileKey || !fileName || !selectedPageIds || selectedPageIds.length === 0) {
      return NextResponse.json(
        { error: 'File key, file name, and at least one page are required' },
        { status: 400 }
      )
    }

    // Get user's Figma token
    const token = await getFigmaToken(session.user.id)
    const client = new FigmaClient(token)

    // Fetch full file data
    const file = await client.getFile(fileKey)

    // Get thumbnail
    let thumbnail: string | null = null
    try {
      const thumbnails = await client.getImages(fileKey, {
        ids: [file.document.id],
        scale: 1,
        format: 'png',
      })
      thumbnail = thumbnails[file.document.id] || null
    } catch (error) {
      console.error('Failed to get thumbnail:', error)
    }

    // Create project
    const [project] = await db
      .insert(projects)
      .values({
        userId: session.user.id,
        figmaFileKey: fileKey,
        fileName,
        thumbnail,
        lastModified: new Date(file.lastModified),
        figmaVersion: file.version,
      })
      .returning()

    // Filter selected pages
    const selectedPages = file.document.children?.filter(
      (child) => child.type === 'CANVAS' && selectedPageIds.includes(child.id)
    ) || []

    // Insert pages and frames
    for (let i = 0; i < selectedPages.length; i++) {
      const page = selectedPages[i]

      const [insertedPage] = await db
        .insert(figmaPages)
        .values({
          projectId: project.id,
          figmaPageId: page.id,
          name: page.name,
          order: i,
          included: true,
        })
        .returning()

      // Get all frames in this page
      const frames = page.children?.filter(
        (child) => child.type === 'FRAME' || child.type === 'COMPONENT'
      ) || []

      // Get thumbnails for all frames
      const frameIds = frames.map((f) => f.id)
      let frameThumbnails: Record<string, string> = {}

      if (frameIds.length > 0) {
        try {
          frameThumbnails = await client.getImages(fileKey, {
            ids: frameIds,
            scale: 1,
            format: 'png',
          })
        } catch (error) {
          console.error('Failed to get frame thumbnails:', error)
        }
      }

      // Insert frames
      for (const frame of frames) {
        const bbox = frame.absoluteBoundingBox

        if (!bbox) continue

        await db.insert(figmaFrames).values({
          pageId: insertedPage.id,
          figmaNodeId: frame.id,
          name: frame.name,
          type: frame.type,
          x: Math.round(bbox.x),
          y: Math.round(bbox.y),
          width: Math.round(bbox.width),
          height: Math.round(bbox.height),
          thumbnail: frameThumbnails[frame.id] || null,
          backgroundColor: frame.backgroundColor
            ? `rgba(${Math.round(frame.backgroundColor.r * 255)}, ${Math.round(frame.backgroundColor.g * 255)}, ${Math.round(frame.backgroundColor.b * 255)}, ${frame.backgroundColor.a})`
            : null,
          parsedData: frame as any, // Store full frame data for later analysis
        })
      }
    }

    return NextResponse.json({
      projectId: project.id,
      message: 'Project imported successfully',
    })
  } catch (error) {
    console.error('Project import error:', error)

    if (error instanceof Error) {
      if (error.message.includes('403') || error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: 'Access denied. Check your Figma token or file permissions.' },
          { status: 403 }
        )
      }
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'File not found. Check the URL and try again.' },
          { status: 404 }
        )
      }
      if (error.message.includes('No Figma token')) {
        return NextResponse.json(
          { error: 'Please add your Figma token in settings first.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to import project' },
      { status: 500 }
    )
  }
}

// GET - List user's projects
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userProjects = await db.query.projects.findMany({
      where: (projects, { eq }) => eq(projects.userId, session.user.id),
      orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
      limit: 50,
    })

    return NextResponse.json({ projects: userProjects })
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
