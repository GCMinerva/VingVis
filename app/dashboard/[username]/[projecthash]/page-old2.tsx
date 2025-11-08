"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { HardwareConfigPanel, HardwareConfig } from "@/components/hardware-config-panel"
import { FieldPreview } from "@/components/field-preview"
import { CustomNode, StartNode, nodeStyles } from "@/components/custom-nodes"
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MiniMap,
  Panel,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Save,
  Play,
  Download,
  Navigation,
  RotateCw,
  Timer,
  Zap,
  Code,
  Variable,
  Layers
} from "lucide-react"

type Project = {
  id: string
  name: string
  template_type: 'omni-wheel' | 'mecanum-wheel'
  motor_config: any
  workflow_data: any
  hardware_config?: HardwareConfig
}

const nodeTypesConfig = {
  start: { label: 'Start', icon: Play },
  move: { label: 'Move Forward', icon: Navigation, description: 'Move robot forward/backward' },
  turn: { label: 'Turn', icon: RotateCw, description: 'Rotate robot left/right' },
  wait: { label: 'Wait', icon: Timer, description: 'Pause execution' },
  action: { label: 'Action', icon: Zap, description: 'Execute servo/mechanism action' },
  variable: { label: 'Set Variable', icon: Variable, description: 'Store a value' },
  custom: { label: 'Custom Code', icon: Code, description: 'Write custom Java code' },
}

const customNodeTypes = {
  default: CustomNode,
  start: StartNode,
}

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'start',
    data: { label: 'Start', type: 'start' },
    position: { x: 250, y: 50 },
    draggable: true,
  },
]

