"use client"

import { Handle, Position } from "reactflow"
import { Play, Move, RotateCw, Timer, TrendingUp, StopCircle } from "lucide-react"

const nodeBaseClass =
  "rounded-lg border border-white/20 bg-gradient-to-br from-zinc-900 to-black px-4 py-3 shadow-xl min-w-[180px]"

function StartNode({ data }: { data: { label: string } }) {
  return (
    <div className={`${nodeBaseClass} border-[#4ade80]/40 bg-gradient-to-br from-[#4ade80]/10 to-black`}>
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-[#4ade80]/20 p-1.5">
          <Play className="h-4 w-4 text-[#4ade80]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-zinc-400">Begin execution</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#4ade80]" />
    </div>
  )
}

function MoveNode({ data }: { data: { label: string; distance?: number; speed?: number; usePosition?: boolean; targetX?: number; targetY?: number } }) {
  return (
    <div className={`${nodeBaseClass} border-[#e78a53]/40`}>
      <Handle type="target" position={Position.Top} className="!bg-[#e78a53]" />
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-[#e78a53]/20 p-1.5">
          <Move className="h-4 w-4 text-[#e78a53]" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">{data.label}</div>
          {data.usePosition ? (
            <div className="text-xs text-zinc-400">
              Target: ({data.targetX || 72}", {data.targetY || 72}")
            </div>
          ) : (
            <div className="text-xs text-zinc-400">
              {data.distance || 24}" @ {((data.speed || 0.5) * 100).toFixed(0)}%
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#e78a53]" />
    </div>
  )
}

function TurnNode({ data }: { data: { label: string; degrees?: number } }) {
  return (
    <div className={`${nodeBaseClass} border-[#f0a36f]/40`}>
      <Handle type="target" position={Position.Top} className="!bg-[#f0a36f]" />
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-[#f0a36f]/20 p-1.5">
          <RotateCw className="h-4 w-4 text-[#f0a36f]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-zinc-400">Angle: {data.degrees || 90}°</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#f0a36f]" />
    </div>
  )
}

function WaitNode({ data }: { data: { label: string; duration?: number } }) {
  return (
    <div className={`${nodeBaseClass} border-[#60a5fa]/40`}>
      <Handle type="target" position={Position.Top} className="!bg-[#60a5fa]" />
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-[#60a5fa]/20 p-1.5">
          <Timer className="h-4 w-4 text-[#60a5fa]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-zinc-400">Wait: {data.duration || 1000}ms</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#60a5fa]" />
    </div>
  )
}

function PathFollowNode({ data }: { data: { label: string; waypoints?: number[][] } }) {
  const waypointCount = data.waypoints?.length || 3
  return (
    <div className={`${nodeBaseClass} border-[#a78bfa]/40`}>
      <Handle type="target" position={Position.Top} className="!bg-[#a78bfa]" />
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-[#a78bfa]/20 p-1.5">
          <TrendingUp className="h-4 w-4 text-[#a78bfa]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-zinc-400">{waypointCount} waypoints</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#a78bfa]" />
    </div>
  )
}

function StopNode({ data }: { data: { label: string } }) {
  return (
    <div className={`${nodeBaseClass} border-[#ef4444]/40 bg-gradient-to-br from-[#ef4444]/10 to-black`}>
      <Handle type="target" position={Position.Top} className="!bg-[#ef4444]" />
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-[#ef4444]/20 p-1.5">
          <StopCircle className="h-4 w-4 text-[#ef4444]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{data.label}</div>
          <div className="text-xs text-zinc-400">End execution</div>
        </div>
      </div>
    </div>
  )
}

export const nodeTypes = {
  startNode: StartNode,
  moveNode: MoveNode,
  turnNode: TurnNode,
  pathFollowNode: PathFollowNode,
  waitNode: WaitNode,
  stopNode: StopNode,
}
