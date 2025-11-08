"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { HardwareConfig } from "@/components/hardware-config-panel"
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Hand,
  Grip,
  Eye,
  Code,
  Plus,
  Trash2,
  Settings,
} from "lucide-react"

type Project = {
  id: string
  name: string
  template_type: 'omni-wheel' | 'mecanum-wheel'
  motor_config: any
  workflow_data: any
  hardware_config?: HardwareConfig
}

// FTC-specific node configurations
const FTC_NODES = {
  movement: [
    { id: 'moveForward', label: 'Drive Forward', icon: ArrowUp, color: 'from-blue-500 to-blue-600' },
    { id: 'moveBackward', label: 'Drive Backward', icon: ArrowDown, color: 'from-blue-500 to-blue-600' },
    { id: 'strafeLeft', label: 'Strafe Left', icon: ArrowLeft, color: 'from-blue-500 to-blue-600' },
    { id: 'strafeRight', label: 'Strafe Right', icon: ArrowRight, color: 'from-blue-500 to-blue-600' },
    { id: 'turnLeft', label: 'Turn Left', icon: RotateCw, color: 'from-purple-500 to-purple-600' },
    { id: 'turnRight', label: 'Turn Right', icon: RotateCw, color: 'from-purple-500 to-purple-600' },
  ],
  actions: [
    { id: 'clawOpen', label: 'Open Claw', icon: Hand, color: 'from-pink-500 to-pink-600' },
    { id: 'clawClose', label: 'Close Claw', icon: Grip, color: 'from-pink-500 to-pink-600' },
    { id: 'armUp', label: 'Lift Up', icon: ArrowUp, color: 'from-orange-500 to-orange-600' },
    { id: 'armDown', label: 'Lift Down', icon: ArrowDown, color: 'from-orange-500 to-orange-600' },
    { id: 'intake', label: 'Run Intake', icon: Play, color: 'from-green-500 to-green-600' },
  ],
  control: [
    { id: 'wait', label: 'Wait / Pause', icon: Timer, color: 'from-yellow-500 to-yellow-600' },
    { id: 'custom', label: 'Custom Code', icon: Code, color: 'from-indigo-500 to-indigo-600' },
  ]
}

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'default',
    data: { label: 'START', nodeType: 'start' },
    position: { x: 250, y: 50 },
    style: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: '2px solid #059669',
      borderRadius: '12px',
      padding: '16px 24px',
      fontWeight: 'bold',
      fontSize: '16px',
    },
  },
]

