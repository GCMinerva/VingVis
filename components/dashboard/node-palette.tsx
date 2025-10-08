"use client"

import { useState } from "react"
import { Move, RotateCw, Timer, Cpu, Radio, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const nodeTemplates = [
  {
    type: "moveNode",
    label: "Move Forward",
    icon: Move,
    color: "#e78a53",
    data: { label: "Move Forward", distance: 24 },
  },
  {
    type: "turnNode",
    label: "Turn",
    icon: RotateCw,
    color: "#f0a36f",
    data: { label: "Turn", degrees: 90 },
  },
  {
    type: "waitNode",
    label: "Wait",
    icon: Timer,
    color: "#60a5fa",
    data: { label: "Wait", duration: 1000 },
  },
  {
    type: "servoNode",
    label: "Servo",
    icon: Cpu,
    color: "#a78bfa",
    data: { label: "Servo", position: 0.5 },
  },
  {
    type: "sensorNode",
    label: "Sensor",
    icon: Radio,
    color: "#fbbf24",
    data: { label: "Sensor", sensorType: "Distance" },
  },
]

export default function NodePalette({ setNodes }: { setNodes: any }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const onDragStart = (event: React.DragEvent, nodeType: string, data: any) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ type: nodeType, data }))
    event.dataTransfer.effectAllowed = "move"
  }

  const addNode = (nodeType: string, data: any) => {
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      data,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    }
    setNodes((nds: any) => [...nds, newNode])
  }

  return (
    <div className="w-64 overflow-hidden rounded-lg border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between border-b border-white/10 px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <span className="text-sm font-semibold text-white">Node Palette</span>
        <ChevronDown
          className={`h-4 w-4 text-white transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-3">
              {nodeTemplates.map((node) => (
                <button
                  key={node.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type, node.data)}
                  onClick={() => addNode(node.type, node.data)}
                  className="flex w-full cursor-grab items-center gap-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-3 text-left transition-all hover:border-white/20 hover:from-white/10 active:cursor-grabbing"
                  style={{ borderLeftColor: node.color, borderLeftWidth: "3px" }}
                >
                  <div
                    className="rounded-md p-2"
                    style={{ backgroundColor: `${node.color}20` }}
                  >
                    <node.icon className="h-4 w-4" style={{ color: node.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{node.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
