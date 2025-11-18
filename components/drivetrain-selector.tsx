'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Play, Zap, Gauge } from 'lucide-react'

export type DrivetrainType = 'tank-drive' | 'omni-wheel' | 'mecanum-wheel' | 'holonomic-drive' | 'x-drive' | 'swerve-drive'

interface DrivetrainConfig {
  id: DrivetrainType
  name: string
  description: string
  wheelCount: number
  motorCount: number
  capabilities: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  color: string
  gradient: string
}

const drivetrainConfigs: DrivetrainConfig[] = [
  {
    id: 'tank-drive',
    name: 'Tank Drive',
    description: 'Simple differential drive. Perfect for beginners!',
    wheelCount: 4,
    motorCount: 2,
    capabilities: ['Forward/Backward', 'Point Turns', 'Arc Turns'],
    difficulty: 'Beginner',
    color: '#6b7280',
    gradient: 'from-gray-500 to-gray-600'
  },
  {
    id: 'omni-wheel',
    name: 'Omni-Wheel',
    description: 'Standard omnidirectional drive with great maneuverability.',
    wheelCount: 4,
    motorCount: 4,
    capabilities: ['Strafe', 'Rotate', 'Diagonal'],
    difficulty: 'Intermediate',
    color: '#10b981',
    gradient: 'from-emerald-500 to-green-600'
  },
  {
    id: 'mecanum-wheel',
    name: 'Mecanum',
    description: 'Smooth omnidirectional movement in any direction.',
    wheelCount: 4,
    motorCount: 4,
    capabilities: ['Strafe', 'Rotate', 'Holonomic'],
    difficulty: 'Intermediate',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    id: 'holonomic-drive',
    name: 'Holonomic',
    description: '3-wheel design with 120° spacing for full mobility.',
    wheelCount: 3,
    motorCount: 3,
    capabilities: ['360° Movement', 'Any Direction'],
    difficulty: 'Advanced',
    color: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'x-drive',
    name: 'X-Drive',
    description: '45° wheels for lightning-fast strafing performance.',
    wheelCount: 4,
    motorCount: 4,
    capabilities: ['Ultra-Fast Strafe', 'Diagonal'],
    difficulty: 'Advanced',
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600'
  },
  {
    id: 'swerve-drive',
    name: 'Swerve',
    description: 'Ultimate control with independently rotating modules.',
    wheelCount: 4,
    motorCount: 8,
    capabilities: ['Zero-Turn', 'Crab Walk', 'Any Angle'],
    difficulty: 'Advanced',
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-600'
  }
]

interface DrivetrainSelectorProps {
  selectedDrivetrain: DrivetrainType
  onSelect: (drivetrain: DrivetrainType) => void
}

export default function DrivetrainSelector({ selectedDrivetrain, onSelect }: DrivetrainSelectorProps) {
  const [hoveredDrivetrain, setHoveredDrivetrain] = useState<DrivetrainType | null>(null)

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {drivetrainConfigs.map((config) => (
          <DrivetrainCard
            key={config.id}
            config={config}
            isSelected={selectedDrivetrain === config.id}
            isHovered={hoveredDrivetrain === config.id}
            onSelect={() => onSelect(config.id)}
            onHover={(hover) => setHoveredDrivetrain(hover ? config.id : null)}
          />
        ))}
      </div>
    </div>
  )
}

interface DrivetrainCardProps {
  config: DrivetrainConfig
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hover: boolean) => void
}

