"use client"

import { useEffect, useState, useCallback, useRef, DragEvent } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { MathTools } from "@/components/math-tools"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
} from "reactflow"
import "reactflow/dist/style.css"
import { BlockNode, StartNode, EndNode, nodeTypes, BlockNodeData } from "@/components/block-nodes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Save,
  Play,
  Pause,
  SkipBack,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Timer,
  Code,
  Trash2,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Ruler,
  Move,
  Target,
  Spline,
  Pencil,
  Repeat,
  GitBranch,
  Zap,
  Eye,
  Gauge,
  CircleDot,
  Radar,
  Waypoints,
  RotateCcw,
  Circle,
  Undo2,
  Redo2,
  Copy,
  Grid3x3,
  Compass,
  PanelLeftClose,
  PanelLeft,
  Wrench,
  Maximize2,
  Minimize2,
  RotateCcw as RotateIcon,
} from "lucide-react"

type Project = {
  id: string
  name: string
  template_type: 'omni-wheel' | 'mecanum-wheel'
  motor_config: any
  workflow_data: any
}

type ActionBlock = {
  id: string
  type: string
  label: string
  distance?: number
  power?: number
  angle?: number
  duration?: number
  targetX?: number
  targetY?: number
  targetHeading?: number
  curveType?: 'linear' | 'spline' | 'bezier'
  servo?: string
  servoName?: string
  motorName?: string
  position?: number
  customCode?: string
  score?: number
  condition?: string
  loopCount?: number
}

type Motor = {
  name: string
  port: number
  reversed: boolean
  hub?: 'control' | 'expansion'
}

type Servo = {
  name: string
  port: number
  hub?: 'control' | 'expansion'
  type?: 'standard' | 'continuous'
}

type I2CDevice = {
  name: string
  type: 'imu' | 'distance' | 'color' | 'servo-controller'
  address: string
  port: number
  hub?: 'control' | 'expansion'
}

type DigitalDevice = {
  name: string
  type: 'touch' | 'limit-switch' | 'magnetic'
  port: number
  hub?: 'control' | 'expansion'
}

type AnalogDevice = {
  name: string
  type: 'potentiometer' | 'light-sensor'
  port: number
  hub?: 'control' | 'expansion'
}

const BLOCK_TYPES = {
  movement: [
    { id: 'moveToPosition', label: 'Move to Position', icon: Target, description: 'Move to specific coordinates' },
    { id: 'splineTo', label: 'Spline to Position', icon: Spline, description: 'Smooth curve to position' },
    { id: 'forward', label: 'Move Forward', icon: ArrowUp, description: 'Move forward by distance' },
    { id: 'backward', label: 'Move Backward', icon: ArrowDown, description: 'Move backward by distance' },
    { id: 'strafeLeft', label: 'Strafe Left', icon: ArrowLeft, description: 'Strafe left by distance' },
    { id: 'strafeRight', label: 'Strafe Right', icon: ArrowRight, description: 'Strafe right by distance' },
    { id: 'turnLeft', label: 'Turn Left', icon: RotateCcw, description: 'Turn left by angle' },
    { id: 'turnRight', label: 'Turn Right', icon: RotateCw, description: 'Turn right by angle' },
    { id: 'turnToHeading', label: 'Turn to Heading', icon: Target, description: 'Turn to specific heading' },
    { id: 'arcMove', label: 'Arc Movement', icon: Circle, description: 'Move in an arc' },
    { id: 'pivotTurn', label: 'Pivot Turn', icon: CircleDot, description: 'Turn around one wheel' },
    { id: 'followPath', label: 'Follow Path', icon: Waypoints, description: 'Follow complex path' },
  ],
  mechanisms: [
    { id: 'setServo', label: 'Set Servo Position', icon: Settings, description: 'Set servo to position' },
    { id: 'continuousServo', label: 'Continuous Servo', icon: RotateCw, description: 'Run continuous servo' },
    { id: 'runMotor', label: 'Run Motor', icon: Zap, description: 'Run mechanism motor' },
    { id: 'stopMotor', label: 'Stop Motor', icon: Pause, description: 'Stop mechanism motor' },
    { id: 'setMotorPower', label: 'Set Motor Power', icon: Gauge, description: 'Set motor power level' },
  ],
  sensors: [
    { id: 'readIMU', label: 'Read IMU', icon: Radar, description: 'Read IMU orientation' },
    { id: 'readDistance', label: 'Read Distance', icon: Eye, description: 'Read distance sensor' },
    { id: 'readColor', label: 'Read Color', icon: CircleDot, description: 'Read color sensor' },
    { id: 'waitForSensor', label: 'Wait for Sensor', icon: Timer, description: 'Wait until sensor condition' },
    { id: 'readTouch', label: 'Read Touch', icon: CircleDot, description: 'Read touch sensor' },
  ],
  control: [
    { id: 'wait', label: 'Wait', icon: Timer, description: 'Wait for duration' },
    { id: 'waitUntil', label: 'Wait Until', icon: Timer, description: 'Wait until condition' },
    { id: 'loop', label: 'Loop', icon: Repeat, description: 'Repeat actions' },
    { id: 'if', label: 'If/Else', icon: GitBranch, description: 'Conditional execution' },
    { id: 'parallel', label: 'Run Parallel', icon: Zap, description: 'Run actions in parallel' },
    { id: 'custom', label: 'Custom Code', icon: Code, description: 'Insert custom Java code' },
  ]
}

// Cubic bezier curve calculation
function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

// Generate smooth curve through points
function generateSpline(points: {x: number, y: number, heading: number}[], steps: number = 50): {x: number, y: number, heading: number}[] {
  if (points.length < 2) return points
  if (points.length === 2) {
    // Linear interpolation
    const result: {x: number, y: number, heading: number}[] = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      result.push({
        x: points[0].x + (points[1].x - points[0].x) * t,
        y: points[0].y + (points[1].y - points[0].y) * t,
        heading: points[0].heading + (points[1].heading - points[0].heading) * t,
      })
    }
    return result
  }

  // Catmull-Rom spline for smooth curves
  const result: {x: number, y: number, heading: number}[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1]

    const segmentSteps = Math.ceil(steps / (points.length - 1))

    for (let j = 0; j <= segmentSteps; j++) {
      const t = j / segmentSteps
      const t2 = t * t
      const t3 = t2 * t

      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      )

      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      )

      const heading = p1.heading + (p2.heading - p1.heading) * t

      result.push({ x, y, heading })
    }
  }

  return result
}