export default function ProjectEditorPage() {
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
  const [robotPosition, setRobotPosition] = useState({ x: 72, y: 72, heading: 0 })
  const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig>({
    motors: [],
    servos: [],
    i2cDevices: []
  })

  // Load initial hardware config from project motor_config
  useEffect(() => {
    if (project?.motor_config) {
      const motors = Object.entries(project.motor_config).map(([key, name], index) => ({
        id: key,
        name: String(name),
        port: index,
        direction: 'FORWARD' as const,
        type: 'DC_MOTOR' as const
      }))
      setHardwareConfig(prev => ({ ...prev, motors }))
    }

    if (project?.hardware_config) {
      setHardwareConfig(project.hardware_config)
    }
  }, [project])

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
                hardware_config: hardwareConfig,
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
            hardware_config: hardwareConfig,
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

  const addNode = (type: keyof typeof nodeTypesConfig) => {
    const config = nodeTypesConfig[type]
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: type === 'start' ? 'start' : 'default',
      data: {
        label: config.label,
        description: config.description,
        type: type,
        config: {}
      },
      position: {
        x: Math.random() * 300 + 200,
        y: Math.random() * 300 + 200
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
  }

  const deleteSelectedNode = () => {
    if (!selectedNode || selectedNode.type === 'start') return
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
    setSelectedNode(null)
  }

  const generateCode = () => {
    let code = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.Servo;
import com.qualcomm.robotcore.hardware.IMU;

@Autonomous(name = "${project?.name || 'Auto'}", group = "Auto")
public class ${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')} extends LinearOpMode {

    // Hardware Configuration
`

    // Add motor declarations
    hardwareConfig.motors.forEach(motor => {
      code += `    private DcMotor ${motor.name};\n`
    })

    // Add servo declarations
    hardwareConfig.servos.forEach(servo => {
      code += `    private Servo ${servo.name};\n`
    })

    // Add I2C device declarations
    hardwareConfig.i2cDevices.forEach(device => {
      if (device.type === 'IMU') {
        code += `    private IMU ${device.name};\n`
      } else {
        code += `    // ${device.type}: ${device.name}\n`
      }
    })

    code += `
    @Override
    public void runOpMode() {
        // Initialize hardware
`

    // Initialize motors
    hardwareConfig.motors.forEach(motor => {
      code += `        ${motor.name} = hardwareMap.get(DcMotor.class, "${motor.name}");
        ${motor.name}.setDirection(DcMotor.Direction.${motor.direction});
        ${motor.name}.setMode(DcMotor.RunMode.RUN_WITHOUT_ENCODER);
`
    })

    // Initialize servos
    hardwareConfig.servos.forEach(servo => {
      code += `        ${servo.name} = hardwareMap.get(Servo.class, "${servo.name}");
`
    })

    code += `
        telemetry.addData("Status", "Initialized");
        telemetry.update();

        waitForStart();

        if (opModeIsActive()) {
`

    // Generate code for each node in order
    // Sort nodes by connection order (simple approach: vertical position)
    const sortedNodes = [...nodes]
      .filter(n => n.type !== 'start')
      .sort((a, b) => a.position.y - b.position.y)

    sortedNodes.forEach(node => {
      const config = node.data.config || {}

      switch (node.data.type) {
        case 'move':
          const motorNames = hardwareConfig.motors.map(m => m.name).join(', ')
          code += `            // ${node.data.label}
            ${motorNames ? motorNames + '.setPower(' + (config.power || 0.5) + ');' : ''}
            sleep(${Math.round((parseFloat(config.distance || 24) / 12) * 1000)}); // Approximate timing
            ${motorNames ? motorNames + '.setPower(0);' : ''}
`
          break

        case 'turn':
          const direction = config.direction === 'right' ? 1 : -1
          const motor0 = hardwareConfig.motors[0]?.name || 'motorFL'
          const motor1 = hardwareConfig.motors[1]?.name || 'motorFR'
          code += `            // ${node.data.label}
            // Turn ${config.direction || 'left'} ${config.angle || 90} degrees
            ${motor0}.setPower(${direction * 0.5});
            ${motor1}.setPower(${-direction * 0.5});
            sleep(${Math.round((parseFloat(config.angle || 90) / 90) * 500)}); // Approximate timing
            ${hardwareConfig.motors.map(m => m.name).join(', ')}.setPower(0);
`
          break

        case 'wait':
          code += `            // ${node.data.label}
            sleep(${Math.round(parseFloat(config.duration || 1) * 1000)});
`
          break

        case 'action':
          code += `            // ${node.data.label}
            ${config.device || 'servo'}.setPosition(${config.position || 0.5});
            sleep(500);
`
          break

        case 'variable':
          code += `            // ${node.data.label}
            // Set variable: ${config.name || 'variable'} = ${config.value || 0}
`
          break

        case 'custom':
          code += `            // Custom code
            ${config.code || '// Add your code here'}
`
          break
      }
    })

    code += `
            telemetry.addData("Status", "Complete");
            telemetry.update();
        }
    }
}
`

    // Download the code
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

  if (authLoading || (loading && !isGuest) || !project) {
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
    <div className="h-screen bg-black flex flex-col">
      <Navbar />

      {/* Top Toolbar */}
      <div className="bg-background/95 border-b border-border/50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-white">{project.name}</h1>
            <p className="text-xs text-muted-foreground">
              {project.template_type === 'omni-wheel' ? '4 Omni-Wheel' : '4 Mecanum-Wheel'} Drive
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={generateCode} variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Code
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Hardware Config */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full p-3 bg-background/50 overflow-y-auto">
              <HardwareConfigPanel config={hardwareConfig} onChange={setHardwareConfig} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel - Flow Canvas */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full bg-zinc-950 relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={customNodeTypes}
                fitView
                className="bg-zinc-950"
                defaultEdgeOptions={{
                  animated: true,
                  style: { stroke: '#3b82f6', strokeWidth: 2 }
                }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
                <Controls className="bg-background/90 border border-border/50" />
                <MiniMap className="bg-background/90 border border-border/50" nodeColor="#3b82f6" />

                {/* Node Palette */}
                <Panel position="top-left" className="m-4">
                  <Card className="w-64 bg-background/95 backdrop-blur-sm border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-blue-400" />
                        <CardTitle className="text-sm">Add Nodes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      {Object.entries(nodeTypesConfig).filter(([key]) => key !== 'start').map(([key, config]) => {
                        const Icon = config.icon
                        return (
                          <Button
                            key={key}
                            onClick={() => addNode(key as keyof typeof nodeTypesConfig)}
                            variant="outline"
                            size="sm"
                            className="h-auto py-2 flex-col gap-1 hover:bg-blue-500/10 hover:border-blue-500/50"
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-xs">{config.label}</span>
                          </Button>
                        )
                      })}
                    </CardContent>
                  </Card>
                </Panel>

                {/* Node Configuration Panel */}
                {selectedNode && selectedNode.type !== 'start' && (
                  <Panel position="top-right" className="m-4">
                    <Card className="w-72 bg-background/95 backdrop-blur-sm border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Configure: {selectedNode.data.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedNode.data.type === 'move' && (
                          <>
                            <div>
                              <Label className="text-xs">Distance (inches)</Label>
                              <Input
                                type="number"
                                placeholder="24"
                                value={selectedNode.data.config?.distance || ''}
                                onChange={(e) => updateNodeConfig('distance', e.target.value)}
                                className="h-8 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Power (0-1)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="1"
                                placeholder="0.5"
                                value={selectedNode.data.config?.power || ''}
                                onChange={(e) => updateNodeConfig('power', e.target.value)}
                                className="h-8 mt-1"
                              />
                            </div>
                          </>
                        )}

                        {selectedNode.data.type === 'turn' && (
                          <>
                            <div>
                              <Label className="text-xs">Angle (degrees)</Label>
                              <Input
                                type="number"
                                placeholder="90"
                                value={selectedNode.data.config?.angle || ''}
                                onChange={(e) => updateNodeConfig('angle', e.target.value)}
                                className="h-8 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Direction</Label>
                              <Select
                                value={selectedNode.data.config?.direction || 'left'}
                                onValueChange={(value) => updateNodeConfig('direction', value)}
                              >
                                <SelectTrigger className="h-8 mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Left</SelectItem>
                                  <SelectItem value="right">Right</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        {selectedNode.data.type === 'wait' && (
                          <div>
                            <Label className="text-xs">Duration (seconds)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="1.0"
                              value={selectedNode.data.config?.duration || ''}
                              onChange={(e) => updateNodeConfig('duration', e.target.value)}
                              className="h-8 mt-1"
                            />
                          </div>
                        )}

                        {selectedNode.data.type === 'action' && (
                          <>
                            <div>
                              <Label className="text-xs">Servo/Motor</Label>
                              <Select
                                value={selectedNode.data.config?.device || ''}
                                onValueChange={(value) => updateNodeConfig('device', value)}
                              >
                                <SelectTrigger className="h-8 mt-1">
                                  <SelectValue placeholder="Select device" />
                                </SelectTrigger>
                                <SelectContent>
                                  {hardwareConfig.servos.map(servo => (
                                    <SelectItem key={servo.id} value={servo.name}>{servo.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Position</Label>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0.5"
                                value={selectedNode.data.config?.position || ''}
                                onChange={(e) => updateNodeConfig('position', e.target.value)}
                                className="h-8 mt-1"
                              />
                            </div>
                          </>
                        )}

                        {selectedNode.data.type === 'custom' && (
                          <div>
                            <Label className="text-xs">Java Code</Label>
                            <textarea
                              value={selectedNode.data.config?.code || ''}
                              onChange={(e) => updateNodeConfig('code', e.target.value)}
                              placeholder="// Your code here"
                              className="w-full h-32 mt-1 p-2 text-xs font-mono bg-background border border-border rounded-md"
                            />
                          </div>
                        )}

                        <Button
                          onClick={deleteSelectedNode}
                          variant="destructive"
                          size="sm"
                          className="w-full mt-4"
                        >
                          Delete Node
                        </Button>
                      </CardContent>
                    </Card>
                  </Panel>
                )}
              </ReactFlow>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Field Preview */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <div className="h-full p-3 bg-background/50 overflow-y-auto">
              <FieldPreview robotPosition={robotPosition} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
