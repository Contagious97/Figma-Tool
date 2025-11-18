'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { FrameNode } from './frame-node'
import { ConnectionEdge } from './connection-edge'
import { useCanvasStore } from '@/store/canvas-store'

const nodeTypes = {
  frame: FrameNode,
}

const edgeTypes = {
  connection: ConnectionEdge,
}

interface FrameCanvasProps {
  projectId: string
  initialFrames: any[]
  initialConnections: any[]
}

export function FrameCanvas({ projectId, initialFrames, initialConnections }: FrameCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const { deviceFilter, pageFilter } = useCanvasStore()

  // Initialize nodes from frames
  useEffect(() => {
    const frameNodes: Node[] = initialFrames
      .filter((frame) => {
        // Apply filters
        if (deviceFilter && deviceFilter !== 'all' && frame.deviceType !== deviceFilter) {
          return false
        }
        if (pageFilter && pageFilter !== 'all' && frame.pageName !== pageFilter) {
          return false
        }
        return true
      })
      .map((frame, index) => ({
        id: frame.id,
        type: 'frame',
        position: frame.canvasPosition || {
          x: (index % 5) * 300,
          y: Math.floor(index / 5) * 400,
        },
        data: {
          frameId: frame.id,
          name: frame.name,
          thumbnailUrl: frame.thumbnail,
          deviceType: frame.deviceType || 'other',
          width: frame.width,
          height: frame.height,
          componentsCount: frame.componentsCount || 0,
          projectId,
        },
      }))

    setNodes(frameNodes)
  }, [initialFrames, deviceFilter, pageFilter, setNodes, projectId])

  // Initialize edges from connections
  useEffect(() => {
    const connectionEdges: Edge[] = initialConnections.map((conn) => ({
      id: conn.id,
      source: conn.sourceFrameId,
      target: conn.targetFrameId,
      type: 'connection',
      data: {
        connectionType: conn.connectionType,
        interactionType: conn.interactionType,
        confirmed: conn.confirmed,
        confidence: conn.confidence,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: {
        strokeWidth: 2,
        stroke: conn.connectionType === 'prototype' ? '#3b82f6' : '#9ca3af',
        strokeDasharray: conn.connectionType === 'semantic' ? '5,5' : undefined,
      },
    }))

    setEdges(connectionEdges)
  }, [initialConnections, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  // Save node positions
  const handleNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: Node) => {
      // Save position to backend
      await fetch(`/api/frame/${node.id}/position`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: node.position.x,
          y: node.position.y,
        }),
      }).catch((error) => {
        console.error('Failed to save node position:', error)
      })
    },
    []
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data.deviceType) {
              case 'mobile':
                return '#8b5cf6'
              case 'tablet':
                return '#f59e0b'
              case 'desktop':
                return '#10b981'
              default:
                return '#6b7280'
            }
          }}
        />

        <Panel position="top-left">
          <div className="bg-white border rounded-lg shadow-lg p-2 flex items-center gap-2">
            <select
              value={deviceFilter}
              onChange={(e) => useCanvasStore.getState().setDeviceFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All Devices</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="desktop">Desktop</option>
            </select>

            <a
              href={`/api/project/${projectId}/export?format=csv`}
              className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
            >
              Export CSV
            </a>

            <a
              href={`/api/project/${projectId}/export?format=llm`}
              className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
            >
              Export for LLM
            </a>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
