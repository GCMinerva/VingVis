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
import { Play, Square, RotateCcw, PanelRightClose, PanelRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { geist } from "@/lib/fonts"
import { motion, AnimatePresence } from "framer-motion"
import NodePalette from "./node-palette"
import FieldVisualization from "./field-visualization"
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

  const executeFlow = useCallback(async () => {
    // Find the start node
    const startNode = nodes.find((n) => n.type === "startNode")
    if (!startNode) return

    // Build execution order by traversing the graph
    const executionOrder = []
    let currentNodeId = startNode.id

    while (currentNodeId) {
      const node = nodes.find((n) => n.id === currentNodeId)
      if (!node) break

      executionOrder.push(node)

      // Find the next node
      const outgoingEdge = edges.find((e) => e.source === currentNodeId)
      currentNodeId = outgoingEdge?.target || ""
    }

    let currentPosition = { x: 72, y: 72 }
    let currentAngle = 0

    setRobotPosition(currentPosition)
    setRobotAngle(currentAngle)

    // Execute each node
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
          // Move forward in current direction
          const distance = node.data.distance || 24
          const radians = (currentAngle * Math.PI) / 180
          const newX = currentPosition.x + distance * Math.cos(radians)
          const newY = currentPosition.y + distance * Math.sin(radians)
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
      } else if (node.type === "waitNode") {
        const duration = node.data.duration || 1000
        await new Promise((resolve) => setTimeout(resolve, duration))
      }
    }

    setIsRunning(false)
  }, [nodes, edges])

  const handleRun = () => {
    setIsRunning(true)
    executeFlow()
  }

  const handleStop = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
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
          <div className="flex items-center gap-2">
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
              <h3 className={cn("text-lg font-semibold text-white", geist.className)}>Field Preview</h3>
              <p className="text-xs text-zinc-500">144" × 144" FTC Field</p>
            </div>
            <div className="flex items-center justify-center p-6">
              <FieldVisualization robotPosition={robotPosition} robotAngle={robotAngle} isRunning={isRunning} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
