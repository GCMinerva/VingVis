"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  Play,
  Plus,
  Download,
  Settings,
  Navigation,
  RotateCw,
  Timer,
  Zap,
  Code,
} from "lucide-react"
import Link from "next/link"

type Project = {
  id: string
  name: string
  template_type: 'omni-wheel' | 'mecanum-wheel'
  motor_config: any
  workflow_data: any
}

// Node types for different robot actions
const nodeTypes = {
  start: { label: 'Start', icon: Play, color: 'bg-green-500' },
  move: { label: 'Move', icon: Navigation, color: 'bg-blue-500' },
  turn: { label: 'Turn', icon: RotateCw, color: 'bg-purple-500' },
  wait: { label: 'Wait', icon: Timer, color: 'bg-yellow-500' },
  action: { label: 'Action', icon: Zap, color: 'bg-orange-500' },
  custom: { label: 'Custom Code', icon: Code, color: 'bg-gray-500' },
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 25 },
    style: { background: '#22c55e', color: 'white', border: '2px solid #16a34a', borderRadius: '8px', padding: '10px' },
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
  const [nodeConfig, setNodeConfig] = useState<any>({})
  const [showAddNode, setShowAddNode] = useState(false)
  const [newNodeType, setNewNodeType] = useState<keyof typeof nodeTypes>('move')

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

          // Load saved workflow if exists
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

      // Load saved workflow if exists
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
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleSave = async () => {
    if (!project) return

    try {
      setSaving(true)

      if (isGuest) {
        // Save to localStorage for guest
        const guestProjects = localStorage.getItem('guestProjects')
        if (guestProjects) {
          const projects = JSON.parse(guestProjects)
          const updatedProjects = projects.map((p: any) => {
            if (p.project_hash === project.id || p.project_hash === params.projecthash) {
              return {
                ...p,
                workflow_data: {
                  nodes,
                  edges,
                },
                updated_at: new Date().toISOString(),
              }
            }
            return p
          })
          localStorage.setItem('guestProjects', JSON.stringify(updatedProjects))
          alert('Project saved successfully!')
        }
      } else {
        const { error } = await supabase
          .from('projects')
          .update({
            workflow_data: {
              nodes,
              edges,
            },
          })
          .eq('id', project.id)

        if (error) throw error
        alert('Project saved successfully!')
      }
    } catch (err: any) {
      alert('Failed to save project: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const addNode = () => {
    const nodeInfo = nodeTypes[newNodeType]
    const newNode: Node = {
      id: `${Date.now()}`,
      type: newNodeType === 'start' ? 'input' : 'default',
      data: {
        label: nodeInfo.label,
        config: {},
      },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100
      },
      style: {
        background: nodeInfo.color.replace('bg-', '#'),
        color: 'white',
        border: '2px solid rgba(255,255,255,0.3)',
        borderRadius: '8px',
        padding: '10px',
      },
    }
    setNodes((nds) => [...nds, newNode])
    setShowAddNode(false)
  }

  const handleExportCode = () => {
    if (!project) return

    // Generate Java code for FTC
    let code = `package org.firstinspires.ftc.teamcode;\n\n`
    code += `import com.qualcomm.robotcore.eventloop.opmode.Autonomous;\n`
    code += `import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;\n`
    code += `import com.qualcomm.robotcore.hardware.DcMotor;\n\n`
    code += `@Autonomous(name = "${project.name}")\n`
    code += `public class ${project.name.replace(/\s+/g, '')} extends LinearOpMode {\n\n`

    // Declare motors
    const motorConfig = project.motor_config || {}
    code += `    // Motor declarations\n`
    code += `    private DcMotor ${motorConfig.fl || 'frontLeft'};\n`
    code += `    private DcMotor ${motorConfig.fr || 'frontRight'};\n`
    code += `    private DcMotor ${motorConfig.bl || 'backLeft'};\n`
    code += `    private DcMotor ${motorConfig.br || 'backRight'};\n\n`

    code += `    @Override\n`
    code += `    public void runOpMode() {\n`
    code += `        // Initialize motors\n`
    code += `        ${motorConfig.fl || 'frontLeft'} = hardwareMap.get(DcMotor.class, "${motorConfig.fl || 'frontLeft'}");\n`
    code += `        ${motorConfig.fr || 'frontRight'} = hardwareMap.get(DcMotor.class, "${motorConfig.fr || 'frontRight'}");\n`
    code += `        ${motorConfig.bl || 'backLeft'} = hardwareMap.get(DcMotor.class, "${motorConfig.bl || 'backLeft'}");\n`
    code += `        ${motorConfig.br || 'backRight'} = hardwareMap.get(DcMotor.class, "${motorConfig.br || 'backRight'}");\n\n`

    code += `        // Set motor directions\n`
    if (project.template_type === 'mecanum-wheel') {
      code += `        ${motorConfig.fl || 'frontLeft'}.setDirection(DcMotor.Direction.FORWARD);\n`
      code += `        ${motorConfig.fr || 'frontRight'}.setDirection(DcMotor.Direction.REVERSE);\n`
      code += `        ${motorConfig.bl || 'backLeft'}.setDirection(DcMotor.Direction.FORWARD);\n`
      code += `        ${motorConfig.br || 'backRight'}.setDirection(DcMotor.Direction.REVERSE);\n\n`
    } else {
      code += `        ${motorConfig.fl || 'frontLeft'}.setDirection(DcMotor.Direction.FORWARD);\n`
      code += `        ${motorConfig.fr || 'frontRight'}.setDirection(DcMotor.Direction.REVERSE);\n`
      code += `        ${motorConfig.bl || 'backLeft'}.setDirection(DcMotor.Direction.FORWARD);\n`
      code += `        ${motorConfig.br || 'backRight'}.setDirection(DcMotor.Direction.REVERSE);\n\n`
    }

    code += `        waitForStart();\n\n`
    code += `        if (opModeIsActive()) {\n`

    // Generate code from nodes
    nodes.forEach((node, index) => {
      if (node.type === 'input') return // Skip start node

      const label = node.data.label as string
      const config = node.data.config || {}

      code += `            // Step ${index}: ${label}\n`

      if (label === 'Move') {
        const power = config.power || 0.5
        const duration = config.duration || 1000
        code += `            ${motorConfig.fl || 'frontLeft'}.setPower(${power});\n`
        code += `            ${motorConfig.fr || 'frontRight'}.setPower(${power});\n`
        code += `            ${motorConfig.bl || 'backLeft'}.setPower(${power});\n`
        code += `            ${motorConfig.br || 'backRight'}.setPower(${power});\n`
        code += `            sleep(${duration});\n`
        code += `            ${motorConfig.fl || 'frontLeft'}.setPower(0);\n`
        code += `            ${motorConfig.fr || 'frontRight'}.setPower(0);\n`
        code += `            ${motorConfig.bl || 'backLeft'}.setPower(0);\n`
        code += `            ${motorConfig.br || 'backRight'}.setPower(0);\n\n`
      } else if (label === 'Turn') {
        const power = config.power || 0.5
        const duration = config.duration || 1000
        code += `            ${motorConfig.fl || 'frontLeft'}.setPower(${power});\n`
        code += `            ${motorConfig.fr || 'frontRight'}.setPower(-${power});\n`
        code += `            ${motorConfig.bl || 'backLeft'}.setPower(${power});\n`
        code += `            ${motorConfig.br || 'backRight'}.setPower(-${power});\n`
        code += `            sleep(${duration});\n`
        code += `            ${motorConfig.fl || 'frontLeft'}.setPower(0);\n`
        code += `            ${motorConfig.fr || 'frontRight'}.setPower(0);\n`
        code += `            ${motorConfig.bl || 'backLeft'}.setPower(0);\n`
        code += `            ${motorConfig.br || 'backRight'}.setPower(0);\n\n`
      } else if (label === 'Wait') {
        const duration = config.duration || 1000
        code += `            sleep(${duration});\n\n`
      } else if (label === 'Custom Code') {
        const customCode = config.code || '// Add your custom code here'
        code += `            ${customCode}\n\n`
      }
    })

    code += `        }\n`
    code += `    }\n`
    code += `}\n`

    // Download the code
    const blob = new Blob([code], { type: 'text/java' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '')}.java`
    a.click()
  }

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setNodeConfig(node.data.config || {})
  }, [])

  const updateNodeConfig = (key: string, value: any) => {
    setNodeConfig({ ...nodeConfig, [key]: value })
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: { ...node.data, config: { ...nodeConfig, [key]: value } } }
            : node
        )
      )
    }
  }

  if (authLoading || (loading && !isGuest) || !project) {
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
    <div className="h-screen bg-black flex flex-col">
      <Navbar />
      {/* Top Bar */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">{project.name}</h1>
            <p className="text-xs text-muted-foreground">
              {project.template_type === 'omni-wheel' ? '4 Omni-Wheel Drive' : '4 Mecanum-Wheel Drive'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="default" size="sm" onClick={handleExportCode}>
            <Download className="h-4 w-4 mr-2" />
            Export Code
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          className="bg-black"
        >
          <Controls />
          <MiniMap />
          <Background color="#333" gap={16} />

          {/* Left Panel - Node Palette */}
          <Panel position="top-left" className="bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 p-4 m-4">
            <h3 className="text-sm font-semibold text-white mb-3">Add Nodes</h3>
            <div className="space-y-2">
              {Object.entries(nodeTypes).map(([key, { label, icon: Icon, color }]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setNewNodeType(key as keyof typeof nodeTypes)
                    addNode()
                  }}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </Panel>

          {/* Right Panel - Node Configuration */}
          {selectedNode && (
            <Panel position="top-right" className="bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 p-4 m-4 w-64">
              <h3 className="text-sm font-semibold text-white mb-3">Node Configuration</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Node Type</Label>
                  <p className="text-sm font-medium text-white">{selectedNode.data.label}</p>
                </div>

                {selectedNode.data.label === 'Move' && (
                  <>
                    <div>
                      <Label htmlFor="power" className="text-xs">Power (0-1)</Label>
                      <Input
                        id="power"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={nodeConfig.power || 0.5}
                        onChange={(e) => updateNodeConfig('power', parseFloat(e.target.value))}
                        className="bg-background/50 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration" className="text-xs">Duration (ms)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={nodeConfig.duration || 1000}
                        onChange={(e) => updateNodeConfig('duration', parseInt(e.target.value))}
                        className="bg-background/50 mt-1"
                      />
                    </div>
                  </>
                )}

                {selectedNode.data.label === 'Turn' && (
                  <>
                    <div>
                      <Label htmlFor="power" className="text-xs">Power (0-1)</Label>
                      <Input
                        id="power"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={nodeConfig.power || 0.5}
                        onChange={(e) => updateNodeConfig('power', parseFloat(e.target.value))}
                        className="bg-background/50 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration" className="text-xs">Duration (ms)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={nodeConfig.duration || 1000}
                        onChange={(e) => updateNodeConfig('duration', parseInt(e.target.value))}
                        className="bg-background/50 mt-1"
                      />
                    </div>
                  </>
                )}

                {selectedNode.data.label === 'Wait' && (
                  <div>
                    <Label htmlFor="duration" className="text-xs">Duration (ms)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={nodeConfig.duration || 1000}
                      onChange={(e) => updateNodeConfig('duration', parseInt(e.target.value))}
                      className="bg-background/50 mt-1"
                    />
                  </div>
                )}

                {selectedNode.data.label === 'Custom Code' && (
                  <div>
                    <Label htmlFor="code" className="text-xs">Custom Code</Label>
                    <textarea
                      id="code"
                      value={nodeConfig.code || ''}
                      onChange={(e) => updateNodeConfig('code', e.target.value)}
                      className="bg-background/50 mt-1 w-full h-32 rounded-md border border-border px-3 py-2 text-sm text-white"
                      placeholder="// Add your custom code here"
                    />
                  </div>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => {
                    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
                    setSelectedNode(null)
                  }}
                >
                  Delete Node
                </Button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  )
}
