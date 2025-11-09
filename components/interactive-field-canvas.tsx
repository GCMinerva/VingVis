"use client"

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Trash2, Plus, Move, Spline, Undo, Redo, Copy } from 'lucide-react'

export type Waypoint = {
  id: string
  x: number // In inches
  y: number // In inches
  heading: number // In degrees
  type: 'linear' | 'spline' | 'bezier'
  // For bezier curves
  controlPoint1?: { x: number, y: number }
  controlPoint2?: { x: number, y: number }
  // Path constraints
  maxVelocity?: number
  maxAcceleration?: number
}

export type PathSegment = {
  start: Waypoint
  end: Waypoint
  type: 'linear' | 'spline' | 'bezier'
  points: { x: number, y: number, heading: number, velocity?: number }[]
}

type Props = {
  waypoints: Waypoint[]
  onWaypointsChange: (waypoints: Waypoint[]) => void
  robotPosition: { x: number, y: number, heading: number }
  onRobotPositionChange: (position: { x: number, y: number, heading: number }) => void
  animationProgress?: number
  showVelocity?: boolean
  showGrid?: boolean
}

export function InteractiveFieldCanvas({
  waypoints,
  onWaypointsChange,
  robotPosition,
  onRobotPositionChange,
  animationProgress = 0,
  showVelocity = false,
  showGrid = true
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDraggingWaypoint, setIsDraggingWaypoint] = useState<string | null>(null)
  const [isDraggingRobot, setIsDraggingRobot] = useState(false)
  const [isDraggingControl, setIsDraggingControl] = useState<{ waypointId: string, point: 1 | 2 } | null>(null)
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null)
  const [hoverWaypointId, setHoverWaypointId] = useState<string | null>(null)
  const [pathSegments, setPathSegments] = useState<PathSegment[]>([])
  const [history, setHistory] = useState<Waypoint[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const FIELD_SIZE = 144 // inches
  const ROBOT_SIZE = 18 // inches
  const WAYPOINT_RADIUS = 8
  const CONTROL_POINT_RADIUS = 6

  const drawField = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const scale = canvas.width / FIELD_SIZE

    // Background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid
    if (showGrid) {
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 1
      for (let i = 0; i <= 6; i++) {
        const pos = i * 24 * scale
        ctx.beginPath()
        ctx.moveTo(pos, 0)
        ctx.lineTo(pos, canvas.height)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, pos)
        ctx.lineTo(canvas.width, pos)
        ctx.stroke()
      }

      // Tile labels
      ctx.fillStyle = '#475569'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      for (let i = 1; i < 6; i++) {
        const pos = i * 24 * scale
        ctx.fillText(`${i * 24}"`, pos, 15)
        ctx.save()
        ctx.translate(10, pos)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(`${i * 24}"`, 0, 0)
        ctx.restore()
      }
    }

    // Border
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // Starting zones (FTC field)
    const zoneSize = 24 * scale
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    ctx.fillRect(0, 0, zoneSize, zoneSize)
    ctx.fillRect(canvas.width - zoneSize, 0, zoneSize, zoneSize)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)'
    ctx.fillRect(0, canvas.height - zoneSize, zoneSize, zoneSize)
    ctx.fillRect(canvas.width - zoneSize, canvas.height - zoneSize, zoneSize, zoneSize)

    // Center cross
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 8])
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw path segments
    if (waypoints.length > 0) {
      // Calculate path
      const segments = calculatePathSegments(waypoints)
      setPathSegments(segments)

      segments.forEach((segment, idx) => {
        // Draw path line
        ctx.strokeStyle = segment.type === 'bezier' ? '#a855f7' : segment.type === 'spline' ? '#8b5cf6' : '#3b82f6'
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        segment.points.forEach((point, i) => {
          const x = (point.x / FIELD_SIZE) * canvas.width
          const y = (point.y / FIELD_SIZE) * canvas.height
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
        ctx.globalAlpha = 1

        // Draw velocity visualization
        if (showVelocity && segment.points.length > 0) {
          segment.points.forEach((point, i) => {
            if (i % 5 !== 0) return // Sample every 5th point
            const velocity = point.velocity || 0
            const maxVel = segment.end.maxVelocity || 50
            const colorIntensity = Math.min(velocity / maxVel, 1)
            const x = (point.x / FIELD_SIZE) * canvas.width
            const y = (point.y / FIELD_SIZE) * canvas.height

            ctx.fillStyle = `rgba(${255 * colorIntensity}, ${255 * (1 - colorIntensity)}, 0, 0.5)`
            ctx.beginPath()
            ctx.arc(x, y, 2, 0, Math.PI * 2)
            ctx.fill()
          })
        }

        // Draw Bézier control points and handles
        if (segment.type === 'bezier' && segment.start.controlPoint1 && segment.start.controlPoint2) {
          const startX = (segment.start.x / FIELD_SIZE) * canvas.width
          const startY = (segment.start.y / FIELD_SIZE) * canvas.height
          const endX = (segment.end.x / FIELD_SIZE) * canvas.width
          const endY = (segment.end.y / FIELD_SIZE) * canvas.height
          const cp1X = (segment.start.controlPoint1.x / FIELD_SIZE) * canvas.width
          const cp1Y = (segment.start.controlPoint1.y / FIELD_SIZE) * canvas.height
          const cp2X = (segment.start.controlPoint2.x / FIELD_SIZE) * canvas.width
          const cp2Y = (segment.start.controlPoint2.y / FIELD_SIZE) * canvas.height

          // Draw control lines
          ctx.strokeStyle = '#64748b'
          ctx.lineWidth = 1
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(cp1X, cp1Y)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(endX, endY)
          ctx.lineTo(cp2X, cp2Y)
          ctx.stroke()
          ctx.setLineDash([])

          // Draw control points
          const isSelected = selectedWaypointId === segment.start.id
          if (isSelected) {
            ctx.fillStyle = '#8b5cf6'
            ctx.beginPath()
            ctx.arc(cp1X, cp1Y, CONTROL_POINT_RADIUS, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.stroke()

            ctx.fillStyle = '#a855f7'
            ctx.beginPath()
            ctx.arc(cp2X, cp2Y, CONTROL_POINT_RADIUS, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.stroke()
          }
        }
      })
    }

    // Draw waypoints
    waypoints.forEach((waypoint, idx) => {
      const x = (waypoint.x / FIELD_SIZE) * canvas.width
      const y = (waypoint.y / FIELD_SIZE) * canvas.height
      const isSelected = waypoint.id === selectedWaypointId
      const isHover = waypoint.id === hoverWaypointId
      const isFirst = idx === 0

      // Waypoint shadow
      if (isSelected || isHover) {
        ctx.shadowColor = isFirst ? '#10b981' : '#3b82f6'
        ctx.shadowBlur = 15
      }

      // Waypoint circle
      ctx.fillStyle = isFirst ? '#10b981' : '#3b82f6'
      ctx.beginPath()
      ctx.arc(x, y, WAYPOINT_RADIUS, 0, Math.PI * 2)
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 3
        ctx.stroke()
      }

      ctx.shadowBlur = 0

      // Heading indicator
      const headingRad = (waypoint.heading * Math.PI) / 180
      const indicatorLength = 20
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(
        x + Math.cos(headingRad) * indicatorLength,
        y + Math.sin(headingRad) * indicatorLength
      )
      ctx.stroke()

      // Waypoint number
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${idx + 1}`, x, y)

      // Waypoint label
      if (isSelected || isHover) {
        const label = `(${Math.round(waypoint.x)}, ${Math.round(waypoint.y)})`
        ctx.fillStyle = '#1e293b'
        ctx.font = '11px monospace'
        const metrics = ctx.measureText(label)
        ctx.fillRect(x - metrics.width / 2 - 4, y - 30, metrics.width + 8, 16)
        ctx.fillStyle = '#f1f5f9'
        ctx.textAlign = 'center'
        ctx.fillText(label, x, y - 22)
      }
    })

    // Draw robot
    const robotX = (robotPosition.x / FIELD_SIZE) * canvas.width
    const robotY = (robotPosition.y / FIELD_SIZE) * canvas.height
    const robotSize = (ROBOT_SIZE / FIELD_SIZE) * canvas.width

    ctx.save()
    ctx.translate(robotX, robotY)
    ctx.rotate((robotPosition.heading * Math.PI) / 180)

    // Robot body
    ctx.fillStyle = isDraggingRobot ? '#22c55e' : '#10b981'
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.fillRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)
    ctx.strokeRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)

    // Robot front indicator
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.moveTo(robotSize / 2, 0)
    ctx.lineTo(robotSize / 3, -robotSize / 4)
    ctx.lineTo(robotSize / 3, robotSize / 4)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    // Draw animation progress
    if (animationProgress > 0 && pathSegments.length > 0) {
      const allPoints = pathSegments.flatMap(s => s.points)
      const pointIndex = Math.floor(animationProgress * (allPoints.length - 1))
      if (pointIndex < allPoints.length) {
        const point = allPoints[pointIndex]
        const animX = (point.x / FIELD_SIZE) * canvas.width
        const animY = (point.y / FIELD_SIZE) * canvas.height

        ctx.save()
        ctx.translate(animX, animY)
        ctx.rotate((point.heading * Math.PI) / 180)

        ctx.fillStyle = 'rgba(34, 197, 94, 0.7)'
        ctx.fillRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)

        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.moveTo(robotSize / 2, 0)
        ctx.lineTo(robotSize / 3, -robotSize / 4)
        ctx.lineTo(robotSize / 3, robotSize / 4)
        ctx.closePath()
        ctx.fill()

        ctx.restore()
      }
    }
  }, [waypoints, robotPosition, selectedWaypointId, hoverWaypointId, isDraggingRobot, animationProgress, showVelocity, showGrid, pathSegments])

  useEffect(() => {
    drawField()
  }, [drawField])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const size = Math.min(window.innerWidth * 0.4, window.innerHeight * 0.6, 600)
      canvas.width = size
      canvas.height = size
      drawField()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [drawField])

  const calculatePathSegments = (wps: Waypoint[]): PathSegment[] => {
    const segments: PathSegment[] = []
    for (let i = 0; i < wps.length - 1; i++) {
      const start = wps[i]
      const end = wps[i + 1]
      const points = interpolatePath(start, end)
      segments.push({ start, end, type: end.type, points })
    }
    return segments
  }

  const interpolatePath = (
    start: Waypoint,
    end: Waypoint
  ): { x: number, y: number, heading: number, velocity?: number }[] => {
    const steps = 50
    const points: { x: number, y: number, heading: number, velocity?: number }[] = []

    if (end.type === 'bezier' && start.controlPoint1 && start.controlPoint2) {
      // Cubic Bézier curve
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const u = 1 - t
        const x = u ** 3 * start.x +
                  3 * u ** 2 * t * start.controlPoint1.x +
                  3 * u * t ** 2 * start.controlPoint2.x +
                  t ** 3 * end.x
        const y = u ** 3 * start.y +
                  3 * u ** 2 * t * start.controlPoint1.y +
                  3 * u * t ** 2 * start.controlPoint2.y +
                  t ** 3 * end.y
        const heading = start.heading + (end.heading - start.heading) * t

        // Calculate velocity (simplified)
        const velocity = calculateVelocity(t, end.maxVelocity || 50, end.maxAcceleration || 30)

        points.push({ x, y, heading, velocity })
      }
    } else if (end.type === 'spline') {
      // Catmull-Rom spline (simplified)
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const x = start.x + (end.x - start.x) * t
        const y = start.y + (end.y - start.y) * t
        const heading = start.heading + (end.heading - start.heading) * t
        const velocity = calculateVelocity(t, end.maxVelocity || 50, end.maxAcceleration || 30)
        points.push({ x, y, heading, velocity })
      }
    } else {
      // Linear
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const x = start.x + (end.x - start.x) * t
        const y = start.y + (end.y - start.y) * t
        const heading = start.heading + (end.heading - start.heading) * t
        const velocity = calculateVelocity(t, end.maxVelocity || 50, end.maxAcceleration || 30)
        points.push({ x, y, heading, velocity })
      }
    }

    return points
  }

  const calculateVelocity = (t: number, maxVel: number, maxAccel: number): number => {
    // Trapezoidal velocity profile
    const accelTime = maxVel / maxAccel
    const accelDist = 0.3 // 30% of path for acceleration
    const decelDist = 0.7 // Start decelerating at 70%

    if (t < accelDist) {
      return (t / accelDist) * maxVel
    } else if (t > decelDist) {
      return ((1 - t) / (1 - decelDist)) * maxVel
    } else {
      return maxVel
    }
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / FIELD_SIZE
    return {
      x: ((e.clientX - rect.left) / scale),
      y: ((e.clientY - rect.top) / scale)
    }
  }

  const getWaypointAtPosition = (x: number, y: number): Waypoint | null => {
    const scale = canvasRef.current!.width / FIELD_SIZE
    const threshold = WAYPOINT_RADIUS / scale
    return waypoints.find(wp => {
      const dist = Math.sqrt((wp.x - x) ** 2 + (wp.y - y) ** 2)
      return dist <= threshold * 2
    }) || null
  }

  const getRobotAtPosition = (x: number, y: number): boolean => {
    const dist = Math.sqrt(
      (robotPosition.x - x) ** 2 + (robotPosition.y - y) ** 2
    )
    return dist <= ROBOT_SIZE / 2
  }

  const getControlPointAtPosition = (x: number, y: number): { waypointId: string, point: 1 | 2 } | null => {
    const scale = canvasRef.current!.width / FIELD_SIZE
    const threshold = CONTROL_POINT_RADIUS / scale

    for (const wp of waypoints) {
      if (wp.controlPoint1) {
        const dist1 = Math.sqrt((wp.controlPoint1.x - x) ** 2 + (wp.controlPoint1.y - y) ** 2)
        if (dist1 <= threshold * 2) {
          return { waypointId: wp.id, point: 1 }
        }
      }
      if (wp.controlPoint2) {
        const dist2 = Math.sqrt((wp.controlPoint2.x - x) ** 2 + (wp.controlPoint2.y - y) ** 2)
        if (dist2 <= threshold * 2) {
          return { waypointId: wp.id, point: 2 }
        }
      }
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)

    // Check control points first
    const controlPoint = getControlPointAtPosition(pos.x, pos.y)
    if (controlPoint) {
      setIsDraggingControl(controlPoint)
      return
    }

    // Check waypoints
    const waypoint = getWaypointAtPosition(pos.x, pos.y)
    if (waypoint) {
      setIsDraggingWaypoint(waypoint.id)
      setSelectedWaypointId(waypoint.id)
      return
    }

    // Check robot
    if (getRobotAtPosition(pos.x, pos.y)) {
      setIsDraggingRobot(true)
      return
    }

    // Deselect
    setSelectedWaypointId(null)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)

    // Update hover state
    const waypoint = getWaypointAtPosition(pos.x, pos.y)
    setHoverWaypointId(waypoint?.id || null)

    if (isDraggingControl) {
      const updatedWaypoints = waypoints.map(wp => {
        if (wp.id === isDraggingControl.waypointId) {
          if (isDraggingControl.point === 1) {
            return { ...wp, controlPoint1: { x: pos.x, y: pos.y } }
          } else {
            return { ...wp, controlPoint2: { x: pos.x, y: pos.y } }
          }
        }
        return wp
      })
      onWaypointsChange(updatedWaypoints)
      return
    }

    if (isDraggingWaypoint) {
      const updatedWaypoints = waypoints.map(wp =>
        wp.id === isDraggingWaypoint
          ? { ...wp, x: pos.x, y: pos.y }
          : wp
      )
      onWaypointsChange(updatedWaypoints)
      return
    }

    if (isDraggingRobot) {
      onRobotPositionChange({ ...robotPosition, x: pos.x, y: pos.y })
    }
  }

  const handleMouseUp = () => {
    if (isDraggingWaypoint || isDraggingControl) {
      // Save to history
      setHistory(prev => [...prev.slice(0, historyIndex + 1), waypoints])
      setHistoryIndex(prev => prev + 1)
    }

    setIsDraggingWaypoint(null)
    setIsDraggingRobot(false)
    setIsDraggingControl(null)
  }

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    const waypoint = getWaypointAtPosition(pos.x, pos.y)

    if (!waypoint) {
      // Add new waypoint
      const newWaypoint: Waypoint = {
        id: `wp-${Date.now()}`,
        x: pos.x,
        y: pos.y,
        heading: waypoints.length > 0 ? waypoints[waypoints.length - 1].heading : 0,
        type: 'linear',
        maxVelocity: 50,
        maxAcceleration: 30
      }
      onWaypointsChange([...waypoints, newWaypoint])
      setHistory(prev => [...prev.slice(0, historyIndex + 1), [...waypoints, newWaypoint]])
      setHistoryIndex(prev => prev + 1)
    }
  }

  const deleteSelectedWaypoint = () => {
    if (selectedWaypointId) {
      const updated = waypoints.filter(wp => wp.id !== selectedWaypointId)
      onWaypointsChange(updated)
      setSelectedWaypointId(null)
      setHistory(prev => [...prev.slice(0, historyIndex + 1), updated])
      setHistoryIndex(prev => prev + 1)
    }
  }

  const convertToBezier = () => {
    if (!selectedWaypointId) return
    const selectedIdx = waypoints.findIndex(wp => wp.id === selectedWaypointId)
    if (selectedIdx === -1 || selectedIdx === waypoints.length - 1) return

    const current = waypoints[selectedIdx]
    const next = waypoints[selectedIdx + 1]

    const cp1 = {
      x: current.x + (next.x - current.x) * 0.33,
      y: current.y + (next.y - current.y) * 0.33
    }
    const cp2 = {
      x: current.x + (next.x - current.x) * 0.66,
      y: current.y + (next.y - current.y) * 0.66
    }

    const updated = waypoints.map((wp, idx) =>
      idx === selectedIdx
        ? { ...wp, type: 'bezier' as const, controlPoint1: cp1, controlPoint2: cp2 }
        : wp
    )
    onWaypointsChange(updated)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      onWaypointsChange(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      onWaypointsChange(history[historyIndex + 1])
    }
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="border border-slate-700 rounded-lg cursor-crosshair"
      />

      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex gap-2">
        <Button size="sm" variant="secondary" onClick={undo} disabled={historyIndex <= 0}>
          <Undo className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={redo} disabled={historyIndex >= history.length - 1}>
          <Redo className="w-4 h-4" />
        </Button>
        {selectedWaypointId && (
          <>
            <Button size="sm" variant="secondary" onClick={convertToBezier}>
              <Spline className="w-4 h-4 mr-1" /> Bezier
            </Button>
            <Button size="sm" variant="destructive" onClick={deleteSelectedWaypoint}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-2 text-xs text-slate-400">
        Double-click to add waypoint • Drag waypoints to move • Drag control handles to adjust curves
      </div>
    </div>
  )
}
