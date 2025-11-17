import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { encryptToken, decryptToken } from '@/lib/encryption'
import { db } from '@/lib/db'
import { userTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET - Check if user has a token (for internal API use and status check)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await db
      .select({
        exists: userTokens.userId,
        updatedAt: userTokens.updatedAt,
      })
      .from(userTokens)
      .where(eq(userTokens.userId, session.user.id))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json(
        { hasToken: false },
        { status: 200 }
      )
    }

    return NextResponse.json({
      hasToken: true,
      updatedAt: result[0].updatedAt,
    })
  } catch (error) {
    console.error('Token check error:', error)
    return NextResponse.json(
      { error: 'Failed to check token status' },
      { status: 500 }
    )
  }
}

// POST - Save or update token
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { token } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const encryptedToken = encryptToken(token)

    // Upsert token (insert or update)
    await db
      .insert(userTokens)
      .values({
        userId: session.user.id,
        figmaToken: encryptedToken,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userTokens.userId,
        set: {
          figmaToken: encryptedToken,
          updatedAt: new Date(),
        },
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Token save error:', error)
    return NextResponse.json(
      { error: 'Failed to save token' },
      { status: 500 }
    )
  }
}

// DELETE - Remove token
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await db
      .delete(userTokens)
      .where(eq(userTokens.userId, session.user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Token deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete token' },
      { status: 500 }
    )
  }
}
