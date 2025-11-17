import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { figmaFrames } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const frameId = params.id
  const { deviceType } = await req.json()

  if (!['mobile', 'tablet', 'desktop', 'other'].includes(deviceType)) {
    return NextResponse.json({ error: 'Invalid device type' }, { status: 400 })
  }

  try {
    await db
      .update(figmaFrames)
      .set({
        deviceType,
        deviceClassificationConfidence: 'high',
        deviceClassificationReason: 'User override',
        updatedAt: new Date(),
      })
      .where(eq(figmaFrames.id, frameId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Device type update error:', error)
    return NextResponse.json(
      { error: 'Failed to update device type' },
      { status: 500 }
    )
  }
}
