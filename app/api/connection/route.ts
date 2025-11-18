import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { flowConnections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      projectId,
      fromFrameId,
      toFrameId,
      interactionType,
      triggerElementId,
      connectionType,
      transitionType,
      duration,
      easing,
      confidence,
      reasoning,
    } = body

    if (!projectId || !fromFrameId || !toFrameId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await db
      .insert(flowConnections)
      .values({
        projectId,
        sourceFrameId: fromFrameId,
        targetFrameId: toFrameId,
        triggerElementId: triggerElementId || null,
        connectionType: connectionType || 'manual',
        interactionType: interactionType || 'tap',
        transitionType: transitionType || null,
        duration: duration || null,
        easing: easing || null,
        confirmed: connectionType === 'manual' || connectionType === 'prototype',
        confidence: confidence || null,
        reasoning: reasoning || null,
      })
      .returning()

    return NextResponse.json({ connection: result[0] })
  } catch (error) {
    console.error('Connection creation error:', error)
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const connectionId = searchParams.get('id')

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 })
    }

    await db.delete(flowConnections).where(eq(flowConnections.id, connectionId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Connection deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { connectionId, confirmed } = body

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 })
    }

    const result = await db
      .update(flowConnections)
      .set({ confirmed: confirmed !== undefined ? confirmed : true })
      .where(eq(flowConnections.id, connectionId))
      .returning()

    return NextResponse.json({ connection: result[0] })
  } catch (error) {
    console.error('Connection update error:', error)
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 })
  }
}