function DrivetrainCard({ config, isSelected, isHovered, onSelect, onHover }: DrivetrainCardProps) {
  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-background shadow-2xl'
          : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-500 shadow-lg hover:shadow-xl'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      onHoverStart={() => onHover(true)}
      onHoverEnd={() => onHover(false)}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-10`} />

      {/* Selected Badge */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="absolute top-3 right-3 z-20 bg-blue-500 text-white rounded-full p-2 shadow-lg"
          >
            <Check className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative p-5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">{config.name}</h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              config.difficulty === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              config.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {config.difficulty}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{config.description}</p>
        </div>

        {/* Visualization Area */}
        <div className={`mb-4 h-56 sm:h-64 rounded-lg flex items-center justify-center relative overflow-hidden transition-all ${
          isHovered ? 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'
        }`}>
          {/* Animated Background */}
          {isHovered && (
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-20`}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <DrivetrainVisualization
            type={config.id}
            isAnimating={isHovered || isSelected}
            color={config.color}
          />

          {/* Play Indicator */}
          <AnimatePresence>
            {!isHovered && !isSelected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px]"
              >
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-white/90 dark:bg-gray-800/90 rounded-full p-4 shadow-xl"
                  >
                    <Play className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="currentColor" />
                  </motion.div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full">
                    Hover to preview
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Motors</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{config.motorCount}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Wheels</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{config.wheelCount}</div>
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Capabilities</div>
          <div className="flex flex-wrap gap-1.5">
            {config.capabilities.map((cap, idx) => (
              <motion.span
                key={cap}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`text-xs font-medium bg-gradient-to-r ${config.gradient} text-white px-3 py-1 rounded-full shadow-sm`}
              >
                {cap}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface DrivetrainVisualizationProps {
  type: DrivetrainType
  isAnimating: boolean
  color: string
}

function DrivetrainVisualization({ type, isAnimating, color }: DrivetrainVisualizationProps) {
  const renderChassis = () => (
    <motion.g
      animate={isAnimating ? getChassisAnimation(type) : {}}
      transition={{ duration: 4, ease: "easeInOut", repeat: isAnimating ? Infinity : 0 }}
    >
      <rect
        x="70"
        y="70"
        width="80"
        height="80"
        fill={color}
        rx="6"
        opacity="0.9"
      />
      {/* Center dot */}
      <circle cx="110" cy="110" r="4" fill="white" opacity="0.8" />
      {/* Direction indicator */}
      <motion.polygon
        points="110,75 115,85 105,85"
        fill="white"
        opacity="0.9"
        animate={isAnimating ? { y: [0, -3, 0] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.g>
  )

  const renderWheels = () => {
    switch (type) {
      case 'tank-drive':
        return (
          <>
            <Wheel x="60" y="75" type="tank" isAnimating={isAnimating} side="left" />
            <Wheel x="60" y="135" type="tank" isAnimating={isAnimating} side="left" />
            <Wheel x="150" y="75" type="tank" isAnimating={isAnimating} side="right" />
            <Wheel x="150" y="135" type="tank" isAnimating={isAnimating} side="right" />
          </>
        )

      case 'omni-wheel':
        return (
          <>
            <Wheel x="65" y="65" type="omni" isAnimating={isAnimating} angle={0} />
            <Wheel x="145" y="65" type="omni" isAnimating={isAnimating} angle={0} />
            <Wheel x="65" y="145" type="omni" isAnimating={isAnimating} angle={0} />
            <Wheel x="145" y="145" type="omni" isAnimating={isAnimating} angle={0} />
          </>
        )

      case 'mecanum-wheel':
        return (
          <>
            <Wheel x="65" y="65" type="mecanum" isAnimating={isAnimating} angle={45} />
            <Wheel x="145" y="65" type="mecanum" isAnimating={isAnimating} angle={-45} />
            <Wheel x="65" y="145" type="mecanum" isAnimating={isAnimating} angle={-45} />
            <Wheel x="145" y="145" type="mecanum" isAnimating={isAnimating} angle={45} />
          </>
        )

      case 'holonomic-drive':
        return (
          <>
            <Wheel x="110" y="60" type="omni" isAnimating={isAnimating} angle={0} />
            <Wheel x="70" y="145" type="omni" isAnimating={isAnimating} angle={120} />
            <Wheel x="150" y="145" type="omni" isAnimating={isAnimating} angle={240} />
          </>
        )

      case 'x-drive':
        return (
          <>
            <Wheel x="75" y="75" type="omni" isAnimating={isAnimating} angle={45} />
            <Wheel x="135" y="75" type="omni" isAnimating={isAnimating} angle={-45} />
            <Wheel x="75" y="135" type="omni" isAnimating={isAnimating} angle={-45} />
            <Wheel x="135" y="135" type="omni" isAnimating={isAnimating} angle={45} />
          </>
        )

      case 'swerve-drive':
        return (
          <>
            <SwerveModule x="65" y="65" isAnimating={isAnimating} />
            <SwerveModule x="145" y="65" isAnimating={isAnimating} />
            <SwerveModule x="65" y="145" isAnimating={isAnimating} />
            <SwerveModule x="145" y="145" isAnimating={isAnimating} />
          </>
        )

      default:
        return null
    }
  }

  return (
    <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-lg">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
        </marker>
        <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {renderWheels()}
      {renderChassis()}

      {/* Movement indicators */}
      {isAnimating && (
        <g filter="url(#glow)">
          {getMovementIndicators(type)}
        </g>
      )}
    </svg>
  )
}

interface WheelProps {
  x: number
  y: number
  type: 'tank' | 'omni' | 'mecanum'
  isAnimating: boolean
  angle?: number
  side?: 'left' | 'right'
}

function Wheel({ x, y, type, isAnimating, angle = 0, side }: WheelProps) {
  return (
    <motion.g
      animate={isAnimating ? {
        rotate: side === 'left' ? [0, -360] : [0, 360]
      } : {}}
      transition={{ duration: 4, ease: "linear", repeat: isAnimating ? Infinity : 0 }}
      style={{ originX: `${x}px`, originY: `${y}px` }}
    >
      <g transform={`rotate(${angle}, ${x}, ${y})`}>
        <rect
          x={x - 8}
          y={y - 12}
          width="16"
          height="24"
          fill={type === 'mecanum' ? '#fbbf24' : type === 'omni' ? '#10b981' : '#6b7280'}
          stroke="#1f2937"
          strokeWidth="2"
          rx="3"
        />
        {type === 'omni' && (
          <>
            <line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke="#1f2937" strokeWidth="1.5" />
            <line x1={x - 6} y1={y - 5} x2={x + 6} y2={y - 5} stroke="#1f2937" strokeWidth="1.5" />
            <line x1={x - 6} y1={y + 5} x2={x + 6} y2={y + 5} stroke="#1f2937" strokeWidth="1.5" />
          </>
        )}
        {type === 'mecanum' && (
          <>
            <line x1={x - 6} y1={y - 8} x2={x + 6} y2={y} stroke="#1f2937" strokeWidth="2" />
            <line x1={x - 6} y1={y} x2={x + 6} y2={y + 8} stroke="#1f2937" strokeWidth="2" />
          </>
        )}
      </g>
    </motion.g>
  )
}

function SwerveModule({ x, y, isAnimating }: { x: number, y: number, isAnimating: boolean }) {
  return (
    <motion.g
      animate={isAnimating ? { rotate: [0, 90, 180, 270, 360] } : {}}
      transition={{ duration: 4, ease: "easeInOut", repeat: isAnimating ? Infinity : 0 }}
      style={{ originX: `${x}px`, originY: `${y}px` }}
    >
      <circle cx={x} cy={y} r="16" fill="#8b5cf6" stroke="#1f2937" strokeWidth="2.5" />
      <rect
        x={x - 7}
        y={y - 11}
        width="14"
        height="22"
        fill="#fbbf24"
        stroke="#1f2937"
        strokeWidth="2"
        rx="2"
      />
    </motion.g>
  )
}

function getChassisAnimation(type: DrivetrainType) {
  switch (type) {
    case 'tank-drive':
      return {
        x: [0, 0, 0, 0],
        y: [0, -25, -25, 0],
        rotate: [0, 0, 0, 0]
      }
    case 'omni-wheel':
    case 'mecanum-wheel':
      return {
        x: [0, 25, 25, 0, -25, -25, 0],
        y: [0, 0, -25, -25, -25, 0, 0],
        rotate: [0, 0, 0, 0, 0, 0, 0]
      }
    case 'holonomic-drive':
      return {
        x: [0, 20, 20, -20, -20, 0],
        y: [0, -20, 20, 20, -20, 0],
        rotate: [0, 45, 90, 180, 270, 360]
      }
    case 'x-drive':
      return {
        x: [0, 30, 30, -30, -30, 0],
        y: [0, -30, 30, 30, -30, 0],
        rotate: [0, 0, 0, 0, 0, 0]
      }
    case 'swerve-drive':
      return {
        x: [0, 25, 15, -15, -25, 0],
        y: [0, 0, 20, 20, 0, 0],
        rotate: [0, 45, 90, 180, 270, 360]
      }
    default:
      return {}
  }
}

function getMovementIndicators(type: DrivetrainType) {
  switch (type) {
    case 'tank-drive':
      return (
        <>
          <motion.path
            d="M 110 160 L 110 80"
            stroke="#ef4444"
            strokeWidth="4"
            fill="none"
            markerEnd="url(#arrowhead)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
          />
        </>
      )
    case 'omni-wheel':
    case 'mecanum-wheel':
      return (
        <>
          <motion.path
            d="M 60 110 L 160 110"
            stroke="#ef4444"
            strokeWidth="4"
            fill="none"
            markerEnd="url(#arrowhead)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
          />
          <motion.path
            d="M 110 160 L 110 80"
            stroke="#10b981"
            strokeWidth="4"
            fill="none"
            markerEnd="url(#arrowhead2)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1.5, repeat: Infinity, repeatDelay: 1 }}
          />
        </>
      )
    case 'holonomic-drive':
    case 'x-drive':
      return (
        <>
          <motion.circle
            cx="110"
            cy="110"
            r="40"
            stroke="#ef4444"
            strokeWidth="3"
            fill="none"
            strokeDasharray="8 4"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </>
      )
    case 'swerve-drive':
      return (
        <>
          <motion.path
            d="M 70 70 L 150 150 M 150 70 L 70 150"
            stroke="#8b5cf6"
            strokeWidth="3"
            strokeDasharray="5 5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </>
      )
    default:
      return null
  }
}
