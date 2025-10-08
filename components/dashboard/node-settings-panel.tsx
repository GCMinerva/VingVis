"use client"

import { X, Settings, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { geist } from "@/lib/fonts"

type NodeSettingsPanelProps = {
  selectedNode: any
  onClose: () => void
  onUpdate: (nodeId: string, data: any) => void
  onDelete: (nodeId: string) => void
}

export default function NodeSettingsPanel({ selectedNode, onClose, onUpdate, onDelete }: NodeSettingsPanelProps) {
  if (!selectedNode) return null

  const handleUpdate = (field: string, value: any) => {
    onUpdate(selectedNode.id, {
      ...selectedNode.data,
      [field]: value,
    })
  }

  const handleDelete = () => {
    if (selectedNode.type !== "startNode") {
      onDelete(selectedNode.id)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute right-0 top-0 z-40 h-full w-80 border-l border-white/10 bg-gradient-to-b from-zinc-950 to-black shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#e78a53]" />
            <h3 className={cn("text-sm font-semibold text-white", geist.className)}>Node Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex h-[calc(100%-60px)] flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {/* Node Label */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Node Label
              </label>
              <input
                type="text"
                value={selectedNode.data.label || ""}
                onChange={(e) => handleUpdate("label", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#e78a53] focus:ring-2 focus:ring-[#e78a53]/20"
              />
            </div>

          {/* Move Node Settings */}
          {selectedNode.type === "moveNode" && (
            <>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Distance (inches)
                </label>
                <input
                  type="number"
                  value={selectedNode.data.distance || 24}
                  onChange={(e) => handleUpdate("distance", parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e78a53] focus:ring-2 focus:ring-[#e78a53]/20"
                  step="1"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Speed (0-1)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedNode.data.speed || 0.5}
                  onChange={(e) => handleUpdate("speed", parseFloat(e.target.value))}
                  className="w-full accent-[#e78a53]"
                />
                <div className="mt-1 text-xs text-zinc-500">{((selectedNode.data.speed || 0.5) * 100).toFixed(0)}%</div>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Movement Type
                </label>
                <select
                  value={selectedNode.data.moveType || "forward"}
                  onChange={(e) => handleUpdate("moveType", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e78a53] focus:ring-2 focus:ring-[#e78a53]/20"
                >
                  <option value="forward">Forward</option>
                  <option value="backward">Backward</option>
                  <option value="strafe-left">Strafe Left</option>
                  <option value="strafe-right">Strafe Right</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <input
                    type="checkbox"
                    checked={selectedNode.data.usePosition || false}
                    onChange={(e) => handleUpdate("usePosition", e.target.checked)}
                    className="rounded accent-[#e78a53]"
                  />
                  Move to Position
                </label>
              </div>
              {selectedNode.data.usePosition && (
                <div className="ml-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Target X (inches)</label>
                    <input
                      type="number"
                      value={selectedNode.data.targetX || 72}
                      onChange={(e) => handleUpdate("targetX", parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e78a53]"
                      min="0"
                      max="144"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Target Y (inches)</label>
                    <input
                      type="number"
                      value={selectedNode.data.targetY || 72}
                      onChange={(e) => handleUpdate("targetY", parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e78a53]"
                      min="0"
                      max="144"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Turn Node Settings */}
          {selectedNode.type === "turnNode" && (
            <>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Angle (degrees)
                </label>
                <input
                  type="number"
                  value={selectedNode.data.degrees || 90}
                  onChange={(e) => handleUpdate("degrees", parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e78a53] focus:ring-2 focus:ring-[#e78a53]/20"
                  step="15"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Direction
                </label>
                <select
                  value={selectedNode.data.direction || "right"}
                  onChange={(e) => handleUpdate("direction", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e78a53] focus:ring-2 focus:ring-[#e78a53]/20"
                >
                  <option value="right">Clockwise</option>
                  <option value="left">Counter-Clockwise</option>
                </select>
              </div>
            </>
          )}

          {/* Path Follow Node Settings */}
          {selectedNode.type === "pathFollowNode" && (
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Waypoints (relative X, Y)
              </label>
              <div className="text-xs text-zinc-500 mb-2">
                Each waypoint is relative to current position
              </div>
              {(selectedNode.data.waypoints || [[24, 0], [48, 0], [72, 0]]).map((waypoint: number[], index: number) => (
                <div key={index} className="mb-2 flex gap-2">
                  <input
                    type="number"
                    value={waypoint[0]}
                    onChange={(e) => {
                      const newWaypoints = [...(selectedNode.data.waypoints || [[24, 0], [48, 0], [72, 0]])]
                      newWaypoints[index][0] = parseFloat(e.target.value)
                      handleUpdate("waypoints", newWaypoints)
                    }}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-[#a78bfa]"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={waypoint[1]}
                    onChange={(e) => {
                      const newWaypoints = [...(selectedNode.data.waypoints || [[24, 0], [48, 0], [72, 0]])]
                      newWaypoints[index][1] = parseFloat(e.target.value)
                      handleUpdate("waypoints", newWaypoints)
                    }}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-[#a78bfa]"
                    placeholder="Y"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Wait Node Settings */}
          {selectedNode.type === "waitNode" && (
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Duration (ms)
              </label>
              <input
                type="number"
                value={selectedNode.data.duration || 1000}
                onChange={(e) => handleUpdate("duration", parseFloat(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#e78a53] focus:ring-2 focus:ring-[#e78a53]/20"
                step="100"
                min="0"
              />
            </div>
          )}
          </div>

          {/* Delete Button */}
          {selectedNode.type !== "startNode" && (
            <div className="border-t border-white/10 p-4">
              <button
                onClick={handleDelete}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Delete Node
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
