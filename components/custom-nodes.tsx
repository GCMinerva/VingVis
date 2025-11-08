import { Handle, Position } from 'reactflow'
import { Play, Navigation, RotateCw, Timer, Zap, Code, MoveRight, Variable } from 'lucide-react'

export const nodeStyles = {
  start: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderColor: '#059669',
    icon: Play
  },
  move: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    borderColor: '#2563eb',
    icon: Navigation
  },
  turn: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderColor: '#7c3aed',
    icon: RotateCw
  },
  wait: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    borderColor: '#d97706',
    icon: Timer
  },
  action: {
    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    borderColor: '#db2777',
    icon: Zap
  },
  custom: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    borderColor: '#4f46e5',
    icon: Code
  },
  variable: {
    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    borderColor: '#0d9488',
    icon: Variable
  }
}

interface CustomNodeProps {
  data: {
    label: string
    description?: string
    type?: keyof typeof nodeStyles
    config?: any
  }
  selected?: boolean
}

export function CustomNode({ data, selected }: CustomNodeProps) {
  const type = data.type || 'custom'
  const style = nodeStyles[type]
  const Icon = style.icon

  return (
    <div
      className={`
        px-4 py-3 rounded-xl shadow-lg min-w-[180px] transition-all duration-200
        border-2 ${selected ? 'ring-4 ring-blue-500/30 scale-105' : ''}
      `}
      style={{
        background: style.background,
        borderColor: style.borderColor,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-white !border-2"
        style={{ borderColor: style.borderColor }}
      />

      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-white" />
        <div className="font-semibold text-white text-sm">{data.label}</div>
      </div>

      {data.description && (
        <div className="text-xs text-white/80 mt-1">{data.description}</div>
      )}

      {data.config && Object.keys(data.config).length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/20">
          {Object.entries(data.config).map(([key, value]) => (
            <div key={key} className="text-xs text-white/90 font-mono">
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white !border-2"
        style={{ borderColor: style.borderColor }}
      />
    </div>
  )
}

// Simpler start node
export function StartNode({ data }: CustomNodeProps) {
  return (
    <div
      className="px-6 py-4 rounded-full shadow-xl border-2"
      style={{
        background: nodeStyles.start.background,
        borderColor: nodeStyles.start.borderColor,
      }}
    >
      <div className="flex items-center gap-2">
        <Play className="h-5 w-5 text-white fill-white" />
        <div className="font-bold text-white">START</div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white !border-2"
        style={{ borderColor: nodeStyles.start.borderColor }}
      />
    </div>
  )
}
