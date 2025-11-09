"use client"

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import {
  Target,
  Spline,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Timer,
  Code,
  Settings,
  Trash2,
  Plus
} from 'lucide-react'

export type NodeType =
  | 'start'
  | 'moveToPosition'
  | 'splineTo'
  | 'bezierLine'
  | 'bezierCurve'
  | 'forward'
  | 'backward'
  | 'strafeLeft'
  | 'strafeRight'
  | 'turnLeft'
  | 'turnRight'
  | 'turnToHeading'
  | 'wait'
  | 'servo'
  | 'motor'
  | 'custom'

export type FlowNode = {
  id: string
  type: NodeType
  label: string
  x: number
  y: number
  data: {
    targetX?: number
    targetY?: number
    targetHeading?: number
    distance?: number
    power?: number
    angle?: number
    duration?: number
    controlPoint1X?: number
    controlPoint1Y?: number
    controlPoint2X?: number
    controlPoint2Y?: number
    servoPosition?: number
    motorPower?: number
    customCode?: string
  }
  connections: string[] // IDs of connected nodes
}

type NodeConnection = {
  from: string
  to: string
  points: { x: number, y: number }[] // For curved connections
}

type Props = {
  nodes: FlowNode[]
  onNodesChange: (nodes: FlowNode[]) => void
  selectedNodeId?: string
  onNodeSelect: (node: FlowNode | null) => void
}

const NODE_COLORS = {
  start: '#10b981',
  moveToPosition: '#3b82f6',
  splineTo: '#8b5cf6',
  bezierLine: '#6366f1',
  bezierCurve: '#a855f7',
  forward: '#06b6d4',
  backward: '#0891b2',
  strafeLeft: '#14b8a6',
  strafeRight: '#0d9488',
  turnLeft: '#f59e0b',
  turnRight: '#f59e0b',
  turnToHeading: '#f97316',
  wait: '#ec4899',
  servo: '#84cc16',
  motor: '#22c55e',
  custom: '#6b7280',
}

const NODE_ICONS: Record<NodeType, any> = {
  start: Target,
  moveToPosition: Target,
  splineTo: Spline,
  bezierLine: Spline,
  bezierCurve: Spline,
  forward: ArrowUp,
  backward: ArrowDown,
  strafeLeft: ArrowLeft,
  strafeRight: ArrowRight,
  turnLeft: RotateCw,
  turnRight: RotateCw,
  turnToHeading: RotateCw,
  wait: Timer,
  servo: Settings,
  motor: Settings,
  custom: Code,
}

