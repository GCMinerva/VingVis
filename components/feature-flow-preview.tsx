"use client"

import { useEffect, useMemo, useState } from "react"
import type { Edge, Node } from "reactflow"
import ReactFlow, { Background, Controls } from "reactflow"
import "reactflow/dist/style.css"

const baseNodes: Node[] = [
  {
    id: "start",
    position: { x: 0, y: 90 },
    data: { label: "Start" },
    style: {
      borderRadius: 12,
      padding: "12px 16px",
      fontSize: 14,
      fontWeight: 600,
      border: "1px solid rgba(231, 138, 83, 0.4)",
      color: "#ffffff",
      background: "rgba(255, 255, 255, 0.04)",
      width: 120,
      textAlign: "center",
    },
  },
  {
    id: "move",
    position: { x: 180, y: 30 },
    data: { label: "To Position (36, 24, 90deg)" },
    style: {
      borderRadius: 16,
      padding: "14px 18px",
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.4,
      border: "1px solid rgba(231, 138, 83, 0.4)",
      color: "#ffffff",
      background: "rgba(231, 138, 83, 0.12)",
      width: 200,
      boxShadow: "0 0 20px rgba(231, 138, 83, 0.15)",
    },
  },
  {
    id: "end",
    position: { x: 420, y: 90 },
    data: { label: "End" },
    style: {
      borderRadius: 12,
      padding: "12px 16px",
      fontSize: 14,
      fontWeight: 600,
      border: "1px solid rgba(231, 138, 83, 0.4)",
      color: "#ffffff",
      background: "rgba(255, 255, 255, 0.04)",
      width: 120,
      textAlign: "center",
    },
  },
]

const baseEdges: Edge[] = [
  {
    id: "start-move",
    source: "start",
    target: "move",
    animated: true,
    type: "smoothstep",
    style: { stroke: "rgba(231, 138, 83, 0.8)", strokeWidth: 2 },
    markerEnd: {
      type: "arrowclosed",
      color: "rgba(231, 138, 83, 0.9)",
    },
  },
  {
    id: "move-end",
    source: "move",
    target: "end",
    animated: false,
    type: "smoothstep",
    style: { stroke: "rgba(231, 138, 83, 0.8)", strokeWidth: 2 },
    markerEnd: {
      type: "arrowclosed",
      color: "rgba(231, 138, 83, 0.9)",
    },
  },
]

const FlowPreview = () => {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % baseNodes.length)
    }, 2000)

    return () => clearInterval(timer)
  }, [])

  const nodes = useMemo(
    () =>
      baseNodes.map((node, index) => ({
        ...node,
        style: {
          ...node.style,
          border: `1px solid ${index === activeIndex ? "rgba(231, 138, 83, 0.9)" : "rgba(231, 138, 83, 0.25)"}`,
          boxShadow:
            index === activeIndex ? "0 0 24px rgba(231, 138, 83, 0.35)" : "0 0 12px rgba(0, 0, 0, 0.4)",
          background:
            index === activeIndex ? "rgba(231, 138, 83, 0.24)" : (node.style?.background as string | undefined),
        },
      })),
    [activeIndex],
  )

  const edges = useMemo(
    () =>
      baseEdges.map((edge, index) => ({
        ...edge,
        animated: index <= Math.max(activeIndex - 1, 0),
        style: {
          ...edge.style,
          stroke: index <= Math.max(activeIndex - 1, 0) ? "rgba(231, 138, 83, 1)" : "rgba(231, 138, 83, 0.4)",
        },
      })),
    [activeIndex],
  )

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/65">
      <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 shadow-lg">
        Active Node: <span className="text-white">{baseNodes[activeIndex]?.data?.label}</span>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={false}
        panOnScroll={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        minZoom={0.8}
        maxZoom={1}
        className="react-flow-dark"
        style={{ width: "100%", height: "100%" }}
      >
        <Background color="rgba(255,255,255,0.06)" gap={20} />
        <Controls
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          className="bg-black/70 text-white"
        />
      </ReactFlow>
    </div>
  )
}

export default FlowPreview