function CurvesEditorInner() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [showRuler, setShowRuler] = useState(false)
  const [showProtractor, setShowProtractor] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [gridSize, setGridSize] = useState(24)
  const [protractorLockToRobot, setProtractorLockToRobot] = useState(false)
  const [selectedField, setSelectedField] = useState<'intothedeep' | 'centerstage' | 'decode'>('intothedeep')
  const [fieldImage, setFieldImage] = useState<HTMLImageElement | null>(null)
  const [activeTab, setActiveTab] = useState<'movement' | 'mechanisms' | 'sensors' | 'control'>('movement')
  const [pathMode, setPathMode] = useState<'roadrunner' | 'pedropathing' | 'simple'>('simple')
  const [blockSearchQuery, setBlockSearchQuery] = useState('')
  const [useCurves, setUseCurves] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [actions, setActions] = useState<ActionBlock[]>([])
  const [selectedAction, setSelectedAction] = useState<ActionBlock | null>(null)

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: 'start',
      type: 'startNode',
      position: { x: 50, y: 200 },
      data: { label: 'Start', type: 'start' } as BlockNodeData,
    },
  ])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node<BlockNodeData> | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const [isAnimating, setIsAnimating] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [animationSpeed, setAnimationSpeed] = useState(1)

  // Node preview states
  const [isNodePreviewing, setIsNodePreviewing] = useState(false)
  const [currentPreviewNodeIndex, setCurrentPreviewNodeIndex] = useState(0)
  const [nodePreviewSpeed, setNodePreviewSpeed] = useState(1)
  const nodePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [robotX, setRobotX] = useState(72)
  const [robotY, setRobotY] = useState(72)
  const [robotHeading, setRobotHeading] = useState(0)
  const [isDraggingRobot, setIsDraggingRobot] = useState(false)
  const [path, setPath] = useState<{x: number, y: number, heading: number}[]>([])

  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastDrawnPoint, setLastDrawnPoint] = useState<{ x: number; y: number } | null>(null)
  const [drawnPoints, setDrawnPoints] = useState<{x: number, y: number}[]>([])

  // Fullscreen and waypoint interaction states
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showWaypoints, setShowWaypoints] = useState(true)
  const [draggedWaypointIndex, setDraggedWaypointIndex] = useState<number | null>(null)
  const [isRotatingRobot, setIsRotatingRobot] = useState(false)
  const fieldContainerRef = useRef<HTMLDivElement>(null)

  const [motors, setMotors] = useState<Motor[]>([
    { name: 'motorFL', port: 0, reversed: false },
    { name: 'motorFR', port: 1, reversed: false },
    { name: 'motorBL', port: 2, reversed: false },
    { name: 'motorBR', port: 3, reversed: false },
  ])
  const [servos, setServos] = useState<Servo[]>([
    { name: 'servo1', port: 0, hub: 'control', type: 'standard' },
    { name: 'servo2', port: 1, hub: 'control', type: 'standard' },
    { name: 'servo3', port: 2, hub: 'control', type: 'standard' },
  ])
  const [i2cDevices, setI2cDevices] = useState<I2CDevice[]>([
    { name: 'imu', type: 'imu', address: '0x28', port: 0 },
  ])
  const [digitalDevices, setDigitalDevices] = useState<DigitalDevice[]>([])
  const [analogDevices, setAnalogDevices] = useState<AnalogDevice[]>([])
  const [hasExpansionHub, setHasExpansionHub] = useState(false)

  // Undo/Redo
  const [actionHistory, setActionHistory] = useState<ActionBlock[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Servo/Motor preview states
  const [servoPositions, setServoPositions] = useState<{[key: string]: number}>({})
  const [motorSpeeds, setMotorSpeeds] = useState<{[key: string]: number}>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Using sessionStorage instead of localStorage for better security
      const guestMode = sessionStorage.getItem('guestMode') === 'true'
      setIsGuest(guestMode)
      // Authentication disabled - allow access without login
    }
  }, [user, authLoading, router])

  // Load field image when selected field changes
  useEffect(() => {
    const img = new Image()
    img.src = `/fields/${selectedField}.webp`
    img.onload = () => {
      setFieldImage(img)
    }
    img.onerror = () => {
      console.error('Failed to load field image:', selectedField)
    }
  }, [selectedField])

  useEffect(() => {
    if (params.projecthash) {
      if (user) {
        loadProject()
      } else if (isGuest) {
        loadGuestProject()
      }
    }
  }, [user, isGuest, params.projecthash]) // eslint-disable-line react-hooks/exhaustive-deps

  const drawField = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const scale = canvas.width / 144

    // Draw field background image if loaded
    if (fieldImage) {
      ctx.drawImage(fieldImage, 0, 0, canvas.width, canvas.height)
    } else {
      // Fallback background if image not loaded
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid
      ctx.strokeStyle = '#2a2a2a'
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

      // Border
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 3
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
    }

    // Draw path
    if (path.length > 1) {
      // Full path (static)
      ctx.strokeStyle = useCurves ? '#3b82f6' : '#666'
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      path.forEach((point, i) => {
        const x = (point.x / 144) * canvas.width
        const y = (point.y / 144) * canvas.height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.globalAlpha = 1

      // Animated portion
      if (isAnimating && animationProgress > 0) {
        const numPoints = path.length
        const currentIndex = Math.floor(animationProgress * (numPoints - 1))
        const nextIndex = Math.min(currentIndex + 1, numPoints - 1)
        const t = (animationProgress * (numPoints - 1)) - currentIndex

        if (currentIndex < path.length && nextIndex < path.length) {
          const current = path[currentIndex]
          const next = path[nextIndex]
          const interpX = current.x + (next.x - current.x) * t
          const interpY = current.y + (next.y - current.y) * t
          const interpHeading = current.heading + (next.heading - current.heading) * t

          // Animated path
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 3
          ctx.beginPath()
          for (let i = 0; i <= currentIndex; i++) {
            const x = (path[i].x / 144) * canvas.width
            const y = (path[i].y / 144) * canvas.height
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          const finalX = (interpX / 144) * canvas.width
          const finalY = (interpY / 144) * canvas.height
          ctx.lineTo(finalX, finalY)
          ctx.stroke()

          drawRobot(ctx, interpX, interpY, interpHeading, scale)
          return
        }
      }
    }

    drawRobot(ctx, robotX, robotY, robotHeading, scale)

    // Draw current drawing path
    if (isDrawing && drawnPoints.length > 0) {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 3
      ctx.beginPath()
      drawnPoints.forEach((point, i) => {
        const x = (point.x / 144) * canvas.width
        const y = (point.y / 144) * canvas.height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // Draw points
      drawnPoints.forEach((point) => {
        const x = (point.x / 144) * canvas.width
        const y = (point.y / 144) * canvas.height
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw waypoint markers for each node block
    if (showWaypoints && !isAnimating) {
      const waypoints = getWaypoints()
      waypoints.forEach((waypoint, index) => {
        const x = (waypoint.x / 144) * canvas.width
        const y = (waypoint.y / 144) * canvas.height

        // Draw waypoint circle
        ctx.fillStyle = index === 0 ? '#10b981' : '#3b82f6'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Draw waypoint number
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(index.toString(), x, y)

        // Draw heading indicator
        if (index > 0) {
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 2
          ctx.beginPath()
          const headingX = x + 15 * Math.cos((waypoint.heading * Math.PI) / 180)
          const headingY = y + 15 * Math.sin((waypoint.heading * Math.PI) / 180)
          ctx.moveTo(x, y)
          ctx.lineTo(headingX, headingY)
          ctx.stroke()
        }
      })
    }

    // Ruler
    if (showRuler) {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo((robotX / 144) * canvas.width, 0)
      ctx.lineTo((robotX / 144) * canvas.width, canvas.height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, (robotY / 144) * canvas.height)
      ctx.lineTo(canvas.width, (robotY / 144) * canvas.height)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [robotX, robotY, robotHeading, path, showRuler, animationProgress, isAnimating, useCurves, fieldImage, isDrawing, drawnPoints, showWaypoints, nodes, edges])

  useEffect(() => {
    drawField()
  }, [drawField])

  const drawRobot = (ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, scale: number) => {
    const canvasX = (x / 144) * ctx.canvas.width
    const canvasY = (y / 144) * ctx.canvas.height
    const robotSize = (18 / 144) * ctx.canvas.width

    ctx.save()
    ctx.translate(canvasX, canvasY)
    ctx.rotate((heading * Math.PI) / 180)

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(-robotSize / 2 + 2, -robotSize / 2 + 2, robotSize, robotSize)

    // Body
    ctx.fillStyle = '#10b981'
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 2
    ctx.fillRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)
    ctx.strokeRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)

    // Front indicator
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.moveTo(robotSize / 2, 0)
    ctx.lineTo(robotSize / 2 - 10, -8)
    ctx.lineTo(robotSize / 2 - 10, 8)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  const getWaypoints = (): {x: number, y: number, heading: number}[] => {
    const waypoints: {x: number, y: number, heading: number}[] = [{x: robotX, y: robotY, heading: robotHeading}]

    let currentX = robotX
    let currentY = robotY
    let currentHeading = robotHeading

    // Build ordered list of nodes by following edges from start
    const orderedNodes: Node<BlockNodeData>[] = []
    const visited = new Set<string>()

    const traverseNodes = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = nodes.find(n => n.id === nodeId)
      if (node && node.type === 'blockNode') {
        orderedNodes.push(node)
      }

      // Find outgoing edges
      const outgoingEdges = edges.filter(e => e.source === nodeId)
      outgoingEdges.forEach(edge => traverseNodes(edge.target))
    }

    traverseNodes('start')

    // Process each node in order
    orderedNodes.forEach(node => {
      const data = node.data

      if (data.type === 'moveToPosition' || data.type === 'splineTo') {
        currentX = data.targetX || currentX
        currentY = data.targetY || currentY
        currentHeading = data.targetHeading !== undefined ? data.targetHeading : currentHeading
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'forward') {
        const distance = data.distance || 24
        currentX += distance * Math.cos((currentHeading * Math.PI) / 180)
        currentY += distance * Math.sin((currentHeading * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'backward') {
        const distance = data.distance || 24
        currentX -= distance * Math.cos((currentHeading * Math.PI) / 180)
        currentY -= distance * Math.sin((currentHeading * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'strafeLeft') {
        const distance = data.distance || 24
        currentX += distance * Math.cos(((currentHeading - 90) * Math.PI) / 180)
        currentY += distance * Math.sin(((currentHeading - 90) * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'strafeRight') {
        const distance = data.distance || 24
        currentX += distance * Math.cos(((currentHeading + 90) * Math.PI) / 180)
        currentY += distance * Math.sin(((currentHeading + 90) * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'turnLeft') {
        currentHeading -= data.angle || 90
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'turnRight') {
        currentHeading += data.angle || 90
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'turnToHeading') {
        currentHeading = data.targetHeading || currentHeading
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      }
    })

    return waypoints
  }

  // Get nodes in execution order by following edges from StartNode
  const getNodesInExecutionOrder = (): Node<BlockNodeData>[] => {
    const orderedNodes: Node<BlockNodeData>[] = []
    const visited = new Set<string>()

    // Find the start node
    const startNode = nodes.find(node => node.type === 'startNode')
    if (!startNode) return orderedNodes

    let currentNodeId: string | null = startNode.id

    // Follow edges from start to end
    while (currentNodeId && !visited.has(currentNodeId)) {
      const currentNode = nodes.find(node => node.id === currentNodeId)
      if (!currentNode) break

      // Skip start and end nodes in the preview
      if (currentNode.type !== 'startNode' && currentNode.type !== 'endNode') {
        orderedNodes.push(currentNode)
      }
      visited.add(currentNodeId)

      // Find the next node by following edges
      const outgoingEdge = edges.find(edge => edge.source === currentNodeId)
      currentNodeId = outgoingEdge?.target || null
    }

    return orderedNodes
  }

  const calculatePath = () => {
    const waypoints = getWaypoints()

    if (useCurves && waypoints.length > 2) {
      // Use spline interpolation for smooth curves
      const smoothPath = generateSpline(waypoints, 100)
      setPath(smoothPath)
      return smoothPath
    } else {
      // Linear interpolation
      const linearPath: {x: number, y: number, heading: number}[] = []
      for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i]
        const end = waypoints[i + 1]
        const steps = 20
        for (let j = 0; j <= steps; j++) {
          const t = j / steps
          linearPath.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
            heading: start.heading + (end.heading - start.heading) * t,
          })
        }
      }
      setPath(linearPath)
      return linearPath
    }
  }

  const updateWaypointPosition = (waypointIndex: number, newX: number, newY: number) => {
    // Get current waypoints and find which node corresponds to this waypoint
    const waypoints = getWaypoints()
    if (waypointIndex >= waypoints.length) return

    // Build ordered list of nodes
    const orderedNodes: Node<BlockNodeData>[] = []
    const visited = new Set<string>()

    const traverseNodes = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = nodes.find(n => n.id === nodeId)
      if (node && node.type === 'blockNode') {
        orderedNodes.push(node)
      }

      const outgoingEdges = edges.filter(e => e.source === nodeId)
      outgoingEdges.forEach(edge => traverseNodes(edge.target))
    }

    traverseNodes('start')

    // The waypoint index (minus 1 since index 0 is robot start) maps to the node
    const nodeIndex = waypointIndex - 1
    if (nodeIndex < 0 || nodeIndex >= orderedNodes.length) return

    const targetNode = orderedNodes[nodeIndex]

    // Update the node's target position
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === targetNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              targetX: newX,
              targetY: newY,
            },
          }
        }
        return node
      })
    )
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 144
    const y = ((e.clientY - rect.top) / rect.height) * 144

    // Drawing mode - start drawing
    if (isDrawingMode) {
      setIsDrawing(true)
      setLastDrawnPoint({ x, y })
      setDrawnPoints([{ x, y }])
      return
    }

    // Check if clicking on robot - shift+click to rotate, otherwise drag
    const robotDistance = Math.sqrt(Math.pow(x - robotX, 2) + Math.pow(y - robotY, 2))
    if (robotDistance < 15) {
      if (e.shiftKey) {
        setIsRotatingRobot(true)
      } else {
        setIsDraggingRobot(true)
      }
      return
    }

    // Check if clicking on a waypoint
    if (showWaypoints && !isAnimating) {
      const waypoints = getWaypoints()
      for (let i = 1; i < waypoints.length; i++) { // Skip first waypoint (robot start position)
        const waypoint = waypoints[i]
        const distance = Math.sqrt(Math.pow(x - waypoint.x, 2) + Math.pow(y - waypoint.y, 2))
        if (distance < 10) {
          setDraggedWaypointIndex(i)
          return
        }
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.max(9, Math.min(135, ((e.clientX - rect.left) / rect.width) * 144))
    const y = Math.max(9, Math.min(135, ((e.clientY - rect.top) / rect.height) * 144))

    // Drawing mode - continuously add points
    if (isDrawing && lastDrawnPoint) {
      const dist = Math.sqrt(Math.pow(x - lastDrawnPoint.x, 2) + Math.pow(y - lastDrawnPoint.y, 2))
      // Add point every 5 inches of distance
      if (dist > 5) {
        setDrawnPoints(prev => [...prev, { x, y }])
        setLastDrawnPoint({ x, y })
      }
      return
    }

    // Rotate robot
    if (isRotatingRobot) {
      const angle = Math.atan2(y - robotY, x - robotX) * (180 / Math.PI)
      setRobotHeading(angle)
      return
    }

    // Drag robot
    if (isDraggingRobot) {
      setRobotX(x)
      setRobotY(y)
      return
    }

    // Drag waypoint
    if (draggedWaypointIndex !== null) {
      updateWaypointPosition(draggedWaypointIndex, x, y)
      return
    }
  }

  const handleCanvasMouseUp = () => {
    // Convert drawn points to actions when drawing ends
    if (isDrawing && drawnPoints.length > 1) {
      convertDrawnPointsToActions()
    }

    setIsDraggingRobot(false)
    setIsRotatingRobot(false)
    setIsDrawing(false)
    setLastDrawnPoint(null)
    setDrawnPoints([])
    setDraggedWaypointIndex(null)
  }

  const convertDrawnPointsToActions = () => {
    if (drawnPoints.length < 2) return

    // Simplify points - take every Nth point to avoid too many nodes
    const simplified: {x: number, y: number}[] = []
    const step = Math.max(1, Math.floor(drawnPoints.length / 10)) // Max 10 waypoints

    for (let i = 0; i < drawnPoints.length; i += step) {
      simplified.push(drawnPoints[i])
    }
    // Always include the last point
    if (simplified[simplified.length - 1] !== drawnPoints[drawnPoints.length - 1]) {
      simplified.push(drawnPoints[drawnPoints.length - 1])
    }

    // Convert to nodes and create connections
    const newNodes: any[] = []
    const newEdges: any[] = []
    const timestamp = Date.now()

    // Find the last node in the current flow to connect from
    let lastNodeId = 'start'
    if (nodes.length > 1) {
      // Find nodes that don't have outgoing edges
      const nodesWithoutOutgoingEdges = nodes.filter(
        n => n.type === 'blockNode' && !edges.some(e => e.source === n.id)
      )
      if (nodesWithoutOutgoingEdges.length > 0) {
        lastNodeId = nodesWithoutOutgoingEdges[nodesWithoutOutgoingEdges.length - 1].id
      }
    }

    simplified.forEach((point, index) => {
      const nodeId = `moveToPosition-${timestamp}_${index}`

      // Create node positioned relative to canvas
      // Calculate position in ReactFlow coordinates (approximate)
      const nodeX = 300 + (index * 250)
      const nodeY = 200

      newNodes.push({
        id: nodeId,
        type: 'blockNode',
        position: { x: nodeX, y: nodeY },
        data: {
          label: 'Move to Position',
          type: 'moveToPosition',
          targetX: point.x,
          targetY: point.y,
          targetHeading: robotHeading,
          curveType: useCurves ? 'spline' : 'linear',
          distance: 24,
          power: 0.5,
          angle: 90,
          duration: 1,
          position: 0.5,
          score: 0,
        } as BlockNodeData,
      })

      // Create edge from previous node
      if (index === 0) {
        newEdges.push({
          id: `${lastNodeId}-${nodeId}`,
          source: lastNodeId,
          target: nodeId,
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        })
      } else {
        const prevNodeId = `moveToPosition-${timestamp}_${index - 1}`
        newEdges.push({
          id: `${prevNodeId}-${nodeId}`,
          source: prevNodeId,
          target: nodeId,
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        })
      }
    })

    // Add nodes and edges to the flow
    setNodes((nds) => [...nds, ...newNodes])
    setEdges((eds) => [...eds, ...newEdges])
  }

  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault() // Prevent default context menu
  }

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Double-click functionality removed
  }

  const toggleFullscreen = () => {
    if (!fieldContainerRef.current) return

    if (!isFullscreen) {
      if (fieldContainerRef.current.requestFullscreen) {
        fieldContainerRef.current.requestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const loadGuestProject = () => {
    try {
      setLoading(true)
      // Load from localStorage (same as dashboard)
      const guestProjects = localStorage.getItem('guestProjects')
      if (guestProjects) {
        const projects = JSON.parse(guestProjects)
        const foundProject = projects.find((p: any) => p.project_hash === params.projecthash)
        if (foundProject) {
          setProject(foundProject)
          if (foundProject.workflow_data?.actions) {
            setActions(foundProject.workflow_data.actions)
          }
        } else {
          // Project not found, redirect to dashboard
          router.push('/dashboard')
        }
      } else {
        // No guest projects, redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Error loading guest project:', err)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadProject = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('project_hash', params.projecthash as string)
        .eq('user_id', user!.id)
        .single()

      if (error) throw error
      setProject(data)
      if (data.workflow_data?.actions) {
        setActions(data.workflow_data.actions)
      }
    } catch (err: any) {
      console.error('Error loading project:', err)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!project) return
    try {
      setSaving(true)
      if (isGuest) {
        // Save to localStorage (same as dashboard)
        const guestProjects = localStorage.getItem('guestProjects')
        if (guestProjects) {
          const projects = JSON.parse(guestProjects)
          const updatedProjects = projects.map((p: any) => {
            if (p.project_hash === project.id || p.project_hash === params.projecthash) {
              return { ...p, workflow_data: { actions }, updated_at: new Date().toISOString() }
            }
            return p
          })
          localStorage.setItem('guestProjects', JSON.stringify(updatedProjects))
        }
      } else {
        const { error } = await supabase
          .from('projects')
          .update({ workflow_data: { actions } })
          .eq('id', project.id)
        if (error) throw error
      }
    } catch (err: any) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  // Legacy action functions - kept for backward compatibility but not used with nodes
  const addAction = (blockType: any) => {
    // This function is no longer used - blocks are now dragged and dropped
  }

  const saveToHistory = (newActions: ActionBlock[]) => {
    const newHistory = actionHistory.slice(0, historyIndex + 1)
    newHistory.push(newActions)
    setActionHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setActions(actionHistory[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < actionHistory.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setActions(actionHistory[historyIndex + 1])
    }
  }

  const cloneAction = (action: ActionBlock) => {
    const cloned: ActionBlock = {
      ...action,
      id: Date.now().toString(),
    }
    const newActions = [...actions, cloned]
    saveToHistory(newActions)
    setActions(newActions)
  }

  const deleteAction = (id: string) => {
    const newActions = actions.filter(a => a.id !== id)
    saveToHistory(newActions)
    setActions(newActions)
    if (selectedAction?.id === id) setSelectedAction(null)
  }

  const updateAction = (id: string, updates: Partial<ActionBlock>) => {
    const newActions = actions.map(a => a.id === id ? { ...a, ...updates } : a)
    setActions(newActions)
    if (selectedAction?.id === id) {
      setSelectedAction({ ...selectedAction, ...updates })
    }
  }

  const startAnimation = () => {
    const newPath = calculatePath()
    setPath(newPath)
    setAnimationProgress(0)
    setIsAnimating(true)

    const duration = 3000 / animationSpeed
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimationProgress(progress)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        if (newPath.length > 0) {
          const final = newPath[newPath.length - 1]
          setRobotX(final.x)
          setRobotY(final.y)
          setRobotHeading(final.heading)
        }
      }
    }

    animate()
  }

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setIsAnimating(false)
  }

  // Node preview functions
  const startNodePreview = () => {
    const orderedNodes = getNodesInExecutionOrder()
    if (orderedNodes.length === 0) return

    setIsNodePreviewing(true)
    setCurrentPreviewNodeIndex(0)
    zoomToNode(orderedNodes[0])
  }

  const stopNodePreview = () => {
    setIsNodePreviewing(false)
    setCurrentPreviewNodeIndex(0)
    if (nodePreviewTimeoutRef.current) {
      clearTimeout(nodePreviewTimeoutRef.current)
      nodePreviewTimeoutRef.current = null
    }
    // Clear node selection
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: false,
      }))
    )
    // Fit view to show all nodes
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 })
    }
  }

  const nextPreviewNode = () => {
    const orderedNodes = getNodesInExecutionOrder()
    if (orderedNodes.length === 0) return

    const nextIndex = currentPreviewNodeIndex + 1
    if (nextIndex < orderedNodes.length) {
      setCurrentPreviewNodeIndex(nextIndex)
      zoomToNode(orderedNodes[nextIndex])
    } else {
      // Loop back to first node
      setCurrentPreviewNodeIndex(0)
      zoomToNode(orderedNodes[0])
    }
  }

  const previousPreviewNode = () => {
    const orderedNodes = getNodesInExecutionOrder()
    if (orderedNodes.length === 0) return

    const prevIndex = currentPreviewNodeIndex - 1
    if (prevIndex >= 0) {
      setCurrentPreviewNodeIndex(prevIndex)
      zoomToNode(orderedNodes[prevIndex])
    } else {
      // Loop to last node
      const lastIndex = orderedNodes.length - 1
      setCurrentPreviewNodeIndex(lastIndex)
      zoomToNode(orderedNodes[lastIndex])
    }
  }

  const zoomToNode = (node: Node<BlockNodeData>) => {
    if (!reactFlowInstance) return

    // Select the node to highlight it
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
      }))
    )

    // Zoom to the node with smooth animation
    reactFlowInstance.setCenter(
      node.position.x + 150, // Offset to center the node (node width ~300px)
      node.position.y + 100, // Offset to center the node (node height ~200px)
      { zoom: 1.2, duration: 800 }
    )
  }

  // Auto-advance node preview
  useEffect(() => {
    if (!isNodePreviewing) return

    const delay = 2000 / nodePreviewSpeed // Base delay of 2 seconds adjusted by speed
    nodePreviewTimeoutRef.current = setTimeout(() => {
      nextPreviewNode()
    }, delay)

    return () => {
      if (nodePreviewTimeoutRef.current) {
        clearTimeout(nodePreviewTimeoutRef.current)
      }
    }
  }, [isNodePreviewing, currentPreviewNodeIndex, nodePreviewSpeed]) // eslint-disable-line react-hooks/exhaustive-deps

  const resetPosition = () => {
    setRobotX(72)
    setRobotY(72)
    setRobotHeading(0)
    setPath([])
    setAnimationProgress(0)
    stopAnimation()
  }

  const exportRoadRunner = () => {
    let code = `package org.firstinspires.ftc.teamcode;

import com.acmerobotics.roadrunner.geometry.Pose2d;
import com.acmerobotics.roadrunner.trajectory.Trajectory;
import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;

@Autonomous(name = "${project?.name || 'Auto'} (RoadRunner)", group = "Auto")
public class ${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}RR extends LinearOpMode {

    @Override
    public void runOpMode() {
        SampleMecanumDrive drive = new SampleMecanumDrive(hardwareMap);

        Pose2d startPose = new Pose2d(${robotX}, ${robotY}, Math.toRadians(${robotHeading}));
        drive.setPoseEstimate(startPose);

        waitForStart();

        if (opModeIsActive()) {
            // Build trajectory
            TrajectorySequenceBuilder builder = drive.trajectorySequenceBuilder(startPose);
`

    actions.forEach(action => {
      if (action.type === 'moveToPosition') {
        code += `
            .lineTo(new Vector2d(${action.targetX}, ${action.targetY}))`
        if (action.targetHeading !== undefined) {
          code += `
            .turn(Math.toRadians(${action.targetHeading}))`
        }
      } else if (action.type === 'splineTo') {
        code += `
            .splineTo(new Vector2d(${action.targetX}, ${action.targetY}), Math.toRadians(${action.targetHeading || 0}))`
      } else if (action.type === 'wait') {
        code += `
            .waitSeconds(${action.duration || 1})`
      }
    })

    code += `;

            TrajectorySequence trajSeq = builder.build();
            drive.followTrajectorySequence(trajSeq);
        }
    }
}
`

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}RR.java`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportPedroPathing = () => {
    let code = `package org.firstinspires.ftc.teamcode;

