"use client"

import { useCallback, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  BackgroundVariant,
  Panel,
  NodeMouseHandler,
} from "reactflow"
import "reactflow/dist/style.css"
import { Play, Square, RotateCcw, PanelRightClose, PanelRight, Repeat, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { geist } from "@/lib/fonts"
import { motion, AnimatePresence } from "framer-motion"
import NodePalette from "./node-palette"
import FieldVisualization from "./field-visualization"
import FieldWithPathEditor from "./field-with-path-editor"
import NodeSettingsPanel from "./node-settings-panel"
import { nodeTypes } from "./node-types"

type Project = {
  id: string
  name: string
  createdAt: Date
  lastModified: Date
}

const initialNodes = [
  {
    id: "1",
    type: "startNode",
    data: { label: "Start" },
    position: { x: 50, y: 100 },
  },
]

export default function Playground({ project }: { project: Project }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isRunning, setIsRunning] = useState(false)
  const [robotPosition, setRobotPosition] = useState({ x: 72, y: 72 })
  const [robotAngle, setRobotAngle] = useState(0)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [fieldVisible, setFieldVisible] = useState(true)
  const [loopMode, setLoopMode] = useState(false)
  const [shouldContinueLoop, setShouldContinueLoop] = useState(false)

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  const handleUpdateNode = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: newData }
        }
        return node
      }),
    )
  }

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
  }

  const executeFlow = useCallback(async () => {
    // Find the start node
    const startNode = nodes.find((n) => n.type === "startNode")
    if (!startNode) {
      setIsRunning(false)
      setShouldContinueLoop(false)
      return
    }

    // Build execution order by traversing the graph
    const executionOrder = []
    let currentNodeId = startNode.id

    while (currentNodeId) {
      const node = nodes.find((n) => n.id === currentNodeId)
      if (!node) break

      executionOrder.push(node)

      // Check if this is a stop node - if so, break
      if (node.type === "stopNode") break

      // Find the next node
      const outgoingEdge = edges.find((e) => e.source === currentNodeId)
      currentNodeId = outgoingEdge?.target || ""
    }

    let currentPosition = { x: 72, y: 72 }
    let currentAngle = 0

    setRobotPosition(currentPosition)
    setRobotAngle(currentAngle)

    // Execute each node sequentially
    for (const node of executionOrder) {
      if (node.type === "moveNode") {
        if (node.data.usePosition) {
          // Move to specific position
          const targetX = node.data.targetX || 72
          const targetY = node.data.targetY || 72
          currentPosition = { x: Math.max(9, Math.min(135, targetX)), y: Math.max(9, Math.min(135, targetY)) }
          setRobotPosition(currentPosition)
          await new Promise((resolve) => setTimeout(resolve, 1500))
        } else {
          // Move based on movement type (mecanum wheel capabilities)
          const distance = node.data.distance || 24
          const moveType = node.data.moveType || "forward"
          const radians = (currentAngle * Math.PI) / 180

          let newX = currentPosition.x
          let newY = currentPosition.y

          switch (moveType) {
            case "forward":
              newX = currentPosition.x + distance * Math.cos(radians)
              newY = currentPosition.y + distance * Math.sin(radians)
              break
            case "backward":
              newX = currentPosition.x - distance * Math.cos(radians)
              newY = currentPosition.y - distance * Math.sin(radians)
              break
            case "strafe-left":
              // Strafe perpendicular to current angle (90 degrees counterclockwise)
              newX = currentPosition.x + distance * Math.cos(radians + Math.PI / 2)
              newY = currentPosition.y + distance * Math.sin(radians + Math.PI / 2)
              break
            case "strafe-right":
              // Strafe perpendicular to current angle (90 degrees clockwise)
              newX = currentPosition.x + distance * Math.cos(radians - Math.PI / 2)
              newY = currentPosition.y + distance * Math.sin(radians - Math.PI / 2)
              break
          }

          currentPosition = { x: Math.max(9, Math.min(135, newX)), y: Math.max(9, Math.min(135, newY)) }
          setRobotPosition(currentPosition)
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } else if (node.type === "turnNode") {
        const degrees = node.data.degrees || 90
        const direction = node.data.direction === "left" ? -1 : 1
        currentAngle = (currentAngle + degrees * direction) % 360
        setRobotAngle(currentAngle)
        await new Promise((resolve) => setTimeout(resolve, 500))
      } else if (node.type === "pathFollowNode") {
        // Follow path through waypoints
        const waypoints = node.data.waypoints || [[24, 0], [48, 0], [72, 0]]
        for (const waypoint of waypoints) {
          const [relativeX, relativeY] = waypoint
          const newX = currentPosition.x + relativeX
          const newY = currentPosition.y + relativeY
          currentPosition = { x: Math.max(9, Math.min(135, newX)), y: Math.max(9, Math.min(135, newY)) }
          setRobotPosition(currentPosition)
          await new Promise((resolve) => setTimeout(resolve, 800))
        }
      } else if (node.type === "waitNode") {
        const duration = node.data.duration || 1000
        await new Promise((resolve) => setTimeout(resolve, duration))
      }
    }

    // If loop mode and should continue, wait a bit then run again
    if (shouldContinueLoop) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      executeFlow()
    } else {
      setIsRunning(false)
      setShouldContinueLoop(false)
    }
  }, [nodes, edges, shouldContinueLoop])

  const handleRun = () => {
    setIsRunning(true)
    setShouldContinueLoop(loopMode)
    executeFlow()
  }

  const handleStop = () => {
    setIsRunning(false)
    setShouldContinueLoop(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setShouldContinueLoop(false)
    setRobotPosition({ x: 72, y: 72 })
    setRobotAngle(0)
  }

  return (
    <div className="flex h-full w-full">
      {/* React Flow Canvas */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-zinc-950 to-black px-6 py-4">
          <div>
            <h2 className={cn("text-lg font-semibold text-white", geist.className)}>{project.name}</h2>
            <p className="text-xs text-zinc-500">Flow Builder</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Loop Mode Toggle */}
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <button
                onClick={() => setLoopMode(false)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold transition-all",
                  !loopMode
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Once
              </button>
              <button
                onClick={() => setLoopMode(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold transition-all",
                  loopMode
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Repeat className="h-3.5 w-3.5" />
                Loop
              </button>
            </div>

            {/* Run/Stop Button */}
            {!isRunning ? (
              <button
                onClick={handleRun}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#e78a53] to-[#f0a36f] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#e78a53]/20 transition-all hover:shadow-[#e78a53]/30"
              >
                <Play className="h-4 w-4" />
                Run
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-500"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <button
              onClick={() => setFieldVisible(!fieldVisible)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {fieldVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
              Field
            </button>
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-black"
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(255, 255, 255, 0.1)"
              className="bg-black"
            />
            <Controls className="rounded-lg border border-white/10 bg-black/80 [&>button]:border-white/10 [&>button]:bg-white/5 [&>button]:text-white hover:[&>button]:bg-white/10" />
            <MiniMap
              className="rounded-lg border border-white/10 bg-black/80"
              nodeColor="#e78a53"
              maskColor="rgba(0, 0, 0, 0.6)"
            />
            <Panel position="top-left" className="m-4">
              <NodePalette setNodes={setNodes} />
            </Panel>
          </ReactFlow>

          {/* Node Settings Panel */}
          {selectedNode && (
            <NodeSettingsPanel
              selectedNode={selectedNode}
              onClose={() => setSelectedNode(null)}
              onUpdate={handleUpdateNode}
              onDelete={handleDeleteNode}
            />
          )}
        </div>
      </div>

      {/* Field Visualization */}
      <AnimatePresence>
        {fieldVisible && (
          <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-[500px] border-l border-white/10 bg-gradient-to-br from-zinc-950 to-black"
          >
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={cn("text-lg font-semibold text-white", geist.className)}>Field Preview</h3>
                  <p className="text-xs text-zinc-500">144" × 144" FTC Field</p>
                </div>
                {loopMode && isRunning && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 rounded-lg border border-[#e78a53]/20 bg-[#e78a53]/10 px-3 py-1.5"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Repeat className="h-3.5 w-3.5 text-[#e78a53]" />
                    </motion.div>
                    <span className="text-xs font-semibold text-[#e78a53]">Loop Mode</span>
                  </motion.div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center p-6">
              <FieldWithPathEditor
                robotPosition={robotPosition}
                robotAngle={robotAngle}
                isRunning={isRunning}
                selectedNode={selectedNode}
                onUpdatePath={(waypoints) => {
                  if (selectedNode && selectedNode.type === "pathFollowNode") {
                    handleUpdateNode(selectedNode.id, { ...selectedNode.data, waypoints })
                  }
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
