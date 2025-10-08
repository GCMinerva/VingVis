"use client"

import { motion } from "framer-motion"
import { useState, useRef } from "react"

type FieldWithPathEditorProps = {
  robotPosition: { x: number; y: number }
  robotAngle: number
  isRunning: boolean
  selectedNode: any
  onUpdatePath: (waypoints: number[][]) => void
}

const FIELD_SIZE = 144 // inches
const SCALE = 2.5 // pixels per inch
const CANVAS_SIZE = FIELD_SIZE * SCALE // 360px

export default function FieldWithPathEditor({
  robotPosition,
  robotAngle,
  isRunning,
  selectedNode,
  onUpdatePath,
}: FieldWithPathEditorProps) {
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null)
  const fieldRef = useRef<HTMLDivElement>(null)

  const isPathFollowNode = selectedNode?.type === "pathFollowNode"
  const waypoints = selectedNode?.data?.waypoints || []

  // Convert field coordinates to absolute positions
  const getAbsoluteWaypoints = () => {
    if (!isPathFollowNode || waypoints.length === 0) return []

    const absolutePoints = []
    let currentX = robotPosition.x
    let currentY = robotPosition.y

    for (const [relX, relY] of waypoints) {
      currentX += relX
      currentY += relY
      absolutePoints.push({ x: currentX, y: currentY })
    }
    return absolutePoints
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fieldRef.current) return

    const rect = fieldRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / SCALE)
    const y = ((e.clientY - rect.top) / SCALE)

    setCursorPosition({ x, y })

    if (isDragging && dragIndex !== null && isPathFollowNode) {
      const absolutePoints = getAbsoluteWaypoints()
      const newAbsolutePoints = [...absolutePoints]
      newAbsolutePoints[dragIndex] = { x, y }

      // Convert back to relative waypoints
      const newWaypoints: number[][] = []
      let prevX = robotPosition.x
      let prevY = robotPosition.y

      for (const point of newAbsolutePoints) {
        newWaypoints.push([point.x - prevX, point.y - prevY])
        prevX = point.x
        prevY = point.y
      }

      onUpdatePath(newWaypoints)
    }
  }

  const handleMouseDown = (index: number) => {
    setIsDragging(true)
    setDragIndex(index)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragIndex(null)
  }

  const handleMouseLeave = () => {
    setCursorPosition(null)
    setIsDragging(false)
    setDragIndex(null)
  }

  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close context menu
    setContextMenu(null)

    if (!isPathFollowNode || !fieldRef.current || dragIndex !== null) return

    const rect = fieldRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / SCALE)
    const y = ((e.clientY - rect.top) / SCALE)

    // Add new waypoint at click position (relative to last waypoint)
    const absolutePoints = getAbsoluteWaypoints()
    const lastPoint = absolutePoints.length > 0
      ? absolutePoints[absolutePoints.length - 1]
      : robotPosition

    const relativeX = x - lastPoint.x
    const relativeY = y - lastPoint.y

    const newWaypoints = [...waypoints, [relativeX, relativeY]]
    onUpdatePath(newWaypoints)
  }

  const handleWaypointRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (!fieldRef.current) return

    const rect = fieldRef.current.getBoundingClientRect()
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      index,
    })
  }

  const handleDeleteWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_: any, i: number) => i !== index)
    onUpdatePath(newWaypoints)
    setContextMenu(null)
  }

  const absoluteWaypoints = getAbsoluteWaypoints()

  return (
    <div className="relative">
      {/* Field Container */}
      <div
        ref={fieldRef}
        className="relative overflow-hidden rounded-xl border-2 border-white/20 bg-gradient-to-br from-zinc-900 to-black shadow-2xl cursor-crosshair"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onClick={handleFieldClick}
      >
        {/* Grid Lines */}
        <svg className="absolute inset-0 pointer-events-none" width={CANVAS_SIZE} height={CANVAS_SIZE}>
          <defs>
            <pattern id="grid" width={24 * SCALE} height={24 * SCALE} patternUnits="userSpaceOnUse">
              <path
                d={`M ${24 * SCALE} 0 L 0 0 0 ${24 * SCALE}`}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#grid)" />

          {/* Center lines */}
          <line
            x1={CANVAS_SIZE / 2}
            y1="0"
            x2={CANVAS_SIZE / 2}
            y2={CANVAS_SIZE}
            stroke="rgba(231, 138, 83, 0.3)"
            strokeWidth="2"
            strokeDasharray="8 4"
          />
          <line
            x1="0"
            y1={CANVAS_SIZE / 2}
            x2={CANVAS_SIZE}
            y2={CANVAS_SIZE / 2}
            stroke="rgba(231, 138, 83, 0.3)"
            strokeWidth="2"
            strokeDasharray="8 4"
          />

          {/* Corner markers */}
          <circle cx="30" cy="30" r="12" fill="#ef4444" opacity="0.3" />
          <circle cx="30" cy="30" r="6" fill="#ef4444" />
          <circle cx={CANVAS_SIZE - 30} cy={CANVAS_SIZE - 30} r="12" fill="#3b82f6" opacity="0.3" />
          <circle cx={CANVAS_SIZE - 30} cy={CANVAS_SIZE - 30} r="6" fill="#3b82f6" />

          {/* Path visualization */}
          {isPathFollowNode && absoluteWaypoints.length > 0 && (
            <>
              {/* Path line */}
              <path
                d={`M ${robotPosition.x * SCALE} ${robotPosition.y * SCALE} ${absoluteWaypoints
                  .map((p) => `L ${p.x * SCALE} ${p.y * SCALE}`)
                  .join(" ")}`}
                stroke="#a78bfa"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5 5"
                opacity="0.8"
              />

              {/* Waypoint markers */}
              {absoluteWaypoints.map((point, index) => (
                <g key={index}>
                  <circle
                    cx={point.x * SCALE}
                    cy={point.y * SCALE}
                    r="8"
                    fill="#a78bfa"
                    opacity="0.3"
                    className="cursor-move"
                    onMouseDown={() => handleMouseDown(index)}
                    onContextMenu={(e) => handleWaypointRightClick(e as any, index)}
                  />
                  <circle
                    cx={point.x * SCALE}
                    cy={point.y * SCALE}
                    r="5"
                    fill="#a78bfa"
                    className="cursor-move"
                    onMouseDown={() => handleMouseDown(index)}
                    onContextMenu={(e) => handleWaypointRightClick(e as any, index)}
                  />
                  <text
                    x={point.x * SCALE}
                    y={point.y * SCALE - 12}
                    fill="#a78bfa"
                    fontSize="10"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {index + 1}
                  </text>
                </g>
              ))}
            </>
          )}
        </svg>

        {/* Robot */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: robotPosition.x * SCALE,
            top: robotPosition.y * SCALE,
            width: 18 * SCALE,
            height: 18 * SCALE,
          }}
          animate={{
            left: robotPosition.x * SCALE,
            top: robotPosition.y * SCALE,
            rotate: robotAngle,
            scale: isRunning ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: isRunning ? 0.5 : 0.8,
            repeat: isRunning ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          <div className="relative h-full w-full" style={{ transform: "translate(-50%, -50%)" }}>
            <div className="absolute inset-0 rounded-lg border-2 border-[#e78a53] bg-gradient-to-br from-[#e78a53] to-[#f0a36f] shadow-lg shadow-[#e78a53]/50">
              <div className="absolute left-1/2 top-1 h-2 w-6 -translate-x-1/2 rounded-full bg-white" />
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
            </div>
            {isRunning && (
              <motion.div
                className="absolute inset-0 rounded-lg border-2 border-[#e78a53]"
                animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
        </motion.div>

        {/* Cursor position indicator */}
        {cursorPosition && (
          <div
            className="absolute pointer-events-none rounded bg-black/80 px-2 py-1 text-xs text-white"
            style={{
              left: cursorPosition.x * SCALE + 10,
              top: cursorPosition.y * SCALE + 10,
            }}
          >
            ({cursorPosition.x.toFixed(1)}", {cursorPosition.y.toFixed(1)}")
          </div>
        )}

        {/* Position display */}
        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs font-mono text-white backdrop-blur pointer-events-none">
          X: {robotPosition.x.toFixed(1)}" Y: {robotPosition.y.toFixed(1)}" θ: {robotAngle.toFixed(0)}°
        </div>

        {/* Running indicator */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-2 top-2 flex items-center gap-2 rounded-md bg-[#4ade80]/20 px-3 py-1.5 text-xs font-semibold text-[#4ade80] backdrop-blur pointer-events-none"
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-[#4ade80]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            Running
          </motion.div>
        )}

        {/* Path editing hint */}
        {isPathFollowNode && !isRunning && (
          <div className="absolute left-2 bottom-12 rounded-md bg-[#a78bfa]/20 px-3 py-1.5 text-xs text-[#a78bfa] backdrop-blur pointer-events-none">
            Click to add • Drag to move • Right-click to delete
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="absolute z-50 rounded-lg border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              onClick={() => handleDeleteWaypoint(contextMenu.index)}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <span>Delete Waypoint {contextMenu.index + 1}</span>
            </button>
          </div>
        )}
      </div>

      {/* Field Legend */}
      <div className="mt-4 space-y-2 rounded-lg border border-white/10 bg-black/40 p-4 text-xs">
        <div className="mb-2 font-semibold text-white">Field Legend</div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-#ef4444" />
          <span className="text-zinc-400">Red Alliance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-#3b82f6" />
          <span className="text-zinc-400">Blue Alliance</span>
        </div>
        {isPathFollowNode && (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-#a78bfa" />
            <span className="text-zinc-400">Path Waypoints</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 rounded bg-gradient-to-r from-[#e78a53] to-[#f0a36f]" />
          <span className="text-zinc-400">Robot (18" × 18")</span>
        </div>
      </div>

      {/* Field Info */}
      <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-4">
        <div className="text-xs text-zinc-500">
          <p className="font-semibold text-white">Decode℠ Field</p>
          <p className="mt-1">Regulation Size: 144" × 144"</p>
          <p>Scale: 1:{SCALE} (1 inch = {SCALE} pixels)</p>
        </div>
      </div>
    </div>
  )
}
