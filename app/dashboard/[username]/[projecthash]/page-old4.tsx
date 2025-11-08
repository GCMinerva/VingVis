"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import {
  Save,
  Play,
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

// Generic FTC blocks
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

export default function PedroStyleEditor() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [activeTab, setActiveTab] = useState<'movement' | 'mechanisms' | 'control'>('movement')

  const [actions, setActions] = useState<ActionBlock[]>([])
  const [selectedAction, setSelectedAction] = useState<ActionBlock | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)

  // Robot state for preview
  const [robotX, setRobotX] = useState(72)
  const [robotY, setRobotY] = useState(72)
  const [robotHeading, setRobotHeading] = useState(0)
  const [path, setPath] = useState<{x: number, y: number}[]>([])

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

  // Draw field preview
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Field background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid (144" field = 6x6 tiles)
    const scale = canvas.width / 144
    ctx.strokeStyle = '#333'
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
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // Starting positions (corners)
    const cornerSize = 24 * scale
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
    ctx.fillRect(0, 0, cornerSize, cornerSize)
    ctx.fillRect(canvas.width - cornerSize, 0, cornerSize, cornerSize)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'
    ctx.fillRect(0, canvas.height - cornerSize, cornerSize, cornerSize)
    ctx.fillRect(canvas.width - cornerSize, canvas.height - cornerSize, cornerSize, cornerSize)

    // Draw path
    if (path.length > 1) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      path.forEach((point, i) => {
        const x = (point.x / 144) * canvas.width
        const y = (point.y / 144) * canvas.height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      // Path points
      path.forEach((point) => {
        const x = (point.x / 144) * canvas.width
        const y = (point.y / 144) * canvas.height
        ctx.fillStyle = '#60a5fa'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw robot
    const x = (robotX / 144) * canvas.width
    const y = (robotY / 144) * canvas.height
    const robotSize = (18 / 144) * canvas.width

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((robotHeading * Math.PI) / 180)

    // Robot body
    ctx.fillStyle = '#10b981'
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 2
    ctx.fillRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)
    ctx.strokeRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)

    // Front indicator
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.moveTo(robotSize / 2, 0)
    ctx.lineTo(robotSize / 2 - 8, -6)
    ctx.lineTo(robotSize / 2 - 8, 6)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    // Coordinates
    ctx.fillStyle = '#999'
    ctx.font = '10px monospace'
    ctx.fillText('(0,0)', 5, 12)
    ctx.fillText('(144,144)', canvas.width - 50, canvas.height - 5)
  }, [robotX, robotY, robotHeading, path])

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

  const simulatePath = () => {
    let x = 72, y = 72, heading = 0
    const newPath: {x: number, y: number}[] = [{x, y}]

    actions.forEach(action => {
      if (action.type === 'forward') {
        const distance = action.distance || 24
        x += distance * Math.cos((heading * Math.PI) / 180)
        y += distance * Math.sin((heading * Math.PI) / 180)
        newPath.push({x, y})
      } else if (action.type === 'backward') {
        const distance = action.distance || 24
        x -= distance * Math.cos((heading * Math.PI) / 180)
        y -= distance * Math.sin((heading * Math.PI) / 180)
        newPath.push({x, y})
      } else if (action.type === 'strafeLeft') {
        const distance = action.distance || 24
        x += distance * Math.cos(((heading - 90) * Math.PI) / 180)
        y += distance * Math.sin(((heading - 90) * Math.PI) / 180)
        newPath.push({x, y})
      } else if (action.type === 'strafeRight') {
        const distance = action.distance || 24
        x += distance * Math.cos(((heading + 90) * Math.PI) / 180)
        y += distance * Math.sin(((heading + 90) * Math.PI) / 180)
        newPath.push({x, y})
      } else if (action.type === 'turnLeft') {
        heading -= action.angle || 90
        newPath.push({x, y})
      } else if (action.type === 'turnRight') {
        heading += action.angle || 90
        newPath.push({x, y})
      }
    })

    setRobotX(x)
    setRobotY(y)
    setRobotHeading(heading)
    setPath(newPath)
  }

  const exportCode = () => {
    let code = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.Servo;

@Autonomous(name = "${project?.name || 'Auto'}", group = "Auto")
public class ${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')} extends LinearOpMode {
    private DcMotor motorFL, motorFR, motorBL, motorBR;
    private Servo servo1, servo2, servo3;
    private DcMotor motor1, motor2;

    @Override
    public void runOpMode() {
        motorFL = hardwareMap.get(DcMotor.class, "motorFL");
        motorFR = hardwareMap.get(DcMotor.class, "motorFR");
        motorBL = hardwareMap.get(DcMotor.class, "motorBL");
        motorBR = hardwareMap.get(DcMotor.class, "motorBR");
        servo1 = hardwareMap.get(Servo.class, "servo1");
        servo2 = hardwareMap.get(Servo.class, "servo2");
        servo3 = hardwareMap.get(Servo.class, "servo3");
        motor1 = hardwareMap.get(DcMotor.class, "motor1");
        motor2 = hardwareMap.get(DcMotor.class, "motor2");

        telemetry.addData("Status", "Ready");
        telemetry.update();
        waitForStart();

        if (opModeIsActive()) {
`

    actions.forEach(action => {
      if (action.type.includes('forward') || action.type.includes('backward') || action.type.includes('strafe')) {
        code += `            // ${action.label} ${action.distance || 24} inches\n`
        code += `            motorFL.setPower(${action.power || 0.5});\n`
        code += `            motorFR.setPower(${action.power || 0.5});\n`
        code += `            motorBL.setPower(${action.power || 0.5});\n`
        code += `            motorBR.setPower(${action.power || 0.5});\n`
        code += `            sleep(${Math.round(((action.distance || 24) / 12) * 1000)});\n`
        code += `            motorFL.setPower(0);\n            motorFR.setPower(0);\n            motorBL.setPower(0);\n            motorBR.setPower(0);\n\n`
      } else if (action.type.includes('turn')) {
        code += `            // ${action.label} ${action.angle || 90} degrees\n`
        code += `            sleep(${Math.round(((action.angle || 90) / 90) * 500)});\n\n`
      } else if (action.type.startsWith('servo')) {
        code += `            ${action.type}.setPosition(${action.position || 0.5});\n`
        code += `            sleep(500);\n\n`
      } else if (action.type.startsWith('motor')) {
        code += `            ${action.type}.setPower(${action.power || 0.5});\n`
        code += `            sleep(${Math.round((action.duration || 1) * 1000)});\n`
        code += `            ${action.type}.setPower(0);\n\n`
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
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold text-white">{project.name}</h1>
          <Button onClick={() => { simulatePath(); setIsPlaying(true); }} size="sm" variant="default">
            <Play className="h-4 w-4 mr-2" />
            Preview Path
          </Button>
          <Button onClick={() => setShowPreview(!showPreview)} size="sm" variant="outline">
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? 'Hide' : 'Show'} Field
          </Button>
        </div>
        <div className="flex items-center gap-2">
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
        {/* Left: Block Palette */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
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
        </div>

        {/* Center: Timeline/Sequence */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="flex-1 overflow-hidden">
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
                              ? `${action.distance || 24}" @ ${action.power || 0.5} power`
                              : action.type.includes('turn')
                              ? `${action.angle || 90}°`
                              : action.type === 'wait'
                              ? `${action.duration || 1}s`
                              : action.type.startsWith('servo')
                              ? `Position: ${action.position || 0.5}`
                              : action.type.startsWith('motor')
                              ? `${action.power || 0.5} power for ${action.duration || 1}s`
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
        </div>

        {/* Right: Config + Preview */}
        <div className="w-96 border-l border-zinc-800 flex flex-col bg-zinc-900">
          {/* Configuration Panel */}
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
                {selectedAction.type.startsWith('motor') && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Power</Label>
                      <Slider
                        value={[selectedAction.power || 0.5]}
                        onValueChange={([v]) => updateAction(selectedAction.id, { power: v })}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
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
                  </>
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
          {showPreview && (
            <div className="flex-1 p-4 overflow-auto">
              <h3 className="text-sm font-bold text-white mb-2">Field Preview</h3>
              <div className="aspect-square bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
                <canvas ref={canvasRef} width={400} height={400} className="w-full h-full" />
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
          )}
        </div>
      </div>
    </div>
  )
}
