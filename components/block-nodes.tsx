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
  Grid3x3,
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
  // Everynode params
  collectionType?: 'waypoints' | 'array' | 'range'
  collectionName?: string
  iteratorVariable?: string
  startRange?: number
  endRange?: number
  // Combined/Parallel action params
  enableSecondaryAction?: boolean
  secondaryActionType?: 'servo' | 'motor' | 'sensor'
  secondaryServoName?: string
  secondaryServoPosition?: number
  secondaryMotorName?: string
  secondaryMotorPower?: number
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
  everynode: Grid3x3,
  custom: Code,
}

const getCategoryColor = (type: string) => {
  if (type.includes('move') || type.includes('turn') || type.includes('strafe') || type === 'splineTo' || type === 'arcMove' || type === 'pivotTurn' || type === 'followPath') {
    return {
      bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%)',
      border: 'rgba(59, 130, 246, 0.7)',
      glow: '0 0 20px rgba(59, 130, 246, 0.4)',
      iconBg: 'rgba(59, 130, 246, 0.2)',
      category: 'Movement',
      categoryColor: '#3b82f6'
    }
  } else if (type.includes('servo') || type.includes('Motor') || type.includes('motor')) {
    return {
      bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%)',
      border: 'rgba(139, 92, 246, 0.7)',
      glow: '0 0 20px rgba(139, 92, 246, 0.4)',
      iconBg: 'rgba(139, 92, 246, 0.2)',
      category: 'Mechanism',
      categoryColor: '#8b5cf6'
    }
  } else if (type.includes('read') || type.includes('IMU') || type.includes('Distance') || type.includes('Color') || type.includes('Touch') || type === 'waitForSensor') {
    return {
      bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.2) 100%)',
      border: 'rgba(236, 72, 153, 0.7)',
      glow: '0 0 20px rgba(236, 72, 153, 0.4)',
      iconBg: 'rgba(236, 72, 153, 0.2)',
      category: 'Sensor',
      categoryColor: '#ec4899'
    }
  } else {
    return {
      bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.2) 100%)',
      border: 'rgba(16, 185, 129, 0.7)',
      glow: '0 0 20px rgba(16, 185, 129, 0.4)',
      iconBg: 'rgba(16, 185, 129, 0.2)',
      category: 'Control',
      categoryColor: '#10b981'
    }
  }
}