export default function FTCProjectEditor() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [activeCategory, setActiveCategory] = useState<'movement' | 'actions' | 'control'>('movement')

  // Hardware config state
  const [motors, setMotors] = useState<Array<{name: string, port: number}>>([
    { name: 'motorFL', port: 0 },
    { name: 'motorFR', port: 1 },
    { name: 'motorBL', port: 2 },
    { name: 'motorBR', port: 3 },
  ])
  const [servos, setServos] = useState<Array<{name: string, port: number}>>([
    { name: 'claw', port: 0 },
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
      if (user) {
        loadProject()
      } else if (isGuest) {
        loadGuestProject()
      }
    }
  }, [user, isGuest, params.projecthash])

  const loadGuestProject = () => {
    try {
      setLoading(true)
      const guestProjects = localStorage.getItem('guestProjects')
      if (guestProjects) {
        const projects = JSON.parse(guestProjects)
        const foundProject = projects.find((p: any) => p.project_hash === params.projecthash)

        if (foundProject) {
          setProject(foundProject)
          if (foundProject.workflow_data && foundProject.workflow_data.nodes) {
            setNodes(foundProject.workflow_data.nodes)
            setEdges(foundProject.workflow_data.edges || [])
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

      if (data.workflow_data && data.workflow_data.nodes) {
        setNodes(data.workflow_data.nodes)
        setEdges(data.workflow_data.edges || [])
      }
    } catch (err: any) {
      console.error('Error loading project:', err)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    [setEdges]
  )

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
              return {
                ...p,
                workflow_data: { nodes, edges },
                updated_at: new Date().toISOString(),
              }
            }
            return p
          })
          localStorage.setItem('guestProjects', JSON.stringify(updatedProjects))
        }
      } else {
        const { error } = await supabase
          .from('projects')
          .update({
            workflow_data: { nodes, edges },
          })
          .eq('id', project.id)

        if (error) throw error
      }
    } catch (err: any) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  const addNodeToCanvas = (nodeConfig: any) => {
    const newNode: Node = {
      id: `${nodeConfig.id}-${Date.now()}`,
      type: 'default',
      data: {
        label: nodeConfig.label,
        nodeType: nodeConfig.id,
        config: {}
      },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 150
      },
      style: {
        background: `linear-gradient(135deg, ${nodeConfig.color})`,
        color: 'white',
        border: '2px solid rgba(255,255,255,0.3)',
        borderRadius: '8px',
        padding: '12px 20px',
        fontWeight: '600',
        fontSize: '14px',
        minWidth: '150px',
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const updateNodeConfig = (key: string, value: any) => {
    if (!selectedNode) return

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              config: { ...node.data.config, [key]: value }
            }
          }
        }
        return node
      })
    )

    setSelectedNode(prev => prev ? {
      ...prev,
      data: {
        ...prev.data,
        config: { ...prev.data.config, [key]: value }
      }
    } : null)
  }

  const deleteSelectedNode = () => {
    if (!selectedNode || selectedNode.data.nodeType === 'start') return
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
    setSelectedNode(null)
  }

  const exportCode = () => {
    let code = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.Servo;

@Autonomous(name = "${project?.name || 'Auto'}", group = "Auto")
public class ${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')} extends LinearOpMode {

    // Motors
`
    motors.forEach(motor => {
      code += `    private DcMotor ${motor.name};\n`
    })

    code += `\n    // Servos\n`
    servos.forEach(servo => {
      code += `    private Servo ${servo.name};\n`
    })

    code += `
    @Override
    public void runOpMode() {
        // Initialize hardware
`
    motors.forEach(motor => {
      code += `        ${motor.name} = hardwareMap.get(DcMotor.class, "${motor.name}");\n`
    })

    servos.forEach(servo => {
      code += `        ${servo.name} = hardwareMap.get(Servo.class, "${servo.name}");\n`
    })

    code += `
        telemetry.addData("Status", "Ready");
        telemetry.update();

        waitForStart();

        if (opModeIsActive()) {
`

    // Sort nodes by vertical position
    const sortedNodes = [...nodes]
      .filter(n => n.data.nodeType !== 'start')
      .sort((a, b) => a.position.y - b.position.y)

    sortedNodes.forEach(node => {
      const config = node.data.config || {}
      const type = node.data.nodeType

      if (type?.startsWith('move') || type?.includes('strafe')) {
        const distance = config.distance || 24
        const power = config.power || 0.5
        code += `            // ${node.data.label}\n`
        motors.forEach(m => {
          code += `            ${m.name}.setPower(${power});\n`
        })
        code += `            sleep(${Math.round((distance / 12) * 1000)});\n`
        motors.forEach(m => {
          code += `            ${m.name}.setPower(0);\n`
        })
        code += `\n`
      } else if (type?.startsWith('turn')) {
        const angle = config.angle || 90
        code += `            // ${node.data.label}\n`
        code += `            // Turn ${angle} degrees\n`
        code += `            sleep(${Math.round((angle / 90) * 500)});\n\n`
      } else if (type === 'wait') {
        const duration = config.duration || 1
        code += `            sleep(${Math.round(duration * 1000)});\n\n`
      } else if (type?.includes('claw')) {
        const servo = servos[0]?.name || 'claw'
        const position = type === 'clawOpen' ? 1.0 : 0.0
        code += `            ${servo}.setPosition(${position});\n`
        code += `            sleep(500);\n\n`
      } else if (type === 'custom') {
        code += `            // Custom code\n`
        code += `            ${config.code || '// Your code here'}\n\n`
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
          <p className="text-white">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <Navbar />

      {/* Top Toolbar */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white">{project.name}</h1>
          <p className="text-xs text-zinc-400">
            {project.template_type === 'omni-wheel' ? 'Omni-Wheel' : 'Mecanum'} Drive • FTC Autonomous
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm" variant="outline">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={exportCode} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Java Code
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <div className="w-80 bg-zinc-900/50 border-r border-zinc-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Blocks
            </h2>
            <Tabs value={activeCategory} onValueChange={(v: any) => setActiveCategory(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="movement">Move</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="control">Control</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {FTC_NODES[activeCategory].map((nodeConfig) => {
                const Icon = nodeConfig.icon
                return (
                  <Button
                    key={nodeConfig.id}
                    onClick={() => addNodeToCanvas(nodeConfig)}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 px-4 hover:border-blue-500 hover:bg-blue-500/10 transition-all"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${nodeConfig.color} flex items-center justify-center mr-3 flex-shrink-0`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">{nodeConfig.label}</span>
                  </Button>
                )
              })}
            </div>
          </ScrollArea>

          {/* Hardware Config */}
          <div className="border-t border-zinc-800 p-4 bg-zinc-900/70">
            <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
              <Settings className="h-3 w-3" />
              Hardware
            </h3>
            <div className="space-y-1 text-xs text-zinc-400">
              <p>Motors: {motors.length}</p>
              <p>Servos: {servos.length}</p>
            </div>
          </div>
        </div>

        {/* Center - Flow Canvas */}
        <div className="flex-1 relative bg-zinc-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2 }
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#333" />
            <Controls className="!bg-zinc-900/90 !border-zinc-800" />
          </ReactFlow>
        </div>

        {/* Right Sidebar - Node Configuration */}
        {selectedNode && selectedNode.data.nodeType !== 'start' && (
          <div className="w-80 bg-zinc-900/50 border-l border-zinc-800 overflow-y-auto">
            <div className="p-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white">Configure Block</CardTitle>
                  <CardDescription className="text-zinc-400">{selectedNode.data.label}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Movement nodes */}
                  {(selectedNode.data.nodeType?.startsWith('move') || selectedNode.data.nodeType?.includes('strafe')) && (
                    <>
                      <div>
                        <Label className="text-xs text-zinc-300">Distance (inches)</Label>
                        <Input
                          type="number"
                          placeholder="24"
                          value={selectedNode.data.config?.distance || ''}
                          onChange={(e) => updateNodeConfig('distance', e.target.value)}
                          className="mt-1 bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-300">Power (0-1)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          placeholder="0.5"
                          value={selectedNode.data.config?.power || ''}
                          onChange={(e) => updateNodeConfig('power', e.target.value)}
                          className="mt-1 bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </>
                  )}

                  {/* Turn nodes */}
                  {selectedNode.data.nodeType?.startsWith('turn') && (
                    <div>
                      <Label className="text-xs text-zinc-300">Angle (degrees)</Label>
                      <Input
                        type="number"
                        placeholder="90"
                        value={selectedNode.data.config?.angle || ''}
                        onChange={(e) => updateNodeConfig('angle', e.target.value)}
                        className="mt-1 bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  )}

                  {/* Wait node */}
                  {selectedNode.data.nodeType === 'wait' && (
                    <div>
                      <Label className="text-xs text-zinc-300">Duration (seconds)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="1.0"
                        value={selectedNode.data.config?.duration || ''}
                        onChange={(e) => updateNodeConfig('duration', e.target.value)}
                        className="mt-1 bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  )}

                  {/* Custom code */}
                  {selectedNode.data.nodeType === 'custom' && (
                    <div>
                      <Label className="text-xs text-zinc-300">Java Code</Label>
                      <textarea
                        value={selectedNode.data.config?.code || ''}
                        onChange={(e) => updateNodeConfig('code', e.target.value)}
                        placeholder="// Your Java code here"
                        className="w-full h-40 mt-1 p-2 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded-md text-white"
                      />
                    </div>
                  )}

                  <Button
                    onClick={deleteSelectedNode}
                    variant="destructive"
                    size="sm"
                    className="w-full mt-4"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Block
                  </Button>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="mt-4 bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white">Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-zinc-400 space-y-2">
                  <p>• Connect blocks by dragging from one to another</p>
                  <p>• Click a block to configure it</p>
                  <p>• Blocks execute from top to bottom</p>
                  <p>• Export code when done</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
