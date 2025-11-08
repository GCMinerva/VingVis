"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye } from "lucide-react"

interface RobotPosition {
  x: number
  y: number
  heading: number
}

interface FieldPreviewProps {
  robotPosition?: RobotPosition
  path?: { x: number, y: number }[]
}

export function FieldPreview({ robotPosition, path = [] }: FieldPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // FTC field is 12ft x 12ft (144 inches x 144 inches)
    const fieldSize = 144
    const scale = canvas.width / fieldSize
    const tileSize = 24 * scale // 24 inches per tile

    // Draw field background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid (6x6 tiles)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (let i = 0; i <= 6; i++) {
      // Vertical lines
      ctx.beginPath()
      ctx.moveTo(i * tileSize, 0)
      ctx.lineTo(i * tileSize, canvas.height)
      ctx.stroke()

      // Horizontal lines
      ctx.beginPath()
      ctx.moveTo(0, i * tileSize)
      ctx.lineTo(canvas.width, i * tileSize)
      ctx.stroke()
    }

    // Draw field border
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // Draw starting positions (corners)
    const cornerSize = tileSize * 0.8
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)' // Blue alliance
    ctx.fillRect(0, 0, cornerSize, cornerSize) // Top left
    ctx.fillRect(canvas.width - cornerSize, 0, cornerSize, cornerSize) // Top right

    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)' // Red alliance
    ctx.fillRect(0, canvas.height - cornerSize, cornerSize, cornerSize) // Bottom left
    ctx.fillRect(canvas.width - cornerSize, canvas.height - cornerSize, cornerSize, cornerSize) // Bottom right

    // Draw center line
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw path
    if (path.length > 0) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.beginPath()
      path.forEach((point, index) => {
        const x = (point.x / fieldSize) * canvas.width
        const y = (point.y / fieldSize) * canvas.height
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Draw path points
      path.forEach((point) => {
        const x = (point.x / fieldSize) * canvas.width
        const y = (point.y / fieldSize) * canvas.height
        ctx.fillStyle = '#60a5fa'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw robot
    if (robotPosition) {
      const x = (robotPosition.x / fieldSize) * canvas.width
      const y = (robotPosition.y / fieldSize) * canvas.height
      const heading = robotPosition.heading

      // Robot body (18" x 18" square)
      const robotSize = (18 / fieldSize) * canvas.width

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((heading * Math.PI) / 180)

      // Robot chassis
      ctx.fillStyle = '#10b981'
      ctx.strokeStyle = '#059669'
      ctx.lineWidth = 2
      ctx.fillRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)
      ctx.strokeRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)

      // Direction indicator (front of robot)
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(robotSize / 2, 0)
      ctx.lineTo(robotSize / 2 - 10, -8)
      ctx.lineTo(robotSize / 2 - 10, 8)
      ctx.closePath()
      ctx.fill()

      // Robot center dot
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(0, 0, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    // Draw coordinate labels
    ctx.fillStyle = '#666'
    ctx.font = '10px monospace'
    ctx.fillText('(0, 0)', 5, 15)
    ctx.fillText(`(${fieldSize}, 0)`, canvas.width - 50, 15)
    ctx.fillText(`(0, ${fieldSize})`, 5, canvas.height - 5)
    ctx.fillText(`(${fieldSize}, ${fieldSize})`, canvas.width - 75, canvas.height - 5)

  }, [robotPosition, path])

  return (
    <Card className="h-full border-border/50 bg-background/95">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-green-400" />
          <CardTitle className="text-lg">Field Preview</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-square bg-black/50 rounded-lg overflow-hidden border border-border/50">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full h-full"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-background/50 border border-border/50">
            <div className="text-muted-foreground">Robot Position</div>
            <div className="font-mono mt-1">
              X: {robotPosition?.x?.toFixed(1) || '0.0'}"
            </div>
            <div className="font-mono">
              Y: {robotPosition?.y?.toFixed(1) || '0.0'}"
            </div>
            <div className="font-mono">
              θ: {robotPosition?.heading?.toFixed(1) || '0.0'}°
            </div>
          </div>
          <div className="p-2 rounded bg-background/50 border border-border/50">
            <div className="text-muted-foreground">Field Info</div>
            <div className="mt-1">Size: 144" × 144"</div>
            <div>Tiles: 6 × 6</div>
            <div>Scale: 24"/tile</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