export const BlockNode = memo(({ data, selected }: NodeProps<BlockNodeData>) => {
  const Icon = ICON_MAP[data.type] || Code
  const colors = getCategoryColor(data.type)

  // Check if this is a control flow block that needs multiple handles
  const isIfElse = data.type === 'if'
  const isLoop = data.type === 'loop'
  const isParallel = data.type === 'parallel'

  const getNodeDetails = () => {
    let details = ''

    if (data.type === 'moveToPosition' || data.type === 'splineTo') {
      details = `(${data.targetX?.toFixed(1) || 0}, ${data.targetY?.toFixed(1) || 0}) @ ${data.targetHeading?.toFixed(0) || 0}°`
    } else if (data.type === 'turnToHeading') {
      details = `${data.targetHeading}°`
    } else if (data.type.includes('move') || data.type.includes('strafe')) {
      details = `${data.distance || 24}" @ ${((data.power || 0.5) * 100).toFixed(0)}%`
    } else if (data.type.includes('turn')) {
      details = `${data.angle || 90}°`
    } else if (data.type === 'wait') {
      details = `${data.duration || 1}s`
    } else if (data.type.includes('servo')) {
      details = `${data.servoName || 'servo'}: ${((data.position || 0.5) * 100).toFixed(0)}%`
    } else if (data.type.includes('Motor') || data.type.includes('motor')) {
      details = `${data.motorName || 'motor'}: ${((data.power || 0.5) * 100).toFixed(0)}%`
    } else if (data.type === 'loop') {
      details = `Repeat ${data.loopCount || 1} times`
    } else if (data.type === 'everynode') {
      if (data.collectionType === 'range') {
        details = `${data.iteratorVariable || 'i'}: ${data.startRange || 0} to ${data.endRange || 10}`
      } else if (data.collectionType === 'array') {
        details = `for ${data.iteratorVariable || 'item'} in ${data.collectionName || 'array'}`
      } else {
        details = `for each waypoint`
      }
    } else if (data.type === 'if' && data.condition) {
      details = `${data.condition}`
    } else if (data.condition) {
      details = `if ${data.condition}`
    } else if (data.type === 'parallel') {
      details = `Run actions simultaneously`
    }

    // Add combined action info for movement blocks
    if (data.enableSecondaryAction && (data.type.includes('move') || data.type.includes('turn') || data.type.includes('strafe') || data.type === 'splineTo')) {
      let secondaryInfo = ''
      if (data.secondaryActionType === 'servo' && data.secondaryServoName) {
        secondaryInfo = `+ ${data.secondaryServoName}: ${((data.secondaryServoPosition || 0.5) * 100).toFixed(0)}%`
      } else if (data.secondaryActionType === 'motor' && data.secondaryMotorName) {
        secondaryInfo = `+ ${data.secondaryMotorName}: ${((data.secondaryMotorPower || 0.5) * 100).toFixed(0)}%`
      } else if (data.secondaryActionType === 'sensor') {
        secondaryInfo = `+ read sensor`
      }
      if (secondaryInfo) {
        details = details ? `${details}\n${secondaryInfo}` : secondaryInfo
      }
    }

    return details
  }

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        boxShadow: selected
          ? `${colors.glow}, 0 8px 24px rgba(0,0,0,0.4)`
          : '0 4px 12px rgba(0,0,0,0.3)',
        borderRadius: '14px',
        minWidth: '220px',
        maxWidth: '280px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        backdropFilter: 'blur(8px)',
      }}
      className="relative overflow-hidden"
    >
      {/* Top gradient accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, transparent, ${colors.categoryColor}, transparent)`,
          opacity: selected ? 1 : 0.6,
        }}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: colors.border,
          width: '12px',
          height: '12px',
          border: '2px solid #18181b',
          transition: 'all 0.2s ease',
        }}
      />

      {/* Header with category badge */}
      <div style={{ padding: '10px 14px 8px' }}>
        <div className="flex items-center justify-between mb-2">
          <span
            style={{
              fontSize: '9px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              color: colors.categoryColor,
              textTransform: 'uppercase',
              opacity: 0.8,
            }}
          >
            {colors.category}
          </span>
          {data.score && data.score > 0 && (
            <div
              style={{
                fontSize: '10px',
                fontWeight: '700',
                background: 'rgba(234, 179, 8, 0.2)',
                color: '#fbbf24',
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid rgba(234, 179, 8, 0.3)',
              }}
            >
              +{data.score}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div
            style={{
              background: colors.iconBg,
              borderRadius: '10px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div
              style={{
                fontWeight: '600',
                fontSize: '13px',
                color: '#ffffff',
                lineHeight: '1.3',
                marginBottom: '2px',
              }}
            >
              {data.label}
            </div>
          </div>
        </div>
      </div>

      {/* Details section */}
      {getNodeDetails() && (
        <div
          style={{
            padding: '8px 14px 10px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: '#d4d4d8',
              fontFamily: 'monospace',
              fontWeight: '500',
              wordBreak: 'break-word',
            }}
          >
            {getNodeDetails()}
          </div>
        </div>
      )}

      {/* Handles for if/else block */}
      {isIfElse && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{
              background: '#10b981',
              width: '12px',
              height: '12px',
              border: '2px solid #18181b',
              transition: 'all 0.2s ease',
              top: '40%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '18px',
              top: 'calc(40% - 8px)',
              fontSize: '9px',
              fontWeight: '600',
              color: '#10b981',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '2px 4px',
              borderRadius: '3px',
              pointerEvents: 'none',
            }}
          >
            TRUE
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{
              background: '#ef4444',
              width: '12px',
              height: '12px',
              border: '2px solid #18181b',
              transition: 'all 0.2s ease',
              top: '60%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '18px',
              top: 'calc(60% - 8px)',
              fontSize: '9px',
              fontWeight: '600',
              color: '#ef4444',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '2px 4px',
              borderRadius: '3px',
              pointerEvents: 'none',
            }}
          >
            FALSE
          </div>
        </>
      )}

      {/* Handles for loop block */}
      {isLoop && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="loop"
            style={{
              background: '#8b5cf6',
              width: '12px',
              height: '12px',
              border: '2px solid #18181b',
              transition: 'all 0.2s ease',
              top: '40%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '18px',
              top: 'calc(40% - 8px)',
              fontSize: '9px',
              fontWeight: '600',
              color: '#8b5cf6',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '2px 4px',
              borderRadius: '3px',
              pointerEvents: 'none',
            }}
          >
            LOOP
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="next"
            style={{
              background: colors.border,
              width: '12px',
              height: '12px',
              border: '2px solid #18181b',
              transition: 'all 0.2s ease',
              top: '60%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '18px',
              top: 'calc(60% - 8px)',
              fontSize: '9px',
              fontWeight: '600',
              color: '#a3a3a3',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '2px 4px',
              borderRadius: '3px',
              pointerEvents: 'none',
            }}
          >
            NEXT
          </div>
        </>
      )}

      {/* Handles for parallel block - allows multiple connections */}
      {isParallel && (
        <>
          {/* Movement/Action 1 */}
          <Handle
            type="source"
            position={Position.Right}
            id="action1"
            style={{
              background: 'rgba(59, 130, 246, 0.8)',
              width: '10px',
              height: '10px',
              border: '2px solid #18181b',
              transition: 'all 0.2s ease',
              top: '25%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '16px',
              top: 'calc(25% - 8px)',
              fontSize: '8px',
              fontWeight: '600',
              color: '#3b82f6',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '2px 4px',
              borderRadius: '3px',
              pointerEvents: 'none',
            }}
          >
            1
          </div>

          {/* Mechanism/Action 2 */}
          <Handle
            type="source"
            position={Position.Right}
            id="action2"
            style={{
              background: 'rgba(139, 92, 246, 0.8)',
              width: '10px',
              height: '10px',
              border: '2px solid #18181b',
              transition: 'all 0.2s ease',
              top: '42%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '16px',
              top: 'calc(42% - 8px)',
              fontSize: '8px',
              fontWeight: '600',
              color: '#8b5cf6',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '2px 4px',
              borderRadius: '3px',
              pointerEvents: 'none',
            }}
          >
            2
          </div>

          {/* Sensor/Action 3 */}
          <Handle
            type="source"
            position={Position.Right}
            id="action3"
            style={{
              background: 'rgba(236, 72, 153, 0.8)',
              width: '10px',
              height: '10px',
              border: '2px solid #18181b',
              transition: 'all 0.2s ease',
              top: '58%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '16px',
              top: 'calc(58% - 8px)',
              fontSize: '8px',
              fontWeight: '600',
              color: '#ec4899',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '2px 4px',
              borderRadius: '3px',
              pointerEvents: 'none',
            }}
          >
            3
          </div>

          {/* Next/Continue */}
          <Handle
            type="source"
            position={Position.Right}
            id="next"
            style={{
              background: colors.border,
              width: '12px',
              height: '12px',
              border: '2px solid #18181b',
              transition: 'all 0.2s ease',
              top: '80%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '18px',
              top: 'calc(80% - 8px)',
              fontSize: '9px',
              fontWeight: '600',
              color: '#a3a3a3',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '2px 4px',
              borderRadius: '3px',
              pointerEvents: 'none',
            }}
          >
            NEXT
          </div>
        </>
      )}

      {/* Default handle for other blocks */}
      {!isIfElse && !isLoop && !isParallel && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: colors.border,
            width: '12px',
            height: '12px',
            border: '2px solid #18181b',
            transition: 'all 0.2s ease',
          }}
        />
      )}
    </div>
  )
})

