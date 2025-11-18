import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { FigmaClient } from '@/lib/figma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { userTokens } from '@/lib/db/schema'

// Cache Figma file data for 1 hour
const getCachedFile = unstable_cache(
  async (fileKey: string, token: string) => {
    const client = new FigmaClient(token)
    return await client.getFile(fileKey)
  },
  ['figma-file'],
  {
    revalidate: 3600, // 1 hour
    tags: ['figma-file']
  }
)

/**
 * GET /api/figma/file?fileKey=<key>
 * Fetch a Figma file with caching
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const fileKey = searchParams.get('fileKey')

    if (!fileKey) {
      return NextResponse.json(
        { error: 'Missing fileKey parameter' },
        { status: 400 }
      )
    }

    // Get user's Figma token
    const tokenRecord = await db.query.userTokens.findFirst({
      where: eq(userTokens.userId, session.user.id)
    })

    if (!tokenRecord?.figmaToken) {
      return NextResponse.json(
        { error: 'Figma token not found. Please add your token in settings.' },
        { status: 400 }
      )
    }

    // Decrypt token (assuming encryption is implemented)
    // For now, we'll use the token directly
    const figmaToken = tokenRecord.figmaToken

    // Fetch cached file data
    const fileData = await getCachedFile(fileKey, figmaToken)

    return NextResponse.json({
      success: true,
      data: fileData,
      cached: true
    })

  } catch (error: any) {
    console.error('Error fetching Figma file:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch Figma file',
        details: error.status || 500
      },
      { status: error.status || 500 }
    )
  }
}
