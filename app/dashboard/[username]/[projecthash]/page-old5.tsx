"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Eye,
  EyeOff,
  Code,
  Plus,
  Trash2,
  Settings,
  ChevronRight,
  Ruler,
  Move,
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
  servo?: string
  position?: number
  customCode?: string
}

type Motor = {
  name: string
  port: number
  reversed: boolean
}

type Servo = {
  name: string
  port: number
}

const BLOCK_TYPES = {
  movement: [
    { id: 'forward', label: 'Move Forward', icon: ArrowUp },
    { id: 'backward', label: 'Move Backward', icon: ArrowDown },
    { id: 'strafeLeft', label: 'Strafe Left', icon: ArrowLeft },
    { id: 'strafeRight', label: 'Strafe Right', icon: ArrowRight },
    { id: 'turnLeft', label: 'Turn Left', icon: RotateCw },
    { id: 'turnRight', label: 'Turn Right', icon: RotateCw },
  ],
  mechanisms: [
    { id: 'servo1', label: 'Servo 1', icon: Settings },
    { id: 'servo2', label: 'Servo 2', icon: Settings },
    { id: 'servo3', label: 'Servo 3', icon: Settings },
    { id: 'motor1', label: 'Motor 1', icon: Settings },
    { id: 'motor2', label: 'Motor 2', icon: Settings },
  ],
  control: [
    { id: 'wait', label: 'Wait', icon: Timer },
    { id: 'custom', label: 'Custom Code', icon: Code },
  ]
}