import com.pedropathing.follower.Follower;
import com.pedropathing.pathgen.BezierLine;
import com.pedropathing.pathgen.PathChain;
import com.pedropathing.pathgen.Point;
import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.OpMode;

@Autonomous(name = "${project?.name || 'Auto'} (PedroPathing)", group = "Auto")
public class ${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}Pedro extends OpMode {
    private Follower follower;
    private PathChain path;

    @Override
    public void init() {
        follower = new Follower(hardwareMap);

        // Build path
        path = follower.pathBuilder()
            .addPath(new BezierLine(new Point(${robotX}, ${robotY}, Point.CARTESIAN)))
`

    actions.forEach(action => {
      if (action.type === 'moveToPosition' || action.type === 'splineTo') {
        code += `            .addPath(new BezierLine(new Point(${action.targetX}, ${action.targetY}, Point.CARTESIAN)))\n`
      }
    })

    code += `            .build();

        follower.followPath(path);
    }

    @Override
    public void loop() {
        follower.update();

        telemetry.addData("X", follower.getPose().getX());
        telemetry.addData("Y", follower.getPose().getY());
        telemetry.addData("Heading", Math.toDegrees(follower.getPose().getHeading()));
        telemetry.update();
    }
}
`

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}Pedro.java`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportCode = () => {
    if (pathMode === 'roadrunner') {
      exportRoadRunner()
    } else if (pathMode === 'pedropathing') {
      exportPedroPathing()
    } else {
      // Export simple Java code as before
      exportRoadRunner() // Default to RoadRunner for now
    }
  }

  // ReactFlow handlers
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds))
    },
    [setEdges]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<BlockNodeData>) => {
    setSelectedNode(node)
  }, [])

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      const blockType = event.dataTransfer.getData('application/reactflow')
      if (!blockType || !reactFlowWrapper.current || !reactFlowInstance) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const blockInfo = Object.values(BLOCK_TYPES)
        .flat()
        .find((b) => b.id === blockType)

      if (!blockInfo) return

      const newNode = {
        id: `${blockType}-${Date.now()}`,
        type: 'blockNode',
        position,
        data: {
          label: blockInfo.label,
          type: blockInfo.id,
          distance: 24,
          power: 0.5,
          angle: 90,
          duration: 1,
          position: 0.5,
          targetX: robotX,
          targetY: robotY,
          targetHeading: robotHeading,
          curveType: 'linear' as 'linear' | 'spline' | 'bezier',
          score: 0,
        } as BlockNodeData,
      }

      setNodes((nds) => [...nds, newNode])
    },
    [reactFlowInstance, robotX, robotY, robotHeading, setNodes]
  )

  const onDragStart = (event: DragEvent, blockType: string) => {
    event.dataTransfer.setData('application/reactflow', blockType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
      if (selectedNode?.id === nodeId) setSelectedNode(null)
    },
    [setNodes, setEdges, selectedNode]
  )

  const updateNodeData = useCallback(
    (nodeId: string, updates: Partial<BlockNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      )
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...updates } } : null)
      }
    },
    [setNodes, selectedNode]
  )

  if (authLoading || loading || !project) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      <Navbar />

      {/* Toolbar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-2 sm:px-4 py-2 flex items-center justify-between gap-2 flex-shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[120px] sm:max-w-none" title={project.name}>
            {project.name}
          </h1>

          {/* Animation Controls */}
          <div className="flex items-center gap-1">
            {!isAnimating ? (
              <Button onClick={startAnimation} size="sm" variant="default" disabled={nodes.filter(n => n.type === 'blockNode').length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Animate
              </Button>
            ) : (
              <Button onClick={stopAnimation} size="sm" variant="destructive" className="h-8">
                <Pause className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Stop</span>
              </Button>
            )}
            <Button onClick={resetPosition} size="sm" variant="outline" className="h-8">
              <SkipBack className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Tools Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 gap-1">
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Tools</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Drawing Tools</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={showRuler}
                onCheckedChange={setShowRuler}
              >
                <Ruler className="h-4 w-4 mr-2" />
                Ruler
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showProtractor}
                onCheckedChange={setShowProtractor}
              >
                <Compass className="h-4 w-4 mr-2" />
                Protractor
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showGrid}
                onCheckedChange={setShowGrid}
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Grid
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={isDrawingMode}
                onCheckedChange={setIsDrawingMode}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Drawing Mode
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showWaypoints}
                onCheckedChange={setShowWaypoints}
              >
                <Waypoints className="h-4 w-4 mr-2" />
                Show Waypoints
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fullscreen Field
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <Button onClick={undo} disabled={historyIndex <= 0} size="sm" variant="ghost" className="h-8 w-8 p-0" title="Undo">
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={redo} disabled={historyIndex >= actionHistory.length - 1} size="sm" variant="ghost" className="h-8 w-8 p-0" title="Redo">
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 gap-1">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Settings</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Field Settings</DropdownMenuLabel>
              <div className="px-2 py-2 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Field Type</Label>
                  <Select value={selectedField} onValueChange={(v: any) => setSelectedField(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intothedeep">Into the Deep</SelectItem>
                      <SelectItem value="centerstage">CenterStage</SelectItem>
                      <SelectItem value="decode">Decode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Path Mode</Label>
                  <Select value={pathMode} onValueChange={(v: any) => setPathMode(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="roadrunner">RoadRunner</SelectItem>
                      <SelectItem value="pedropathing">PedroPathing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-400">Smooth Curves</Label>
                  <Switch checked={useCurves} onCheckedChange={setUseCurves} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Animation Speed</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[animationSpeed]}
                      onValueChange={([v]) => setAnimationSpeed(v)}
                      min={0.5}
                      max={2}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="text-xs text-zinc-400 w-8">{animationSpeed}x</span>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save & Export */}
          <Button onClick={handleSave} disabled={saving} size="sm" variant="ghost" className="h-8">
            <Save className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
          </Button>
          <Button onClick={exportCode} size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
            <Download className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Blocks + Hardware */}
        <div className={`${sidebarCollapsed ? 'w-12' : 'w-64'} bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300`}>
          {/* Collapse Toggle Button */}
          <div className="p-2 border-b border-zinc-800 flex justify-between items-center">
            {!sidebarCollapsed && (
              <span className="text-xs font-semibold text-white">Tools</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
              title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <Tabs defaultValue="blocks" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 m-2 flex-shrink-0">
                <TabsTrigger value="blocks">Blocks</TabsTrigger>
                <TabsTrigger value="hardware">Hardware</TabsTrigger>
              </TabsList>

            <TabsContent value="blocks" className="flex-1 flex flex-col m-0 overflow-hidden h-0">
              {/* Block Search */}
              <div className="p-3 border-b border-zinc-800 flex-shrink-0">
                <Input
                  type="text"
                  placeholder="Search blocks..."
                  value={blockSearchQuery}
                  onChange={(e) => setBlockSearchQuery(e.target.value)}
                  className="h-8 text-xs bg-zinc-800 border-zinc-700 mb-2"
                />
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    size="sm"
                    variant={activeTab === 'movement' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('movement')}
                    className="text-xs"
                  >
                    Move
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === 'mechanisms' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('mechanisms')}
                    className="text-xs"
                  >
                    Mech
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === 'sensors' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('sensors')}
                    className="text-xs"
                  >
                    Sensors
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === 'control' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('control')}
                    className="text-xs"
                  >
                    Control
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 h-full">
                <div className="p-3">
                <div className="space-y-1.5">
                  {BLOCK_TYPES[activeTab]
                    .filter(block =>
                      blockSearchQuery === '' ||
                      block.label.toLowerCase().includes(blockSearchQuery.toLowerCase()) ||
                      block.description.toLowerCase().includes(blockSearchQuery.toLowerCase())
                    )
                    .map((block) => {
                      const Icon = block.icon
                      return (
                        <div key={block.id} className="group">
                          <Button
                            draggable
                            onDragStart={(e) => onDragStart(e, block.id)}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-auto py-2 hover:bg-blue-500/10 hover:border-blue-500 cursor-grab active:cursor-grabbing"
                          >
                            <Icon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                            <div className="flex flex-col items-start flex-1 min-w-0">
                              <div className="font-medium">{block.label}</div>
                              <div className="text-[10px] text-zinc-500 truncate w-full group-hover:text-zinc-400">
                                {block.description}
                              </div>
                            </div>
                          </Button>
                        </div>
                      )
                    })}
                  {BLOCK_TYPES[activeTab].filter(block =>
                    blockSearchQuery === '' ||
                    block.label.toLowerCase().includes(blockSearchQuery.toLowerCase()) ||
                    block.description.toLowerCase().includes(blockSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center text-xs text-zinc-500 py-4">
                      No blocks found
                    </div>
                  )}
                </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="hardware" className="flex-1 m-0 flex flex-col overflow-hidden h-0">
              <ScrollArea className="flex-1 h-full">
                <div className="p-3">
                <div className="space-y-4">
                {/* Expansion Hub Toggle */}
                <div className="p-3 bg-zinc-800/50 rounded border border-zinc-700">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-white">Expansion Hub</span>
                    <Switch checked={hasExpansionHub} onCheckedChange={setHasExpansionHub} />
                  </label>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Enable second hub for additional ports
                  </div>
                </div>

                {/* Drive Motors */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white">Drive Motors</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMotors([...motors, { name: `motor${motors.length}`, port: 0, reversed: false, hub: 'control' }])}
                      className="h-6 text-[10px] px-2"
                      disabled={pathMode === 'pedropathing'}
                    >
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {motors.map((motor, i) => (
                      <div key={i} className="p-2 bg-zinc-800 rounded border border-zinc-700">
                        <div className="flex items-center justify-between mb-1">
                          <Input
                            value={motor.name}
                            onChange={(e) => {
                              const newMotors = [...motors]
                              newMotors[i].name = e.target.value
                              setMotors(newMotors)
                            }}
                            className="h-7 text-xs bg-zinc-900 flex-1"
                            disabled={pathMode === 'pedropathing' && i < 4}
                          />
                          {(i >= 4 || pathMode !== 'pedropathing') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newMotors = motors.filter((_, idx) => idx !== i)
                                setMotors(newMotors)
                              }}
                              className="h-7 w-7 p-0 ml-1 text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                            <span>Port</span>
                            <span>{motor.port}</span>
                          </div>
                          <Slider
                            value={[motor.port]}
                            onValueChange={([v]) => {
                              const newMotors = [...motors]
                              newMotors[i].port = v
                              setMotors(newMotors)
                            }}
                            min={0}
                            max={3}
                            step={1}
                            disabled={pathMode === 'pedropathing' && i < 4}
                            className="mt-1"
                          />
                        </div>
                        {hasExpansionHub && (
                          <Select
                            value={motor.hub || 'control'}
                            onValueChange={(v: 'control' | 'expansion') => {
                              const newMotors = [...motors]
                              newMotors[i].hub = v
                              setMotors(newMotors)
                            }}
                            disabled={pathMode === 'pedropathing' && i < 4}
                          >
                            <SelectTrigger className="h-6 w-full text-[10px] mb-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="control">Control Hub</SelectItem>
                              <SelectItem value="expansion">Expansion Hub</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <label className="flex items-center gap-1 cursor-pointer text-xs text-zinc-400">
                          <input
                            type="checkbox"
                            checked={motor.reversed}
                            onChange={(e) => {
                              const newMotors = [...motors]
                              newMotors[i].reversed = e.target.checked
                              setMotors(newMotors)
                            }}
                            className="w-3 h-3"
                            disabled={pathMode === 'pedropathing' && i < 4}
                          />
                          Reversed
                        </label>
                      </div>
                    ))}
                  </div>
                  {pathMode === 'pedropathing' && (
                    <div className="mt-2 p-2 bg-blue-900/20 rounded border border-blue-700/50 text-xs text-blue-300">
                      Drive motors (first 4) are locked when using PedroPathing
                    </div>
                  )}
                </div>

                {/* Servos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white">Servos</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setServos([...servos, { name: `servo${servos.length}`, port: 0, hub: 'control', type: 'standard' }])}
                      className="h-6 text-[10px] px-2"
                    >
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {servos.map((servo, i) => (
                      <div key={i} className="p-2 bg-zinc-800 rounded border border-zinc-700">
                        <div className="flex items-center justify-between mb-1">
                          <Input
                            value={servo.name}
                            onChange={(e) => {
                              const newServos = [...servos]
                              newServos[i].name = e.target.value
                              setServos(newServos)
                            }}
                            className="h-7 text-xs bg-zinc-900 flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newServos = servos.filter((_, idx) => idx !== i)
                              setServos(newServos)
                            }}
                            className="h-7 w-7 p-0 ml-1 text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                            <span>Port</span>
                            <span>{servo.port}</span>
                          </div>
                          <Slider
                            value={[servo.port]}
                            onValueChange={([v]) => {
                              const newServos = [...servos]
                              newServos[i].port = v
                              setServos(newServos)
                            }}
                            min={0}
                            max={5}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                        <Select
                          value={servo.type || 'standard'}
                          onValueChange={(v: 'standard' | 'continuous') => {
                            const newServos = [...servos]
                            newServos[i].type = v
                            setServos(newServos)
                          }}
                        >
                          <SelectTrigger className="h-6 w-full text-[10px] mb-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="continuous">Continuous</SelectItem>
                          </SelectContent>
                        </Select>
                        {hasExpansionHub && (
                          <Select
                            value={servo.hub || 'control'}
                            onValueChange={(v: 'control' | 'expansion') => {
                              const newServos = [...servos]
                              newServos[i].hub = v
                              setServos(newServos)
                            }}
                          >
                            <SelectTrigger className="h-6 w-full text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="control">Control Hub</SelectItem>
                              <SelectItem value="expansion">Expansion Hub</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* I2C Devices */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white">I2C Devices</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setI2cDevices([...i2cDevices, { name: 'sensor', type: 'distance', address: '0x00', port: 0, hub: 'control' }])}
                      className="h-6 text-[10px] px-2"
                    >
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {i2cDevices.map((device, i) => (
                      <div key={i} className="p-2 bg-zinc-800 rounded border border-zinc-700">
                        <div className="flex items-center justify-between mb-1">
                          <Input
                            value={device.name}
                            onChange={(e) => {
                              const newDevices = [...i2cDevices]
                              newDevices[i].name = e.target.value
                              setI2cDevices(newDevices)
                            }}
                            className="h-7 text-xs bg-zinc-900 flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newDevices = i2cDevices.filter((_, idx) => idx !== i)
                              setI2cDevices(newDevices)
                            }}
                            className="h-7 w-7 p-0 ml-1 text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <Select
                          value={device.type}
                          onValueChange={(v: 'imu' | 'distance' | 'color' | 'servo-controller') => {
                            const newDevices = [...i2cDevices]
                            newDevices[i].type = v
                            setI2cDevices(newDevices)
                          }}
                        >
                          <SelectTrigger className="h-6 w-full text-[10px] mb-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="imu">IMU (BNO055)</SelectItem>
                            <SelectItem value="distance">Distance Sensor</SelectItem>
                            <SelectItem value="color">Color Sensor</SelectItem>
                            <SelectItem value="servo-controller">Servo Controller</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1 mb-1">
                          <Input
                            value={device.address}
                            onChange={(e) => {
                              const newDevices = [...i2cDevices]
                              newDevices[i].address = e.target.value
                              setI2cDevices(newDevices)
                            }}
                            placeholder="Address"
                            className="h-6 text-[10px] bg-zinc-900"
                          />
                          <Input
                            type="number"
                            value={device.port}
                            onChange={(e) => {
                              const newDevices = [...i2cDevices]
                              newDevices[i].port = parseInt(e.target.value)
                              setI2cDevices(newDevices)
                            }}
                            placeholder="Port"
                            className="h-6 text-[10px] bg-zinc-900 w-16"
                          />
                        </div>
                        {hasExpansionHub && (
                          <Select
                            value={device.hub || 'control'}
                            onValueChange={(v: 'control' | 'expansion') => {
                              const newDevices = [...i2cDevices]
                              newDevices[i].hub = v
                              setI2cDevices(newDevices)
                            }}
                          >
                            <SelectTrigger className="h-6 w-full text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="control">Control Hub</SelectItem>
                              <SelectItem value="expansion">Expansion Hub</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digital Devices */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white">Digital Sensors</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDigitalDevices([...digitalDevices, { name: 'touchSensor', type: 'touch', port: 0, hub: 'control' }])}
                      className="h-6 text-[10px] px-2"
                    >
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {digitalDevices.map((device, i) => (
                      <div key={i} className="p-2 bg-zinc-800 rounded border border-zinc-700">
                        <div className="flex items-center justify-between mb-1">
                          <Input
                            value={device.name}
                            onChange={(e) => {
                              const newDevices = [...digitalDevices]
                              newDevices[i].name = e.target.value
                              setDigitalDevices(newDevices)
                            }}
                            className="h-7 text-xs bg-zinc-900 flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newDevices = digitalDevices.filter((_, idx) => idx !== i)
                              setDigitalDevices(newDevices)
                            }}
                            className="h-7 w-7 p-0 ml-1 text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex gap-1 mb-1">
                          <Select
                            value={device.type}
                            onValueChange={(v: 'touch' | 'limit-switch' | 'magnetic') => {
                              const newDevices = [...digitalDevices]
                              newDevices[i].type = v
                              setDigitalDevices(newDevices)
                            }}
                          >
                            <SelectTrigger className="h-6 flex-1 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="touch">Touch Sensor</SelectItem>
                              <SelectItem value="limit-switch">Limit Switch</SelectItem>
                              <SelectItem value="magnetic">Magnetic Sensor</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={device.port}
                            onChange={(e) => {
                              const newDevices = [...digitalDevices]
                              newDevices[i].port = parseInt(e.target.value)
                              setDigitalDevices(newDevices)
                            }}
                            placeholder="Port"
                            className="h-6 text-[10px] bg-zinc-900 w-16"
                          />
                        </div>
                        {hasExpansionHub && (
                          <Select
                            value={device.hub || 'control'}
                            onValueChange={(v: 'control' | 'expansion') => {
                              const newDevices = [...digitalDevices]
                              newDevices[i].hub = v
                              setDigitalDevices(newDevices)
                            }}
                          >
                            <SelectTrigger className="h-6 w-full text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="control">Control Hub</SelectItem>
                              <SelectItem value="expansion">Expansion Hub</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analog Devices */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white">Analog Sensors</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAnalogDevices([...analogDevices, { name: 'potentiometer', type: 'potentiometer', port: 0, hub: 'control' }])}
                      className="h-6 text-[10px] px-2"
                    >
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {analogDevices.map((device, i) => (
                      <div key={i} className="p-2 bg-zinc-800 rounded border border-zinc-700">
                        <div className="flex items-center justify-between mb-1">
                          <Input
                            value={device.name}
                            onChange={(e) => {
                              const newDevices = [...analogDevices]
                              newDevices[i].name = e.target.value
                              setAnalogDevices(newDevices)
                            }}
                            className="h-7 text-xs bg-zinc-900 flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newDevices = analogDevices.filter((_, idx) => idx !== i)
                              setAnalogDevices(newDevices)
                            }}
                            className="h-7 w-7 p-0 ml-1 text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex gap-1 mb-1">
                          <Select
                            value={device.type}
                            onValueChange={(v: 'potentiometer' | 'light-sensor') => {
                              const newDevices = [...analogDevices]
                              newDevices[i].type = v
                              setAnalogDevices(newDevices)
                            }}
                          >
                            <SelectTrigger className="h-6 flex-1 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="potentiometer">Potentiometer</SelectItem>
                              <SelectItem value="light-sensor">Light Sensor</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={device.port}
                            onChange={(e) => {
                              const newDevices = [...analogDevices]
                              newDevices[i].port = parseInt(e.target.value)
                              setAnalogDevices(newDevices)
                            }}
                            placeholder="Port"
                            className="h-6 text-[10px] bg-zinc-900 w-16"
                          />
                        </div>
                        {hasExpansionHub && (
                          <Select
                            value={device.hub || 'control'}
                            onValueChange={(v: 'control' | 'expansion') => {
                              const newDevices = [...analogDevices]
                              newDevices[i].hub = v
                              setAnalogDevices(newDevices)
                            }}
                          >
                            <SelectTrigger className="h-6 w-full text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="control">Control Hub</SelectItem>
                              <SelectItem value="expansion">Expansion Hub</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          )}
        </div>

        {/* Center: Node Editor */}
        <div className="flex-1 flex flex-col bg-zinc-950" ref={reactFlowWrapper}>
          <div className="h-full w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              className="bg-zinc-950"
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                animated: true,
                type: 'smoothstep',
                style: { stroke: '#3b82f6', strokeWidth: 2 },
              }}
            >
              <Background color="#27272a" gap={20} size={1} />
              <Controls className="bg-zinc-900 border border-zinc-800" />

              {/* Node Preview Controls */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Card className="bg-zinc-900/95 border-zinc-800 backdrop-blur">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-semibold text-zinc-400 mr-2">
                        Node Preview
                      </div>

                      {!isNodePreviewing ? (
                        <Button
                          size="sm"
                          onClick={startNodePreview}
                          className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={getNodesInExecutionOrder().length === 0}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={previousPreviewNode}
                            className="h-7 px-2 border-zinc-700"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="text-xs text-zinc-400 min-w-[60px] text-center">
                            {currentPreviewNodeIndex + 1} / {getNodesInExecutionOrder().length}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={nextPreviewNode}
                            className="h-7 px-2 border-zinc-700"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            onClick={stopNodePreview}
                            className="h-7 px-3 bg-red-600 hover:bg-red-700 text-white ml-2"
                          >
                            <SkipBack className="h-3 w-3 mr-1" />
                            Stop
                          </Button>
                        </>
                      )}

                      {isNodePreviewing && (
                        <>
                          <div className="h-4 w-px bg-zinc-700 mx-1" />
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-zinc-400">Speed</Label>
                            <Slider
                              value={[nodePreviewSpeed]}
                              onValueChange={(value) => setNodePreviewSpeed(value[0])}
                              min={0.5}
                              max={2}
                              step={0.5}
                              className="w-20"
                            />
                            <span className="text-xs text-zinc-500 min-w-[32px]">{nodePreviewSpeed}x</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <MiniMap
                className="bg-zinc-900 border border-zinc-800"
                nodeColor={(node) => {
                  if (node.type === 'startNode') return '#10b981'
                  if (node.type === 'endNode') return '#ef4444'
                  return '#3b82f6'
                }}
                maskColor="rgba(0, 0, 0, 0.6)"
              />
            </ReactFlow>
          </div>
          {nodes.length === 1 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="text-zinc-500 text-sm">
                <p className="font-semibold mb-2">Drag and Drop Blocks</p>
                <p className="text-xs">Drag blocks from the left panel onto the canvas</p>
                <p className="text-xs mt-1">Connect nodes by dragging from one handle to another</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Config + Preview */}
        <div className="w-96 border-l border-zinc-800 flex flex-col bg-zinc-900">
          {/* Servo/Motor Preview */}
          <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
            <h3 className="text-sm font-bold text-white mb-2">Hardware Status</h3>
            <div className="space-y-2">
              {servos.slice(0, 3).map((servo, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="text-xs text-zinc-400 w-16 truncate">{servo.name}</div>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(servoPositions[servo.name] || 0.5) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs font-mono text-zinc-500 w-10">
                    {((servoPositions[servo.name] || 0.5) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
              {motors.slice(0, 4).map((motor, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="text-xs text-zinc-400 w-16 truncate">{motor.name}</div>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${Math.abs(motorSpeeds[motor.name] || 0) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs font-mono text-zinc-500 w-10">
                    {((motorSpeeds[motor.name] || 0) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedNode && selectedNode.type === 'blockNode' && (
            <div className="border-b border-zinc-800 p-4 max-h-64 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Configure: {selectedNode.data.label}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteNode(selectedNode.id)}
                  className="h-6 w-6 p-0"
                  title="Delete Node"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
              <div className="space-y-3">
                {/* Score Configuration */}
                {(selectedNode.data.type === 'moveToPosition' || selectedNode.data.type === 'custom') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Score Points</Label>
                    <Input
                      type="number"
                      value={selectedNode.data.score || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { score: parseInt(e.target.value) || 0 })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}

                {(selectedNode.data.type === 'moveToPosition' || selectedNode.data.type === 'splineTo') && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Target X (inches)</Label>
                      <Input
                        type="number"
                        value={selectedNode.data.targetX || 0}
                        onChange={(e) => updateNodeData(selectedNode.id, { targetX: parseFloat(e.target.value) })}
                        className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Target Y (inches)</Label>
                      <Input
                        type="number"
                        value={selectedNode.data.targetY || 0}
                        onChange={(e) => updateNodeData(selectedNode.id, { targetY: parseFloat(e.target.value) })}
                        className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Target Heading (degrees)</Label>
                      <Input
                        type="number"
                        value={selectedNode.data.targetHeading || 0}
                        onChange={(e) => updateNodeData(selectedNode.id, { targetHeading: parseFloat(e.target.value) })}
                        className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                  </>
                )}
                {(selectedNode.data.type.includes('move') && !selectedNode.data.type.includes('To')) && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Distance (inches)</Label>
                      <Input
                        type="number"
                        value={selectedNode.data.distance || 24}
                        onChange={(e) => updateNodeData(selectedNode.id, { distance: parseFloat(e.target.value) })}
                        className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Power</Label>
                      <Slider
                        value={[selectedNode.data.power || 0.5]}
                        onValueChange={([v]) => updateNodeData(selectedNode.id, { power: v })}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-xs text-zinc-500 mt-1">{((selectedNode.data.power || 0.5) * 100).toFixed(0)}%</div>
                    </div>
                  </>
                )}
                {(selectedNode.data.type.includes('turn') && selectedNode.data.type !== 'turnToHeading') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Angle (degrees)</Label>
                    <Input
                      type="number"
                      value={selectedNode.data.angle || 90}
                      onChange={(e) => updateNodeData(selectedNode.id, { angle: parseFloat(e.target.value) })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {selectedNode.data.type === 'turnToHeading' && (
                  <div>
                    <Label className="text-xs text-zinc-400">Target Heading (degrees)</Label>
                    <Input
                      type="number"
                      value={selectedNode.data.targetHeading || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { targetHeading: parseFloat(e.target.value) })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {selectedNode.data.type === 'wait' && (
                  <div>
                    <Label className="text-xs text-zinc-400">Duration (seconds)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedNode.data.duration || 1}
                      onChange={(e) => updateNodeData(selectedNode.id, { duration: parseFloat(e.target.value) })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {selectedNode.data.type.startsWith('servo') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Position</Label>
                    <Slider
                      value={[selectedNode.data.position || 0.5]}
                      onValueChange={([v]) => updateNodeData(selectedNode.id, { position: v })}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                    <div className="text-xs text-zinc-500 mt-1">{((selectedNode.data.position || 0.5) * 100).toFixed(0)}%</div>
                  </div>
                )}
                {(selectedNode.data.type === 'setServo' || selectedNode.data.type.startsWith('servo') || selectedNode.data.type === 'continuousServo') && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Select Servo</Label>
                      <Select
                        value={selectedNode.data.servoName || servos[0]?.name}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { servoName: v })}
                      >
                        <SelectTrigger className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {servos.map((servo) => (
                            <SelectItem key={servo.name} value={servo.name}>{servo.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Position</Label>
                      <Slider
                        value={[selectedNode.data.position || 0.5]}
                        onValueChange={([v]) => {
                          updateNodeData(selectedNode.id, { position: v })
                          setServoPositions({ ...servoPositions, [selectedNode.data.servoName || servos[0]?.name]: v })
                        }}
                        max={1}
                        step={0.01}
                        className="mt-2"
                      />
                      <div className="text-xs text-zinc-500 mt-1">{((selectedNode.data.position || 0.5) * 100).toFixed(0)}%</div>
                    </div>
                  </>
                )}
                {(selectedNode.data.type === 'runMotor' || selectedNode.data.type === 'setMotorPower') && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Select Motor</Label>
                      <Select
                        value={selectedNode.data.motorName || motors[4]?.name}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { motorName: v })}
                      >
                        <SelectTrigger className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {motors.slice(4).map((motor) => (
                            <SelectItem key={motor.name} value={motor.name}>{motor.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Power</Label>
                      <Slider
                        value={[selectedNode.data.power || 0.5]}
                        onValueChange={([v]) => {
                          updateNodeData(selectedNode.id, { power: v })
                          setMotorSpeeds({ ...motorSpeeds, [selectedNode.data.motorName || motors[0]?.name]: v })
                        }}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-xs text-zinc-500 mt-1">{((selectedNode.data.power || 0.5) * 100).toFixed(0)}%</div>
                    </div>
                  </>
                )}
                {(selectedNode.data.type === 'loop') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Loop Count</Label>
                    <Input
                      type="number"
                      value={selectedNode.data.loopCount || 1}
                      onChange={(e) => updateNodeData(selectedNode.id, { loopCount: parseInt(e.target.value) || 1 })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {(selectedNode.data.type === 'waitUntil' || selectedNode.data.type === 'waitForSensor' || selectedNode.data.type === 'if') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Condition</Label>
                    <Input
                      type="text"
                      value={selectedNode.data.condition || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                      placeholder="e.g., sensor > 10"
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {selectedNode.data.type === 'custom' && (
                  <div>
                    <Label className="text-xs text-zinc-400">Java Code</Label>
                    <textarea
                      value={selectedNode.data.customCode || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { customCode: e.target.value })}
                      placeholder="// Your code here"
                      className="w-full h-32 mt-1 p-2 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Field Preview */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Field Preview</h3>
              <div className="flex items-center gap-2">
                <div className="text-xs text-zinc-500">
                  {useCurves ? 'Smooth Curves' : 'Linear'}
                </div>
                <Button
                  onClick={toggleFullscreen}
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-3 p-2 bg-zinc-800/50 rounded border border-zinc-700/50 text-xs text-zinc-400">
              <div className="font-semibold text-zinc-300 mb-1">Interactive Controls:</div>
              <div className="space-y-0.5">
                <div>• <span className="text-green-400">Drag robot</span>: Move position</div>
                <div>• <span className="text-yellow-400">Shift+Drag robot</span>: Rotate heading</div>
                <div>• <span className="text-blue-400">Drag waypoints</span>: Reposition blocks</div>
                <div>• <span className="text-purple-400">Drawing mode</span>: Draw path on field</div>
              </div>
            </div>
            <div ref={fieldContainerRef} className={`aspect-square bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden relative ${isFullscreen ? 'w-screen h-screen !aspect-auto flex items-center justify-center bg-black' : ''}`}>
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className={isFullscreen ? 'max-w-full max-h-full' : 'w-full h-full'}
                style={{
                  cursor: isDrawingMode ? 'crosshair' :
                          isDraggingRobot ? 'grabbing' :
                          isRotatingRobot ? 'crosshair' :
                          draggedWaypointIndex !== null ? 'move' :
                          'default'
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onContextMenu={handleCanvasContextMenu}
                onDoubleClick={handleCanvasDoubleClick}
              />
              <MathTools
                showRuler={showRuler}
                showProtractor={showProtractor}
                showGrid={showGrid}
                gridSize={gridSize}
                canvasRef={canvasRef}
                robotPosition={{ x: robotX, y: robotY }}
                robotHeading={robotHeading}
                protractorLockToRobot={protractorLockToRobot}
                onProtractorLockToggle={() => setProtractorLockToRobot(!protractorLockToRobot)}
                fieldSize={144}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded bg-zinc-800 border border-zinc-700">
                <div className="text-zinc-500">X</div>
                <div className="font-mono text-white">{robotX.toFixed(1)}"</div>
              </div>
              <div className="p-2 rounded bg-zinc-800 border border-zinc-700">
                <div className="text-zinc-500">Y</div>
                <div className="font-mono text-white">{robotY.toFixed(1)}"</div>
              </div>
              <div className="p-2 rounded bg-zinc-800 border border-zinc-700">
                <div className="text-zinc-500">θ</div>
                <div className="font-mono text-white">{robotHeading.toFixed(1)}°</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-500 text-center">
              Nodes: {nodes.filter(n => n.type === 'blockNode').length} | Connections: {edges.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CurvesEditor() {
  return (
    <ReactFlowProvider>
      <CurvesEditorInner />
    </ReactFlowProvider>
  )
}
