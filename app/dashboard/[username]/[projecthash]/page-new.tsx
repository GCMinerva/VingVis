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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Save,
  Play,
  Pause,
  Download,
  Settings,
  Plus,
  Maximize2,
  Minimize2,
  Activity,
  Zap,
  GitBranch,
} from "lucide-react"

import { NodeEditor, FlowNode, NodeType } from "@/components/node-editor"
import { InteractiveFieldCanvas, Waypoint } from "@/components/interactive-field-canvas"
import {
  generatePedroPathingCode,
  generateAdvancedPedroConfig,
  calculatePathStatistics,
  PedroPathingConfig
} from "@/lib/pedropathing-codegen"
import {
  generateRoadRunnerCode,
  generateRoadRunnerConfig,
  calculateTrajectoryStatistics,
  RoadRunnerConfig
} from "@/lib/roadrunner-codegen"

type Project = {
  id: string
  name: string
  template_type: 'omni-wheel' | 'mecanum-wheel'
  motor_config: any
  workflow_data: any
}

export default function AdvancedPathEditor() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isGuest, setIsGuest] = useState(false)

  // Node editor state
  const [nodes, setNodes] = useState<FlowNode[]>([{
    id: 'start',
    type: 'start',
    label: 'Start',
    x: 100,
    y: 100,
    data: {},
    connections: []
  }])
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)

  // Waypoint state
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    {
      id: 'wp-start',
      x: 72,
      y: 72,
      heading: 0,
      type: 'linear',
      maxVelocity: 50,
      maxAcceleration: 30
    }
  ])

  // Robot state
  const [robotPosition, setRobotPosition] = useState({ x: 72, y: 72, heading: 0 })

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [animationSpeed, setAnimationSpeed] = useState(1)

  // UI state
  const [viewMode, setViewMode] = useState<'split' | 'nodes' | 'field'>('split')
  const [pathMode, setPathMode] = useState<'roadrunner' | 'pedropathing'>('pedropathing')
  const [showVelocity, setShowVelocity] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [usePathBuilder, setUsePathBuilder] = useState(true)

  // Constraints
  const [pedroConstraints, setPedroConstraints] = useState({
    maxVelocity: 50,
    maxAcceleration: 30,
    maxAngularVelocity: 3.14,
    maxAngularAcceleration: 3.14
  })

  const [roadRunnerConstraints, setRoadRunnerConstraints] = useState({
    maxVel: 50,
    maxAccel: 30,
    maxAngVel: 3.14,
    maxAngAccel: 3.14,
    trackWidth: 15
  })

  const [followerConstants, setFollowerConstants] = useState({
    xMovement: 0.08,
    yMovement: 0.08,
    forwardZeroPowerAcceleration: -40,
    lateralZeroPowerAcceleration: -50,
    zeroPowerAccelerationMultiplier: 4.5
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guestMode = localStorage.getItem('guestMode') === 'true'
      setIsGuest(guestMode)
      if (!authLoading && !user && !guestMode) {
        router.push("/login")
      }
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

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('project_hash', params.projecthash)
        .single()

      if (error) throw error

      setProject(data)

      if (data.workflow_data?.waypoints) {
        setWaypoints(data.workflow_data.waypoints)
      }
      if (data.workflow_data?.nodes) {
        setNodes(data.workflow_data.nodes)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading project:', error)
      setLoading(false)
    }
  }

  const loadGuestProject = () => {
    try {
      const projects = JSON.parse(localStorage.getItem('guestProjects') || '[]')
      const proj = projects.find((p: any) => p.project_hash === params.projecthash)

      if (proj) {
        setProject(proj)
        if (proj.workflow_data?.waypoints) {
          setWaypoints(proj.workflow_data.waypoints)
        }
        if (proj.workflow_data?.nodes) {
          setNodes(proj.workflow_data.nodes)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading guest project:', error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!project) return

    setSaving(true)

    const workflowData = {
      waypoints,
      nodes,
      constraints: pathMode === 'pedropathing' ? pedroConstraints : roadRunnerConstraints,
      followerConstants: pathMode === 'pedropathing' ? followerConstants : {},
      pathMode,
      usePathBuilder
    }

    try {
      if (isGuest) {
        const projects = JSON.parse(localStorage.getItem('guestProjects') || '[]')
        const updatedProjects = projects.map((p: any) =>
          p.project_hash === params.projecthash
            ? { ...p, workflow_data: workflowData }
            : p
        )
        localStorage.setItem('guestProjects', JSON.stringify(updatedProjects))
      } else {
        const { error } = await supabase
          .from('projects')
          .update({ workflow_data: workflowData })
          .eq('project_hash', params.projecthash)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setSaving(false)
    }
  }

  const exportCode = () => {
    if (!project || waypoints.length === 0) return

    let code = ''
    let filename = ''

    if (pathMode === 'pedropathing') {
      const config: PedroPathingConfig = {
        projectName: project.name,
        waypoints,
        usePathBuilder,
        constraints: pedroConstraints,
        followerConstants
      }
      code = generatePedroPathingCode(config)
      filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '')}Pedro.java`
    } else {
      const config: RoadRunnerConfig = {
        projectName: project.name,
        waypoints,
        driveClass: project.template_type === 'mecanum-wheel' ? 'SampleMecanumDrive' : 'SampleTankDrive',
        constraints: roadRunnerConstraints,
        useAdvancedTrajectories: true
      }
      code = generateRoadRunnerCode(config)
      filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '')}RR.java`
    }

    // Download file
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportConfig = () => {
    let code = ''
    let filename = ''

    if (pathMode === 'pedropathing') {
      code = generateAdvancedPedroConfig()
      filename = 'PedroPathingConfig.java'
    } else {
      code = generateRoadRunnerConfig(roadRunnerConstraints)
      filename = 'DriveConstants.java'
    }

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const addWaypoint = () => {
    const lastWaypoint = waypoints[waypoints.length - 1]
    const newWaypoint: Waypoint = {
      id: `wp-${Date.now()}`,
      x: lastWaypoint ? lastWaypoint.x + 24 : 72,
      y: lastWaypoint ? lastWaypoint.y : 72,
      heading: lastWaypoint ? lastWaypoint.heading : 0,
      type: 'linear',
      maxVelocity: 50,
      maxAcceleration: 30
    }
    setWaypoints([...waypoints, newWaypoint])
  }

  const startAnimation = () => {
    setIsAnimating(true)
    setAnimationProgress(0)
  }

  const stopAnimation = () => {
    setIsAnimating(false)
  }

  useEffect(() => {
    if (!isAnimating) return

    const interval = setInterval(() => {
      setAnimationProgress(prev => {
        const next = prev + 0.01 * animationSpeed
        if (next >= 1) {
          setIsAnimating(false)
          return 1
        }
        return next
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isAnimating, animationSpeed])

  const pathStats = pathMode === 'pedropathing'
    ? calculatePathStatistics(waypoints)
    : calculateTrajectoryStatistics(waypoints)

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
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      <Navbar />

      {/* Toolbar */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-white">{project.name}</h1>
          <div className="flex items-center gap-1">
            {!isAnimating ? (
              <Button onClick={startAnimation} size="sm" variant="default" disabled={waypoints.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Animate
              </Button>
            ) : (
              <Button onClick={stopAnimation} size="sm" variant="destructive">
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-400 ml-2">
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
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === 'split' ? 'default' : 'outline'}
              onClick={() => setViewMode('split')}
            >
              <GitBranch className="h-4 w-4 mr-1" /> Split
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'nodes' ? 'default' : 'outline'}
              onClick={() => setViewMode('nodes')}
            >
              <Activity className="h-4 w-4 mr-1" /> Nodes
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'field' ? 'default' : 'outline'}
              onClick={() => setViewMode('field')}
            >
              <Maximize2 className="h-4 w-4 mr-1" /> Field
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <Select value={pathMode} onValueChange={(v: any) => setPathMode(v)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roadrunner">RoadRunner</SelectItem>
              <SelectItem value="pedropathing">PedroPathing</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSave} disabled={saving} size="sm" variant="ghost">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={exportCode} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Code
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Configuration */}
        <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Path Configuration</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-300">Show Velocity</Label>
                    <Switch checked={showVelocity} onCheckedChange={setShowVelocity} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-300">Show Grid</Label>
                    <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                  </div>
                  {pathMode === 'pedropathing' && (
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-300">Use PathBuilder</Label>
                      <Switch checked={usePathBuilder} onCheckedChange={setUsePathBuilder} />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-white mb-3">
                  {pathMode === 'pedropathing' ? 'PedroPathing' : 'RoadRunner'} Constraints
                </h3>
                {pathMode === 'pedropathing' ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-300">Max Velocity (in/s)</Label>
                      <Input
                        type="number"
                        value={pedroConstraints.maxVelocity}
                        onChange={(e) => setPedroConstraints(prev => ({ ...prev, maxVelocity: Number(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Max Acceleration (in/s²)</Label>
                      <Input
                        type="number"
                        value={pedroConstraints.maxAcceleration}
                        onChange={(e) => setPedroConstraints(prev => ({ ...prev, maxAcceleration: Number(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Max Angular Velocity (rad/s)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={pedroConstraints.maxAngularVelocity}
                        onChange={(e) => setPedroConstraints(prev => ({ ...prev, maxAngularVelocity: Number(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-300">Max Velocity (in/s)</Label>
                      <Input
                        type="number"
                        value={roadRunnerConstraints.maxVel}
                        onChange={(e) => setRoadRunnerConstraints(prev => ({ ...prev, maxVel: Number(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Max Acceleration (in/s²)</Label>
                      <Input
                        type="number"
                        value={roadRunnerConstraints.maxAccel}
                        onChange={(e) => setRoadRunnerConstraints(prev => ({ ...prev, maxAccel: Number(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Track Width (in)</Label>
                      <Input
                        type="number"
                        value={roadRunnerConstraints.trackWidth}
                        onChange={(e) => setRoadRunnerConstraints(prev => ({ ...prev, trackWidth: Number(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Path Statistics</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Distance:</span>
                    <span className="text-white font-mono">{pathStats.totalDistance.toFixed(2)}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Time:</span>
                    <span className="text-white font-mono">{('totalTime' in pathStats ? pathStats.totalTime : pathStats.estimatedTime).toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Velocity:</span>
                    <span className="text-white font-mono">{pathStats.maxVelocity.toFixed(2)} in/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Waypoints:</span>
                    <span className="text-white font-mono">{waypoints.length}</span>
                  </div>
                  {'numberOfSegments' in pathStats && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Segments:</span>
                      <span className="text-white font-mono">{pathStats.numberOfSegments}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <Button onClick={addWaypoint} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Waypoint
                </Button>
                <Button onClick={exportConfig} size="sm" variant="outline" className="w-full mt-2">
                  <Settings className="h-4 w-4 mr-2" />
                  Export Config
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Center: Editor Views */}
        <div className="flex-1 flex overflow-hidden">
          {(viewMode === 'split' || viewMode === 'nodes') && (
            <div className={viewMode === 'split' ? 'flex-1' : 'w-full'}>
              <NodeEditor
                nodes={nodes}
                onNodesChange={setNodes}
                selectedNodeId={selectedNode?.id}
                onNodeSelect={setSelectedNode}
              />
            </div>
          )}

          {viewMode === 'split' && <div className="w-px bg-slate-700" />}

          {(viewMode === 'split' || viewMode === 'field') && (
            <div className={`${viewMode === 'split' ? 'flex-1' : 'w-full'} flex items-center justify-center p-4`}>
              <InteractiveFieldCanvas
                waypoints={waypoints}
                onWaypointsChange={setWaypoints}
                robotPosition={robotPosition}
                onRobotPositionChange={setRobotPosition}
                animationProgress={animationProgress}
                showVelocity={showVelocity}
                showGrid={showGrid}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar: Selected Node/Waypoint Config */}
        {selectedNode && (
          <div className="w-64 bg-slate-900 border-l border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Node Configuration</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-300">Node Type</Label>
                <p className="text-sm text-white">{selectedNode.type}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-300">Label</Label>
                <Input
                  value={selectedNode.label}
                  onChange={(e) => {
                    const updated = nodes.map(n =>
                      n.id === selectedNode.id ? { ...n, label: e.target.value } : n
                    )
                    setNodes(updated)
                    setSelectedNode({ ...selectedNode, label: e.target.value })
                  }}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