export default function EnhancedEditor() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showRuler, setShowRuler] = useState(false)
  const [activeTab, setActiveTab] = useState<'movement' | 'mechanisms' | 'control'>('movement')

  const [actions, setActions] = useState<ActionBlock[]>([])
  const [selectedAction, setSelectedAction] = useState<ActionBlock | null>(null)

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [animationSpeed, setAnimationSpeed] = useState(1)

  // Robot state
  const [robotX, setRobotX] = useState(72)
  const [robotY, setRobotY] = useState(72)
  const [robotHeading, setRobotHeading] = useState(0)
  const [isDraggingRobot, setIsDraggingRobot] = useState(false)
  const [path, setPath] = useState<{x: number, y: number, heading: number}[]>([])

  // Hardware config
  const [motors, setMotors] = useState<Motor[]>([
    { name: 'motorFL', port: 0, reversed: false },
    { name: 'motorFR', port: 1, reversed: false },
    { name: 'motorBL', port: 2, reversed: false },
    { name: 'motorBR', port: 3, reversed: false },
  ])
  const [servos, setServos] = useState<Servo[]>([
    { name: 'servo1', port: 0 },
    { name: 'servo2', port: 1 },
    { name: 'servo3', port: 2 },
  ])

  useEffect(() => {
    const guestMode = localStorage.getItem('guestMode') === 'true'
    setIsGuest(guestMode)
    if (!authLoading && !user && !guestMode) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (params.projecthash) {
      if (user) loadProject()
      else if (isGuest) loadGuestProject()
    }
  }, [user, isGuest, params.projecthash])

  // Draw field
  useEffect(() => {
    drawField()
  }, [robotX, robotY, robotHeading, path, showRuler, animationProgress])

  const drawField = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const scale = canvas.width / 144

    // Background
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

    // Tile numbers (24" markers)
    ctx.fillStyle = '#444'
    ctx.font = '10px monospace'
    for (let i = 1; i < 6; i++) {
      const pos = i * 24 * scale
      ctx.fillText(`${i * 24}"`, pos - 15, 12)
      ctx.fillText(`${i * 24}"`, 5, pos + 4)
    }

    // Border
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // Starting zones
    const zoneSize = 24 * scale
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'
    ctx.fillRect(0, 0, zoneSize, zoneSize)
    ctx.fillRect(canvas.width - zoneSize, 0, zoneSize, zoneSize)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'
    ctx.fillRect(0, canvas.height - zoneSize, zoneSize, zoneSize)
    ctx.fillRect(canvas.width - zoneSize, canvas.height - zoneSize, zoneSize, zoneSize)

    // Center line
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw full path
    if (path.length > 1) {
      ctx.strokeStyle = '#3b82f6'
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

      // Path points
      path.forEach((point, i) => {
        const x = (point.x / 144) * canvas.width
        const y = (point.y / 144) * canvas.height
        ctx.fillStyle = i === 0 ? '#10b981' : '#60a5fa'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })

      // Animated path (if animating)
      if (isAnimating && animationProgress > 0) {
        const numPoints = path.length
        const currentIndex = Math.floor(animationProgress * (numPoints - 1))
        const nextIndex = Math.min(currentIndex + 1, numPoints - 1)
        const t = (animationProgress * (numPoints - 1)) - currentIndex

        if (currentIndex < path.length && nextIndex < path.length) {
          const current = path[currentIndex]
          const next = path[nextIndex]

          // Interpolate position
          const interpX = current.x + (next.x - current.x) * t
          const interpY = current.y + (next.y - current.y) * t
          const interpHeading = current.heading + (next.heading - current.heading) * t

          // Draw animated path
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

          // Update robot position during animation
          drawRobot(ctx, interpX, interpY, interpHeading, scale)
          return
        }
      }
    }

    // Draw robot at current position
    drawRobot(ctx, robotX, robotY, robotHeading, scale)

    // Ruler tool
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
  }

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

    // Center dot
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(0, 0, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 144
    const y = ((e.clientY - rect.top) / rect.height) * 144

    // Check if clicking near robot
    const distance = Math.sqrt(Math.pow(x - robotX, 2) + Math.pow(y - robotY, 2))
    if (distance < 15) {
      setIsDraggingRobot(true)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRobot) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.max(9, Math.min(135, ((e.clientX - rect.left) / rect.width) * 144))
    const y = Math.max(9, Math.min(135, ((e.clientY - rect.top) / rect.height) * 144))

    setRobotX(x)
    setRobotY(y)
  }

  const handleCanvasMouseUp = () => {
    setIsDraggingRobot(false)
  }

  const loadGuestProject = () => {
    try {
      setLoading(true)
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
          router.push('/dashboard')
        }
      } else {
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

  const addAction = (blockType: any) => {
    const newAction: ActionBlock = {
      id: Date.now().toString(),
      type: blockType.id,
      label: blockType.label,
      distance: 24,
      power: 0.5,
      angle: 90,
      duration: 1,
      position: 0.5,
    }
    setActions([...actions, newAction])
  }

  const deleteAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id))
    if (selectedAction?.id === id) setSelectedAction(null)
  }

  const updateAction = (id: string, updates: Partial<ActionBlock>) => {
    setActions(actions.map(a => a.id === id ? { ...a, ...updates } : a))
    if (selectedAction?.id === id) {
      setSelectedAction({ ...selectedAction, ...updates })
    }
  }

  const calculatePath = () => {
    let x = robotX, y = robotY, heading = robotHeading
    const newPath: {x: number, y: number, heading: number}[] = [{x, y, heading}]

    actions.forEach(action => {
      const steps = 10 // Interpolation steps for smooth animation
      const distance = action.distance || 24
      const angle = action.angle || 90

      if (action.type === 'forward') {
        for (let i = 1; i <= steps; i++) {
          const d = (distance / steps) * i
          const newX = robotX + d * Math.cos((heading * Math.PI) / 180)
          const newY = robotY + d * Math.sin((heading * Math.PI) / 180)
          newPath.push({x: newX, y: newY, heading})
        }
        x = robotX + distance * Math.cos((heading * Math.PI) / 180)
        y = robotY + distance * Math.sin((heading * Math.PI) / 180)
        robotX = x
        robotY = y
      } else if (action.type === 'backward') {
        for (let i = 1; i <= steps; i++) {
          const d = (distance / steps) * i
          const newX = robotX - d * Math.cos((heading * Math.PI) / 180)
          const newY = robotY - d * Math.sin((heading * Math.PI) / 180)
          newPath.push({x: newX, y: newY, heading})
        }
        x = robotX - distance * Math.cos((heading * Math.PI) / 180)
        y = robotY - distance * Math.sin((heading * Math.PI) / 180)
        robotX = x
        robotY = y
      } else if (action.type === 'strafeLeft') {
        for (let i = 1; i <= steps; i++) {
          const d = (distance / steps) * i
          const newX = robotX + d * Math.cos(((heading - 90) * Math.PI) / 180)
          const newY = robotY + d * Math.sin(((heading - 90) * Math.PI) / 180)
          newPath.push({x: newX, y: newY, heading})
        }
        x = robotX + distance * Math.cos(((heading - 90) * Math.PI) / 180)
        y = robotY + distance * Math.sin(((heading - 90) * Math.PI) / 180)
        robotX = x
        robotY = y
      } else if (action.type === 'strafeRight') {
        for (let i = 1; i <= steps; i++) {
          const d = (distance / steps) * i
          const newX = robotX + d * Math.cos(((heading + 90) * Math.PI) / 180)
          const newY = robotY + d * Math.sin(((heading + 90) * Math.PI) / 180)
          newPath.push({x: newX, y: newY, heading})
        }
        x = robotX + distance * Math.cos(((heading + 90) * Math.PI) / 180)
        y = robotY + distance * Math.sin(((heading + 90) * Math.PI) / 180)
        robotX = x
        robotY = y
      } else if (action.type === 'turnLeft') {
        for (let i = 1; i <= steps; i++) {
          const newHeading = heading - (angle / steps) * i
          newPath.push({x, y, heading: newHeading})
        }
        heading -= angle
      } else if (action.type === 'turnRight') {
        for (let i = 1; i <= steps; i++) {
          const newHeading = heading + (angle / steps) * i
          newPath.push({x, y, heading: newHeading})
        }
        heading += angle
      } else {
        newPath.push({x, y, heading})
      }
    })

    setPath(newPath)
    return newPath
  }

  const startAnimation = () => {
    const newPath = calculatePath()
    setPath(newPath)
    setAnimationProgress(0)
    setIsAnimating(true)

    const duration = 3000 / animationSpeed // 3 seconds base duration
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

  const resetPosition = () => {
    setRobotX(72)
    setRobotY(72)
    setRobotHeading(0)
    setPath([])
    setAnimationProgress(0)
    stopAnimation()
  }

  const exportCode = () => {
    let code = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.Servo;

@Autonomous(name = "${project?.name || 'Auto'}", group = "Auto")
public class ${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')} extends LinearOpMode {
    // Drive Motors
`
    motors.forEach(motor => {
      code += `    private DcMotor ${motor.name};\n`
    })

    code += `\n    // Mechanism Servos\n`
    servos.forEach(servo => {
      code += `    private Servo ${servo.name};\n`
    })

    code += `
    @Override
    public void runOpMode() {
        // Initialize drive motors
`
    motors.forEach(motor => {
      code += `        ${motor.name} = hardwareMap.get(DcMotor.class, "${motor.name}");\n`
      if (motor.reversed) {
        code += `        ${motor.name}.setDirection(DcMotor.Direction.REVERSE);\n`
      }
    })

    code += `\n        // Initialize servos\n`
    servos.forEach(servo => {
      code += `        ${servo.name} = hardwareMap.get(Servo.class, "${servo.name}");\n`
    })

    code += `
        telemetry.addData("Status", "Ready");
        telemetry.update();
        waitForStart();

        if (opModeIsActive()) {
`

    actions.forEach(action => {
      if (action.type.includes('forward') || action.type.includes('backward') || action.type.includes('strafe')) {
        code += `            // ${action.label} ${action.distance || 24} inches\n`
        motors.forEach(m => {
          code += `            ${m.name}.setPower(${action.power || 0.5});\n`
        })
        code += `            sleep(${Math.round(((action.distance || 24) / 12) * 1000)});\n`
        motors.forEach(m => {
          code += `            ${m.name}.setPower(0);\n`
        })
        code += `\n`
      } else if (action.type.includes('turn')) {
        code += `            // ${action.label} ${action.angle || 90} degrees\n`
        code += `            sleep(${Math.round(((action.angle || 90) / 90) * 500)});\n\n`
      } else if (action.type.startsWith('servo')) {
        code += `            ${action.type}.setPosition(${action.position || 0.5});\n`
        code += `            sleep(500);\n\n`
      } else if (action.type === 'wait') {
        code += `            sleep(${Math.round((action.duration || 1) * 1000)});\n\n`
      } else if (action.type === 'custom') {
        code += `            ${action.customCode || '// Your code here'}\n\n`
      }
    })

    code += `            telemetry.addData("Status", "Complete");
            telemetry.update();
        }
    }
}
`

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}.java`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-white">{project.name}</h1>
          <div className="flex items-center gap-1">
            {!isAnimating ? (
              <Button onClick={startAnimation} size="sm" variant="default" disabled={actions.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Animate
              </Button>
            ) : (
              <Button onClick={stopAnimation} size="sm" variant="destructive">
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
            <Button onClick={resetPosition} size="sm" variant="outline">
              <SkipBack className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={() => setShowRuler(!showRuler)} size="sm" variant="ghost">
              <Ruler className="h-4 w-4 mr-2" />
              {showRuler ? 'Hide' : 'Show'} Ruler
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Speed:</span>
            <Slider
              value={[animationSpeed]}
              onValueChange={([v]) => setAnimationSpeed(v)}
              min={0.5}
              max={2}
              step={0.5}
              className="w-24"
            />
            <span>{animationSpeed}x</span>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" variant="ghost">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={exportCode} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Block Palette + Hardware Config */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          <Tabs defaultValue="blocks" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-2">
              <TabsTrigger value="blocks">Blocks</TabsTrigger>
              <TabsTrigger value="hardware">Hardware</TabsTrigger>
            </TabsList>

            <TabsContent value="blocks" className="flex-1 flex flex-col m-0">
              <div className="p-3 border-b border-zinc-800">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={activeTab === 'movement' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('movement')}
                    className="flex-1 text-xs"
                  >
                    Move
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === 'mechanisms' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('mechanisms')}
                    className="flex-1 text-xs"
                  >
                    Mech
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === 'control' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('control')}
                    className="flex-1 text-xs"
                  >
                    Control
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-1.5">
                  {BLOCK_TYPES[activeTab].map((block) => {
                    const Icon = block.icon
                    return (
                      <Button
                        key={block.id}
                        onClick={() => addAction(block)}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-9 hover:bg-blue-500/10 hover:border-blue-500"
                      >
                        <Icon className="h-3.5 w-3.5 mr-2" />
                        {block.label}
                      </Button>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="hardware" className="flex-1 m-0 p-3 overflow-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-white mb-2">Drive Motors</h3>
                  <div className="space-y-2">
                    {motors.map((motor, i) => (
                      <div key={i} className="p-2 bg-zinc-800 rounded border border-zinc-700">
                        <Input
                          value={motor.name}
                          onChange={(e) => {
                            const newMotors = [...motors]
                            newMotors[i].name = e.target.value
                            setMotors(newMotors)
                          }}
                          className="h-7 text-xs bg-zinc-900 mb-1"
                        />
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span>Port {motor.port}</span>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={motor.reversed}
                              onChange={(e) => {
                                const newMotors = [...motors]
                                newMotors[i].reversed = e.target.checked
                                setMotors(newMotors)
                              }}
                              className="w-3 h-3"
                            />
                            Reversed
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white mb-2">Servos</h3>
                  <div className="space-y-2">
                    {servos.map((servo, i) => (
                      <div key={i} className="p-2 bg-zinc-800 rounded border border-zinc-700">
                        <Input
                          value={servo.name}
                          onChange={(e) => {
                            const newServos = [...servos]
                            newServos[i].name = e.target.value
                            setServos(newServos)
                          }}
                          className="h-7 text-xs bg-zinc-900 mb-1"
                        />
                        <div className="text-xs text-zinc-400">Port {servo.port}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center: Timeline */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          <ScrollArea className="h-full p-4">
            <div className="space-y-2">
              {actions.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <p className="text-sm">No actions yet. Add blocks from the left panel.</p>
                </div>
              )}
              {actions.map((action, index) => (
                <Card
                  key={action.id}
                  className={`bg-zinc-900 border-zinc-800 cursor-pointer hover:border-blue-500 transition-all ${
                    selectedAction?.id === action.id ? 'border-blue-500 bg-zinc-800' : ''
                  }`}
                  onClick={() => setSelectedAction(action)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-mono text-zinc-500 w-8">{index + 1}</div>
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                      <div>
                        <div className="font-medium text-sm text-white">{action.label}</div>
                        <div className="text-xs text-zinc-500">
                          {action.type.includes('move') || action.type.includes('strafe')
                            ? `${action.distance || 24}" @ ${(action.power || 0.5) * 100}%`
                            : action.type.includes('turn')
                            ? `${action.angle || 90}°`
                            : action.type === 'wait'
                            ? `${action.duration || 1}s`
                            : action.type.startsWith('servo')
                            ? `Pos: ${((action.position || 0.5) * 100).toFixed(0)}%`
                            : 'Custom'}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); deleteAction(action.id); }}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-red-500" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Config + Preview */}
        <div className="w-96 border-l border-zinc-800 flex flex-col bg-zinc-900">
          {selectedAction && (
            <div className="border-b border-zinc-800 p-4">
              <h3 className="text-sm font-bold text-white mb-3">Configure: {selectedAction.label}</h3>
              <div className="space-y-3">
                {(selectedAction.type.includes('move') || selectedAction.type.includes('strafe')) && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Distance (inches)</Label>
                      <Input
                        type="number"
                        value={selectedAction.distance || 24}
                        onChange={(e) => updateAction(selectedAction.id, { distance: parseFloat(e.target.value) })}
                        className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Power</Label>
                      <Slider
                        value={[selectedAction.power || 0.5]}
                        onValueChange={([v]) => updateAction(selectedAction.id, { power: v })}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-xs text-zinc-500 mt-1">{((selectedAction.power || 0.5) * 100).toFixed(0)}%</div>
                    </div>
                  </>
                )}
                {selectedAction.type.includes('turn') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Angle (degrees)</Label>
                    <Input
                      type="number"
                      value={selectedAction.angle || 90}
                      onChange={(e) => updateAction(selectedAction.id, { angle: parseFloat(e.target.value) })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {selectedAction.type === 'wait' && (
                  <div>
                    <Label className="text-xs text-zinc-400">Duration (seconds)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedAction.duration || 1}
                      onChange={(e) => updateAction(selectedAction.id, { duration: parseFloat(e.target.value) })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {selectedAction.type.startsWith('servo') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Position</Label>
                    <Slider
                      value={[selectedAction.position || 0.5]}
                      onValueChange={([v]) => updateAction(selectedAction.id, { position: v })}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                    <div className="text-xs text-zinc-500 mt-1">{((selectedAction.position || 0.5) * 100).toFixed(0)}%</div>
                  </div>
                )}
                {selectedAction.type === 'custom' && (
                  <div>
                    <Label className="text-xs text-zinc-400">Java Code</Label>
                    <textarea
                      value={selectedAction.customCode || ''}
                      onChange={(e) => updateAction(selectedAction.id, { customCode: e.target.value })}
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
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs">
                  <Move className="h-3 w-3 mr-1" />
                  Drag Robot
                </Button>
              </div>
            </div>
            <div className="aspect-square bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden cursor-move">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full h-full"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
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
          </div>
        </div>
      </div>
    </div>
  )
}
