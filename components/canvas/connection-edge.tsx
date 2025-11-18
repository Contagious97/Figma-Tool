import { memo } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'

interface ConnectionEdgeData {
  connectionType: 'prototype' | 'semantic' | 'manual'
  interactionType: string
  confirmed: boolean
  confidence?: number
}

export const ConnectionEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  }: EdgeProps<ConnectionEdgeData>) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })

    return (
      <>
        <path id={id} className="react-flow__edge-path" d={edgePath} strokeWidth={2} />

        {data && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
              }}
              className="nodrag nopan"
            >
              <div className="bg-white border rounded px-2 py-1 text-xs shadow-sm">
                {data.interactionType}
                {data.connectionType === 'semantic' && data.confidence && (
                  <span className="text-muted-foreground ml-1">({data.confidence}%)</span>
                )}
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    )
  }
)

ConnectionEdge.displayName = 'ConnectionEdge'
