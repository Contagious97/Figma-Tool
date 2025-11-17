import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFigmaToken } from '@/lib/figma/token'
import { FigmaClient } from '@/lib/figma/client'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { fileKey } = await req.json()

    if (!fileKey) {
      return NextResponse.json({ error: 'File key required' }, { status: 400 })
    }

    // Get user's Figma token
    const token = await getFigmaToken(session.user.id)
    const client = new FigmaClient(token)

    // Fetch file metadata
    const file = await client.getFile(fileKey)

    // Extract pages
    const pages = file.document.children
      ?.filter((child) => child.type === 'CANVAS')
      .map((page) => ({
        id: page.id,
        name: page.name,
      })) || []

    // Get thumbnail (try to get the first page's thumbnail)
    let thumbnail: string | null = null
    if (pages.length > 0) {
      try {
        const thumbnails = await client.getImages(fileKey, {
          ids: [file.document.id],
          scale: 1,
          format: 'png',
        })
        thumbnail = thumbnails[file.document.id] || null
      } catch (error) {
        console.error('Failed to get thumbnail:', error)
        // Continue without thumbnail
      }
    }

    return NextResponse.json({
      name: file.name,
      lastModified: file.lastModified,
      thumbnail,
      pages,
      version: file.version,
    })
  } catch (error) {
    console.error('Metadata fetch error:', error)

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
      { error: 'Failed to fetch file metadata' },
      { status: 500 }
    )
  }
}