export function NodeEditor({ nodes, onNodesChange, selectedNodeId, onNodeSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number, y: number } | null>(null)

  const NODE_WIDTH = 180
  const NODE_HEIGHT = 60
  const CONNECTOR_RADIUS = 8

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply transformations
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(zoom, zoom)

    // Draw grid
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 1
    const gridSize = 20
    for (let x = -1000; x < 2000; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, -1000)
      ctx.lineTo(x, 2000)
      ctx.stroke()
    }
    for (let y = -1000; y < 2000; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(-1000, y)
      ctx.lineTo(2000, y)
      ctx.stroke()
    }

    // Draw connections
    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const targetNode = nodes.find(n => n.id === targetId)
        if (!targetNode) return

        const startX = node.x + NODE_WIDTH
        const startY = node.y + NODE_HEIGHT / 2
        const endX = targetNode.x
        const endY = targetNode.y + NODE_HEIGHT / 2

        // Draw curved connection
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(startX, startY)

        // Bezier curve for smooth connections
        const controlPoint1X = startX + 100
        const controlPoint1Y = startY
        const controlPoint2X = endX - 100
        const controlPoint2Y = endY

        ctx.bezierCurveTo(
          controlPoint1X, controlPoint1Y,
          controlPoint2X, controlPoint2Y,
          endX, endY
        )
        ctx.stroke()

        // Draw arrow
        const arrowSize = 10
        const angle = Math.atan2(endY - controlPoint2Y, endX - controlPoint2X)
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle - Math.PI / 6),
          endY - arrowSize * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle + Math.PI / 6),
          endY - arrowSize * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fillStyle = '#3b82f6'
        ctx.fill()
      })
    })

    // Draw temporary connection
    if (connectionStart && tempConnectionEnd) {
      const startNode = nodes.find(n => n.id === connectionStart)
      if (startNode) {
        const startX = startNode.x + NODE_WIDTH
        const startY = startNode.y + NODE_HEIGHT / 2

        ctx.strokeStyle = '#6b7280'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(tempConnectionEnd.x, tempConnectionEnd.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = node.id === selectedNodeId
      const color = NODE_COLORS[node.type]

      // Node shadow
      if (isSelected) {
        ctx.shadowColor = color
        ctx.shadowBlur = 20
      }

      // Node body
      ctx.fillStyle = '#1e293b'
      ctx.strokeStyle = isSelected ? color : '#334155'
      ctx.lineWidth = isSelected ? 3 : 2
      const radius = 8
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, NODE_WIDTH, NODE_HEIGHT, radius)
      ctx.fill()
      ctx.stroke()

      ctx.shadowBlur = 0

      // Node color indicator
      ctx.fillStyle = color
      ctx.fillRect(node.x, node.y, NODE_WIDTH, 4)
      ctx.beginPath()
      ctx.roundRect(node.x, node.y, NODE_WIDTH, 4, [radius, radius, 0, 0])
      ctx.fill()

      // Node label
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 13px Inter, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(node.label, node.x + 12, node.y + 28)

      // Node type
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.fillText(node.type, node.x + 12, node.y + 45)

      // Input connector (left)
      if (node.type !== 'start') {
        ctx.fillStyle = '#334155'
        ctx.beginPath()
        ctx.arc(node.x, node.y + NODE_HEIGHT / 2, CONNECTOR_RADIUS, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#64748b'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Output connector (right)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(node.x + NODE_WIDTH, node.y + NODE_HEIGHT / 2, CONNECTOR_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 2
      ctx.stroke()
    })

    ctx.restore()
  }, [nodes, selectedNodeId, panOffset, zoom, connectionStart, tempConnectionEnd])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = containerRef.current
      if (!container) return
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      drawCanvas()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [drawCanvas])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom
    }
  }

  const getNodeAtPosition = (x: number, y: number): FlowNode | null => {
    return nodes.find(node =>
      x >= node.x &&
      x <= node.x + NODE_WIDTH &&
      y >= node.y &&
      y <= node.y + NODE_HEIGHT
    ) || null
  }

  const getConnectorAtPosition = (x: number, y: number): { nodeId: string, type: 'input' | 'output' } | null => {
    for (const node of nodes) {
      // Check output connector
      const outputX = node.x + NODE_WIDTH
      const outputY = node.y + NODE_HEIGHT / 2
      const distOutput = Math.sqrt((x - outputX) ** 2 + (y - outputY) ** 2)
      if (distOutput <= CONNECTOR_RADIUS) {
        return { nodeId: node.id, type: 'output' }
      }

      // Check input connector
      if (node.type !== 'start') {
        const inputX = node.x
        const inputY = node.y + NODE_HEIGHT / 2
        const distInput = Math.sqrt((x - inputX) ** 2 + (y - inputY) ** 2)
        if (distInput <= CONNECTOR_RADIUS) {
          return { nodeId: node.id, type: 'input' }
        }
      }
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)

    // Check if clicking on connector
    const connector = getConnectorAtPosition(pos.x, pos.y)
    if (connector && connector.type === 'output') {
      setConnectionStart(connector.nodeId)
      setTempConnectionEnd(pos)
      return
    }

    // Check if clicking on node
    const node = getNodeAtPosition(pos.x, pos.y)
    if (node) {
      setIsDragging(true)
      setDraggedNodeId(node.id)
      setDragOffset({ x: pos.x - node.x, y: pos.y - node.y })
      onNodeSelect(node)
      return
    }

    // Start panning
    if (e.button === 0 && !node) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)

    if (connectionStart) {
      setTempConnectionEnd(pos)
      return
    }

    if (isDragging && draggedNodeId) {
      const updatedNodes = nodes.map(node =>
        node.id === draggedNodeId
          ? { ...node, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
          : node
      )
      onNodesChange(updatedNodes)
      return
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (connectionStart) {
      const pos = getMousePos(e)
      const connector = getConnectorAtPosition(pos.x, pos.y)

      if (connector && connector.type === 'input' && connector.nodeId !== connectionStart) {
        // Create connection
        const updatedNodes = nodes.map(node =>
          node.id === connectionStart
            ? { ...node, connections: [...node.connections, connector.nodeId] }
            : node
        )
        onNodesChange(updatedNodes)
      }

      setConnectionStart(null)
      setTempConnectionEnd(null)
    }

    setIsDragging(false)
    setDraggedNodeId(null)
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.1, Math.min(2, prev * delta)))
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setZoom(prev => Math.min(2, prev * 1.2))}
        >
          +
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setZoom(prev => Math.max(0.1, prev * 0.8))}
        >
          -
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setZoom(1)
            setPanOffset({ x: 0, y: 0 })
          }}
        >
          Reset
        </Button>
      </div>

      {/* Node count */}
      <div className="absolute top-4 left-4 bg-slate-800 text-white px-3 py-1 rounded text-sm">
        {nodes.length} nodes
      </div>
    </div>
  )
}
