'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { distance, clamp } from '@/lib/math-utils'

interface MathToolsProps {
  showRuler: boolean
  showProtractor: boolean
  showGrid: boolean
  gridSize: number
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  robotPosition?: { x: number; y: number }
  robotHeading?: number
  protractorLockToRobot?: boolean
  onProtractorLockToggle?: () => void
  fieldSize?: number
}

interface Point {
  x: number
  y: number
}

const MIN_PROTRACTOR_RADIUS = 30
const MAX_PROTRACTOR_RADIUS = 150
const FIELD_SIZE = 144

export function MathTools({
  showRuler,
  showProtractor,
  showGrid,
  gridSize,
  canvasRef,
  robotPosition = { x: 72, y: 72 },
  robotHeading = 0,
  protractorLockToRobot = false,
  onProtractorLockToggle,
  fieldSize = FIELD_SIZE,
}: MathToolsProps) {
  // Ruler state
  const [rulerStart, setRulerStart] = useState<Point>({ x: 20, y: 72 })
  const [rulerEnd, setRulerEnd] = useState<Point>({ x: 80, y: 72 })
  const [rulerDragging, setRulerDragging] = useState<'start' | 'end' | null>(null)

  // Protractor state
  const [protractorPos, setProtractorPos] = useState<Point>({ x: 72, y: 72 })
  const [protractorRadiusAngle, setProtractorRadiusAngle] = useState(0)
  const [protractorDragging, setProtractorDragging] = useState<'move' | 'rotate' | 'resize' | null>(null)
  const [protractorRotateStart, setProtractorRotateStart] = useState(0)
  const [protractorRadius, setProtractorRadius] = useState(60)
  const [protractorResizeAngle, setProtractorResizeAngle] = useState(-60)

  // Calculate actual protractor position (locked to robot or free)
  const actualProtractorPos = protractorLockToRobot ? robotPosition : protractorPos

  // Calculate normalized protractor angle (0-360)
  const normalizedProtractorAngle = Math.round(
    protractorRadiusAngle < 0 ? 360 + protractorRadiusAngle : protractorRadiusAngle
  )

  // Calculate resize handle position
  const resizeHandleRadians = (protractorResizeAngle * Math.PI) / 180
  const resizeHandlePosition = {
    x: Math.cos(resizeHandleRadians) * protractorRadius,
    y: -Math.sin(resizeHandleRadians) * protractorRadius,
  }

  // Calculate ruler length
  const rulerLength = distance(rulerStart, rulerEnd)

  // Generate grid positions
  const gridPositions = React.useMemo(() => {
    const spacing = Math.max(1, gridSize || 12)
    const positions: number[] = []
    for (let pos = 0; pos <= fieldSize; pos += spacing) {
      positions.push(Number(pos.toFixed(6)))
    }
    if (positions[positions.length - 1] !== fieldSize) {
      positions.push(fieldSize)
    }
    return positions
  }, [gridSize, fieldSize])

  // Convert field coordinates to canvas pixels
  const fieldToCanvas = useCallback((fieldX: number, fieldY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width / fieldSize
    const scaleY = rect.height / fieldSize
    return {
      x: fieldX * scaleX,
      y: fieldY * scaleY,
    }
  }, [canvasRef, fieldSize])

  // Convert canvas pixels to field coordinates
  const canvasToField = useCallback((canvasX: number, canvasY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = fieldSize / rect.width
    const scaleY = fieldSize / rect.height
    return {
      x: canvasX * scaleX,
      y: canvasY * scaleY,
    }
  }, [canvasRef, fieldSize])

  // Mouse move handler
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const fieldCoords = canvasToField(mouseX, mouseY)

    if (rulerDragging === 'start') {
      setRulerStart(fieldCoords)
    } else if (rulerDragging === 'end') {
      setRulerEnd(fieldCoords)
    } else if (protractorDragging === 'move') {
      setProtractorPos(fieldCoords)
    } else if (protractorDragging === 'rotate') {
      const centerPos = fieldToCanvas(actualProtractorPos.x, actualProtractorPos.y)
      const angle = Math.atan2(mouseY - centerPos.y, mouseX - centerPos.x) * (180 / Math.PI)
      setProtractorRadiusAngle(angle - protractorRotateStart)
    } else if (protractorDragging === 'resize') {
      const centerPos = fieldToCanvas(actualProtractorPos.x, actualProtractorPos.y)
      const dx = mouseX - centerPos.x
      const dy = mouseY - centerPos.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const clampedRadius = clamp(dist, MIN_PROTRACTOR_RADIUS, MAX_PROTRACTOR_RADIUS)
      setProtractorRadius(clampedRadius)
      const angleRadians = Math.atan2(centerPos.y - mouseY, mouseX - centerPos.x)
      setProtractorResizeAngle(angleRadians * (180 / Math.PI))
    }
  }, [rulerDragging, protractorDragging, canvasRef, canvasToField, fieldToCanvas, actualProtractorPos, protractorRotateStart])

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setRulerDragging(null)
    setProtractorDragging(null)
  }, [])

  // Add event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Mouse down handlers
  const handleRulerStartMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRulerDragging('start')
  }

  const handleRulerEndMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRulerDragging('end')
  }

  const handleProtractorMoveMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (protractorLockToRobot) {
      onProtractorLockToggle?.()
    } else {
      setProtractorDragging('move')
    }
  }

  const handleProtractorRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setProtractorDragging('rotate')
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const centerPos = fieldToCanvas(actualProtractorPos.x, actualProtractorPos.y)
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const angle = Math.atan2(mouseY - centerPos.y, mouseX - centerPos.x) * (180 / Math.PI)
    setProtractorRotateStart(angle - protractorRadiusAngle)
  }

  const handleProtractorResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setProtractorDragging('resize')
  }

  if (!canvasRef.current) return null

  return (
    <>
      {/* Grid Overlay */}
      {showGrid && (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
          {/* Vertical grid lines */}
          {gridPositions.map((position, i) => {
            const pos = fieldToCanvas(position, 0)
            const endPos = fieldToCanvas(position, fieldSize)
            return (
              <line
                key={`v-${i}`}
                x1={pos.x}
                y1={pos.y}
                x2={endPos.x}
                y2={endPos.y}
                stroke={i % 2 === 0 ? '#6b7280' : '#9ca3af'}
                strokeWidth={i % 2 === 0 ? '1.5' : '0.5'}
                opacity="0.3"
              />
            )
          })}

          {/* Horizontal grid lines */}
          {gridPositions.map((position, i) => {
            const pos = fieldToCanvas(0, position)
            const endPos = fieldToCanvas(fieldSize, position)
            return (
              <line
                key={`h-${i}`}
                x1={pos.x}
                y1={pos.y}
                x2={endPos.x}
                y2={endPos.y}
                stroke={i % 2 === 0 ? '#6b7280' : '#9ca3af'}
                strokeWidth={i % 2 === 0 ? '1.5' : '0.5'}
                opacity="0.3"
              />
            )
          })}
        </svg>
      )}

      {/* Ruler Tool */}
      {showRuler && (
        <svg className="absolute top-0 left-0 w-full h-full z-40 pointer-events-none">
          {/* Ruler line */}
          <line
            x1={fieldToCanvas(rulerStart.x, rulerStart.y).x}
            y1={fieldToCanvas(rulerStart.x, rulerStart.y).y}
            x2={fieldToCanvas(rulerEnd.x, rulerEnd.y).x}
            y2={fieldToCanvas(rulerEnd.x, rulerEnd.y).y}
            stroke="#3b82f6"
            strokeWidth="3"
            className="pointer-events-none"
          />

          {/* Start handle */}
          <circle
            cx={fieldToCanvas(rulerStart.x, rulerStart.y).x}
            cy={fieldToCanvas(rulerStart.x, rulerStart.y).y}
            r="8"
            fill="#3b82f6"
            className="cursor-move pointer-events-auto"
            onMouseDown={handleRulerStartMouseDown}
          />

          {/* End handle */}
          <circle
            cx={fieldToCanvas(rulerEnd.x, rulerEnd.y).x}
            cy={fieldToCanvas(rulerEnd.x, rulerEnd.y).y}
            r="8"
            fill="#3b82f6"
            className="cursor-move pointer-events-auto"
            onMouseDown={handleRulerEndMouseDown}
          />

          {/* Length label */}
          <text
            x={(fieldToCanvas(rulerStart.x, rulerStart.y).x + fieldToCanvas(rulerEnd.x, rulerEnd.y).x) / 2}
            y={(fieldToCanvas(rulerStart.x, rulerStart.y).y + fieldToCanvas(rulerEnd.x, rulerEnd.y).y) / 2 - 10}
            className="fill-blue-600 dark:fill-blue-400 font-semibold pointer-events-none"
            textAnchor="middle"
          >
            {rulerLength.toFixed(2)}"
          </text>
        </svg>
      )}

      {/* Protractor Tool */}
      {showProtractor && (
        <svg className="absolute top-0 left-0 w-full h-full z-40 pointer-events-none">
          <g transform={`translate(${fieldToCanvas(actualProtractorPos.x, actualProtractorPos.y).x}, ${fieldToCanvas(actualProtractorPos.x, actualProtractorPos.y).y})`}>
            {/* Full circle protractor */}
            <circle
              cx="0"
              cy="0"
              r={protractorRadius}
              fill="rgba(59, 130, 246, 0.15)"
              stroke="#3b82f6"
              strokeWidth="2"
              className="pointer-events-auto"
            />

            {/* Degree marks every 10 degrees */}
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = (i * 10 * Math.PI) / 180
              const r1 = protractorRadius - 10
              const r2 = protractorRadius
              const x1 = Math.cos(angle) * r1
              const y1 = -Math.sin(angle) * r1
              const x2 = Math.cos(angle) * r2
              const y2 = -Math.sin(angle) * r2

              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#3b82f6"
                    strokeWidth={i % 3 === 0 ? '2' : '1'}
                  />
                  {i % 3 === 0 && (
                    <text
                      x={Math.cos(angle) * (protractorRadius + 10)}
                      y={-Math.sin(angle) * (protractorRadius + 10) + 4}
                      className="fill-blue-600 dark:fill-blue-400 text-xs font-semibold"
                      textAnchor="middle"
                    >
                      {i * 10}°
                    </text>
                  )}
                </g>
              )
            })}

            {/* Cardinal direction line (0°) - fixed */}
            <line
              x1="0"
              y1="0"
              x2={protractorRadius + 5}
              y2="0"
              stroke="#d1d5db"
              strokeWidth="2"
              opacity="0.5"
            />
            <text
              x={protractorRadius + 15}
              y="4"
              className="fill-gray-400 dark:fill-gray-500 text-sm font-bold"
              textAnchor="middle"
            >
              0°
            </text>

            {/* Rotating radius line */}
            <g transform={`rotate(${protractorRadiusAngle})`}>
              <line
                x1="0"
                y1="0"
                x2={protractorRadius + 5}
                y2="0"
                stroke="#ef4444"
                strokeWidth="3"
              />

              {/* Rotation handle on edge */}
              <circle
                cx={protractorRadius}
                cy="0"
                r="10"
                fill="#10b981"
                stroke="#059669"
                strokeWidth="2"
                className="cursor-grab pointer-events-auto"
                onMouseDown={handleProtractorRotateMouseDown}
              />
              <text
                x={protractorRadius}
                y="4"
                className="fill-white text-xs font-bold pointer-events-none"
                textAnchor="middle"
              >
                ↻
              </text>
            </g>

            {/* Angle display */}
            <text
              x="0"
              y={-protractorRadius - 15}
              className="fill-red-600 dark:fill-red-400 text-sm font-bold"
              textAnchor="middle"
            >
              {normalizedProtractorAngle}°
            </text>

            {/* Resize Handle */}
            <circle
              cx={resizeHandlePosition.x}
              cy={resizeHandlePosition.y}
              r="10"
              fill="#f97316"
              stroke="#ea580c"
              strokeWidth="2"
              className="cursor-nwse-resize pointer-events-auto"
              onMouseDown={handleProtractorResizeMouseDown}
            />
            <text
              x={resizeHandlePosition.x}
              y={resizeHandlePosition.y + 4}
              className="fill-white text-xs font-bold pointer-events-none"
              textAnchor="middle"
            >
              ↔
            </text>

            {/* Center move handle / lock indicator */}
            <circle
              cx="0"
              cy="0"
              r="8"
              fill={protractorLockToRobot ? '#fbbf24' : '#3b82f6'}
              stroke={protractorLockToRobot ? '#f59e0b' : '#1d4ed8'}
              strokeWidth="2"
              className={protractorLockToRobot ? 'cursor-pointer pointer-events-auto' : 'cursor-move pointer-events-auto'}
              onMouseDown={handleProtractorMoveMouseDown}
            />
            {protractorLockToRobot && (
              <text
                x="0"
                y="3"
                className="fill-white text-[10px] font-bold pointer-events-none"
                textAnchor="middle"
              >
                x
              </text>
            )}
          </g>
        </svg>
      )}
    </>
  )
}
