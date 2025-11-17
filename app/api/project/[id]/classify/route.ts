import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DeviceClassifier } from '@/lib/figma/device-classifier'
import { db } from '@/lib/db'
import { figmaFrames } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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
    // Fetch all frames for this project (via pages)
    // Note: This would need to join through pages, but for simplicity we'll use a different approach
    const frames = await db
      .select({
        id: figmaFrames.id,
        figmaNodeId: figmaFrames.figmaNodeId,
        name: figmaFrames.name,
        width: figmaFrames.width,
        height: figmaFrames.height,
      })
      .from(figmaFrames)

    const classifier = new DeviceClassifier()

    // Classify each frame
    const classifications = classifier.classifyFrames(
      frames.map((f) => ({
        id: f.figmaNodeId,
        name: f.name,
        width: f.width,
        height: f.height,
      }))
    )

    // Update database
    for (const frame of frames) {
      const classification = classifications.get(frame.figmaNodeId)!

      await db
        .update(figmaFrames)
        .set({
          deviceType: classification.deviceType,
          deviceClassificationConfidence: classification.confidence,
          deviceClassificationReason: classification.reason,
          updatedAt: new Date(),
        })
        .where(eq(figmaFrames.id, frame.id))
    }

    // Return summary
    const summary = {
      mobile: 0,
      tablet: 0,
      desktop: 0,
      other: 0,
    }

    for (const classification of classifications.values()) {
      summary[classification.deviceType]++
    }

    return NextResponse.json({
      success: true,
      totalFrames: frames.length,
      summary,
    })
  } catch (error) {
    console.error('Classification error:', error)
    return NextResponse.json(
      { error: 'Failed to classify frames' },
      { status: 500 }
    )
  }
}
