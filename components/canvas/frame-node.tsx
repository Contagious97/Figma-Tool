import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card } from '@/components/ui/card'
import { Smartphone, Tablet, Monitor } from 'lucide-react'

interface FrameNodeData {
  frameId: string
  name: string
  thumbnailUrl: string
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'other'
  width: number
  height: number
  componentsCount: number
  projectId: string
}

const deviceIcons = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  other: Monitor,
}

const deviceColors = {
  mobile: 'bg-purple-500',
  tablet: 'bg-orange-500',
  desktop: 'bg-green-500',
  other: 'bg-gray-500',
}

export const FrameNode = memo(({ data }: NodeProps<FrameNodeData>) => {
  const DeviceIcon = deviceIcons[data.deviceType]

  return (
    <Card className="w-[250px] overflow-hidden border-2 hover:shadow-lg transition-shadow">
      <Handle type="target" position={Position.Top} />

      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {data.thumbnailUrl ? (
          <img src={data.thumbnailUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No preview
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm truncate flex-1">{data.name}</h3>
          <div
            className={`${deviceColors[data.deviceType]} text-white shrink-0 rounded px-2 py-1 flex items-center`}
          >
            <DeviceIcon className="w-3 h-3" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {data.width} × {data.height}
          </span>
          {data.componentsCount > 0 && <span>🧩 {data.componentsCount}</span>}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </Card>
  )
})

FrameNode.displayName = 'FrameNode'
