"use client"

import { motion } from "framer-motion"

type FieldVisualizationProps = {
  robotPosition: { x: number; y: number }
  robotAngle: number
  isRunning: boolean
}

const FIELD_SIZE = 144 // inches
const SCALE = 2.5 // pixels per inch
const CANVAS_SIZE = FIELD_SIZE * SCALE // 360px

export default function FieldVisualization({ robotPosition, robotAngle, isRunning }: FieldVisualizationProps) {
  return (
    <div className="relative">
      {/* Field Container */}
      <div
        className="relative overflow-hidden rounded-xl border-2 border-white/20 bg-gradient-to-br from-zinc-900 to-black shadow-2xl"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
      >
        {/* Grid Lines */}
        <svg className="absolute inset-0" width={CANVAS_SIZE} height={CANVAS_SIZE}>
          <defs>
            <pattern id="grid" width={24 * SCALE} height={24 * SCALE} patternUnits="userSpaceOnUse">
              <path
                d={`M ${24 * SCALE} 0 L 0 0 0 ${24 * SCALE}`}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#grid)" />

          {/* Center lines */}
          <line
            x1={CANVAS_SIZE / 2}
            y1="0"
            x2={CANVAS_SIZE / 2}
            y2={CANVAS_SIZE}
            stroke="rgba(231, 138, 83, 0.3)"
            strokeWidth="2"
            strokeDasharray="8 4"
          />
          <line
            x1="0"
            y1={CANVAS_SIZE / 2}
            x2={CANVAS_SIZE}
            y2={CANVAS_SIZE / 2}
            stroke="rgba(231, 138, 83, 0.3)"
            strokeWidth="2"
            strokeDasharray="8 4"
          />

          {/* Corner markers - Red Alliance */}
          <circle cx="30" cy="30" r="12" fill="#ef4444" opacity="0.3" />
          <circle cx="30" cy="30" r="6" fill="#ef4444" />

          {/* Corner markers - Blue Alliance */}
          <circle cx={CANVAS_SIZE - 30} cy={CANVAS_SIZE - 30} r="12" fill="#3b82f6" opacity="0.3" />
          <circle cx={CANVAS_SIZE - 30} cy={CANVAS_SIZE - 30} r="6" fill="#3b82f6" />

          {/* Submersible zones (simplified) */}
          <rect
            x={CANVAS_SIZE / 2 - 40}
            y={CANVAS_SIZE / 2 - 40}
            width="80"
            height="80"
            fill="none"
            stroke="rgba(74, 222, 128, 0.4)"
            strokeWidth="3"
            rx="8"
          />
        </svg>

        {/* Robot */}
        <motion.div
          className="absolute"
          style={{
            left: robotPosition.x * SCALE,
            top: robotPosition.y * SCALE,
            width: 18 * SCALE,
            height: 18 * SCALE,
          }}
          animate={{
            left: robotPosition.x * SCALE,
            top: robotPosition.y * SCALE,
            rotate: robotAngle,
            scale: isRunning ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: isRunning ? 0.5 : 0.8,
            repeat: isRunning ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          {/* Robot body */}
          <div className="relative h-full w-full" style={{ transform: "translate(-50%, -50%)" }}>
            {/* Main body */}
            <div className="absolute inset-0 rounded-lg border-2 border-[#e78a53] bg-gradient-to-br from-[#e78a53] to-[#f0a36f] shadow-lg shadow-[#e78a53]/50">
              {/* Direction indicator (front) */}
              <div className="absolute left-1/2 top-1 h-2 w-6 -translate-x-1/2 rounded-full bg-white" />

              {/* Center dot */}
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
            </div>

            {/* Running animation ring */}
            {isRunning && (
              <motion.div
                className="absolute inset-0 rounded-lg border-2 border-[#e78a53]"
                animate={{
                  scale: [1, 1.3],
                  opacity: [0.8, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              />
            )}
          </div>
        </motion.div>

        {/* Measurements */}
        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs font-mono text-white backdrop-blur">
          X: {robotPosition.x.toFixed(1)}" Y: {robotPosition.y.toFixed(1)}" θ: {robotAngle.toFixed(0)}°
        </div>

        {/* Running indicator */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-2 top-2 flex items-center gap-2 rounded-md bg-[#4ade80]/20 px-3 py-1.5 text-xs font-semibold text-[#4ade80] backdrop-blur"
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-[#4ade80]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            Running
          </motion.div>
        )}
      </div>

      {/* Field Legend */}
      <div className="mt-4 space-y-2 rounded-lg border border-white/10 bg-black/40 p-4 text-xs">
        <div className="mb-2 font-semibold text-white">Field Legend</div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-#ef4444" />
          <span className="text-zinc-400">Red Alliance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-#3b82f6" />
          <span className="text-zinc-400">Blue Alliance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border-2 border-[#4ade80]" />
          <span className="text-zinc-400">Submersible Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 rounded bg-gradient-to-r from-[#e78a53] to-[#f0a36f]" />
          <span className="text-zinc-400">Robot (18" × 18")</span>
        </div>
      </div>

      {/* Field Info */}
      <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-4">
        <div className="text-xs text-zinc-500">
          <p className="font-semibold text-white">Decode℠ Field</p>
          <p className="mt-1">Regulation Size: 144" × 144"</p>
          <p>Scale: 1:{SCALE} (1 inch = {SCALE} pixels)</p>
        </div>
      </div>
    </div>
  )
}
