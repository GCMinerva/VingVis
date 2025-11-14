"use client"

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Timer,
  Code,
  Settings,
  Zap,
  Eye,
  Gauge,
  CircleDot,
  Radar,
  Target,
  Spline,
  Waypoints,
  RotateCcw,
  Circle,
  Repeat,
  GitBranch,
  Pause,
} from 'lucide-react'

export type BlockNodeData = {
  label: string
  type: string
  icon?: string
  // Movement params
  distance?: number
  power?: number
  angle?: number
  targetX?: number
  targetY?: number
  targetHeading?: number
  curveType?: 'linear' | 'spline' | 'bezier'
  // Mechanism params
  servo?: string
  servoName?: string
  motorName?: string
  position?: number
  // Control params
  duration?: number
  customCode?: string
  score?: number
  condition?: string
  loopCount?: number
}

const ICON_MAP: { [key: string]: any } = {
  moveToPosition: Target,
  splineTo: Spline,
  forward: ArrowUp,
  backward: ArrowDown,
  strafeLeft: ArrowLeft,
  strafeRight: ArrowRight,
  turnLeft: RotateCcw,
  turnRight: RotateCw,
  turnToHeading: Target,
  arcMove: Circle,
  pivotTurn: CircleDot,
  followPath: Waypoints,
  setServo: Settings,
  continuousServo: RotateCw,
  runMotor: Zap,
  stopMotor: Pause,
  setMotorPower: Gauge,
  readIMU: Radar,
  readDistance: Eye,
  readColor: CircleDot,
  waitForSensor: Timer,
  readTouch: CircleDot,
  wait: Timer,
  waitUntil: Timer,
  loop: Repeat,
  if: GitBranch,
  parallel: Zap,
  custom: Code,
}

const getCategoryColor = (type: string) => {
  if (type.includes('move') || type.includes('turn') || type.includes('strafe') || type === 'splineTo' || type === 'arcMove' || type === 'pivotTurn' || type === 'followPath') {
    return {
      bg: 'rgba(59, 130, 246, 0.15)',
      border: 'rgba(59, 130, 246, 0.6)',
      glow: '0 0 15px rgba(59, 130, 246, 0.3)'
    }
  } else if (type.includes('servo') || type.includes('Motor') || type.includes('motor')) {
    return {
      bg: 'rgba(139, 92, 246, 0.15)',
      border: 'rgba(139, 92, 246, 0.6)',
      glow: '0 0 15px rgba(139, 92, 246, 0.3)'
    }
  } else if (type.includes('read') || type.includes('IMU') || type.includes('Distance') || type.includes('Color') || type.includes('Touch') || type === 'waitForSensor') {
    return {
      bg: 'rgba(236, 72, 153, 0.15)',
      border: 'rgba(236, 72, 153, 0.6)',
      glow: '0 0 15px rgba(236, 72, 153, 0.3)'
    }
  } else {
    return {
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.6)',
      glow: '0 0 15px rgba(16, 185, 129, 0.3)'
    }
  }
}

export const BlockNode = memo(({ data, selected }: NodeProps<BlockNodeData>) => {
  const Icon = ICON_MAP[data.type] || Code
  const colors = getCategoryColor(data.type)

  const getNodeDetails = () => {
    if (data.type === 'moveToPosition' || data.type === 'splineTo') {
      return `(${data.targetX?.toFixed(1) || 0}, ${data.targetY?.toFixed(1) || 0}) @ ${data.targetHeading?.toFixed(0) || 0}°`
    } else if (data.type === 'turnToHeading') {
      return `${data.targetHeading}°`
    } else if (data.type.includes('move') || data.type.includes('strafe')) {
      return `${data.distance || 24}" @ ${((data.power || 0.5) * 100).toFixed(0)}%`
    } else if (data.type.includes('turn')) {
      return `${data.angle || 90}°`
    } else if (data.type === 'wait') {
      return `${data.duration || 1}s`
    } else if (data.type.includes('servo')) {
      return `${data.servoName || 'servo'}: ${((data.position || 0.5) * 100).toFixed(0)}%`
    } else if (data.type.includes('Motor') || data.type.includes('motor')) {
      return `${data.motorName || 'motor'}: ${((data.power || 0.5) * 100).toFixed(0)}%`
    } else if (data.type === 'loop') {
      return `${data.loopCount || 1}x`
    } else if (data.condition) {
      return `if ${data.condition}`
    }
    return ''
  }

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        boxShadow: selected ? `${colors.glow}, 0 4px 12px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.2)',
        borderRadius: '12px',
        padding: '12px 16px',
        minWidth: '200px',
        maxWidth: '250px',
        transition: 'all 0.2s ease',
      }}
      className="relative"
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: colors.border,
          width: '10px',
          height: '10px',
          border: '2px solid #18181b',
        }}
      />

      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-white mb-1">
            {data.label}
          </div>
          {getNodeDetails() && (
            <div className="text-xs text-zinc-300 font-mono break-words">
              {getNodeDetails()}
            </div>
          )}
          {data.score && data.score > 0 && (
            <div className="text-xs bg-yellow-600/30 text-yellow-300 px-2 py-0.5 rounded mt-1 inline-block">
              +{data.score} pts
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: colors.border,
          width: '10px',
          height: '10px',
          border: '2px solid #18181b',
        }}
      />
    </div>
  )
})

BlockNode.displayName = 'BlockNode'

// Start node component
export const StartNode = memo(({ selected }: NodeProps) => {
  return (
    <div
      style={{
        background: 'rgba(16, 185, 129, 0.2)',
        border: '2px solid rgba(16, 185, 129, 0.8)',
        boxShadow: selected ? '0 0 20px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
        borderRadius: '12px',
        padding: '14px 24px',
        minWidth: '140px',
        transition: 'all 0.2s ease',
      }}
      className="relative"
    >
      <div className="text-center">
        <div className="font-bold text-base text-white">START</div>
        <div className="text-xs text-zinc-300 mt-1">Begin Execution</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'rgba(16, 185, 129, 0.8)',
          width: '12px',
          height: '12px',
          border: '2px solid #18181b',
        }}
      />
    </div>
  )
})

StartNode.displayName = 'StartNode'

// End node component
export const EndNode = memo(({ selected }: NodeProps) => {
  return (
    <div
      style={{
        background: 'rgba(239, 68, 68, 0.2)',
        border: '2px solid rgba(239, 68, 68, 0.8)',
        boxShadow: selected ? '0 0 20px rgba(239, 68, 68, 0.4), 0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
        borderRadius: '12px',
        padding: '14px 24px',
        minWidth: '140px',
        transition: 'all 0.2s ease',
      }}
      className="relative"
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'rgba(239, 68, 68, 0.8)',
          width: '12px',
          height: '12px',
          border: '2px solid #18181b',
        }}
      />

      <div className="text-center">
        <div className="font-bold text-base text-white">END</div>
        <div className="text-xs text-zinc-300 mt-1">Complete</div>
      </div>
    </div>
  )
})

EndNode.displayName = 'EndNode'

export const nodeTypes = {
  blockNode: BlockNode,
  startNode: StartNode,
  endNode: EndNode,
}