BlockNode.displayName = 'BlockNode'

// Start node component
export const StartNode = memo(({ selected }: NodeProps) => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.25) 100%)',
        border: '2px solid rgba(16, 185, 129, 0.8)',
        boxShadow: selected
          ? '0 0 30px rgba(16, 185, 129, 0.5), 0 8px 24px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.3)',
        borderRadius: '16px',
        padding: '16px 28px',
        minWidth: '160px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        backdropFilter: 'blur(8px)',
      }}
      className="relative overflow-hidden"
    >
      {/* Top gradient accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
          opacity: selected ? 1 : 0.7,
        }}
      />

      <div className="text-center relative z-10">
        <div
          style={{
            fontWeight: '700',
            fontSize: '16px',
            color: '#ffffff',
            letterSpacing: '1px',
            marginBottom: '4px',
            textShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
          }}
        >
          START
        </div>
        <div
          style={{
            fontSize: '11px',
            color: '#a3e635',
            fontWeight: '500',
            opacity: 0.9,
          }}
        >
          Begin Execution
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'rgba(16, 185, 129, 0.9)',
          width: '14px',
          height: '14px',
          border: '2px solid #18181b',
          boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
          transition: 'all 0.2s ease',
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
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.25) 100%)',
        border: '2px solid rgba(239, 68, 68, 0.8)',
        boxShadow: selected
          ? '0 0 30px rgba(239, 68, 68, 0.5), 0 8px 24px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.3)',
        borderRadius: '16px',
        padding: '16px 28px',
        minWidth: '160px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        backdropFilter: 'blur(8px)',
      }}
      className="relative overflow-hidden"
    >
      {/* Top gradient accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
          opacity: selected ? 1 : 0.7,
        }}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'rgba(239, 68, 68, 0.9)',
          width: '14px',
          height: '14px',
          border: '2px solid #18181b',
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
          transition: 'all 0.2s ease',
        }}
      />

      <div className="text-center relative z-10">
        <div
          style={{
            fontWeight: '700',
            fontSize: '16px',
            color: '#ffffff',
            letterSpacing: '1px',
            marginBottom: '4px',
            textShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
          }}
        >
          END
        </div>
        <div
          style={{
            fontSize: '11px',
            color: '#fca5a5',
            fontWeight: '500',
            opacity: 0.9,
          }}
        >
          Complete
        </div>
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
