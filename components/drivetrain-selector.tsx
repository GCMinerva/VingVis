'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export type DrivetrainType = 'tank-drive' | 'omni-wheel' | 'mecanum-wheel' | 'holonomic-drive' | 'x-drive' | 'swerve-drive'

interface DrivetrainConfig {
  id: DrivetrainType
  name: string
  description: string
  wheelCount: number
  motorCount: number
  capabilities: string[]
}

const drivetrainConfigs: DrivetrainConfig[] = [
  {
    id: 'tank-drive',
    name: 'Tank Drive',
    description: 'Simple differential drive with 2-4 motors. Great for beginners.',
    wheelCount: 4,
    motorCount: 2,
    capabilities: ['Forward/Backward', 'Point Turns', 'Arc Turns']
  },
  {
    id: 'omni-wheel',
    name: 'Omni-Wheel Drive',
    description: '4 omni-wheels in standard configuration for omnidirectional movement.',
    wheelCount: 4,
    motorCount: 4,
    capabilities: ['Forward/Backward', 'Strafing', 'Rotation', 'Diagonal Movement']
  },
  {
    id: 'mecanum-wheel',
    name: 'Mecanum Drive',
    description: '4 mecanum wheels for smooth omnidirectional movement.',
    wheelCount: 4,
    motorCount: 4,
    capabilities: ['Forward/Backward', 'Strafing', 'Rotation', 'Diagonal Movement']
  },
  {
    id: 'holonomic-drive',
    name: 'Holonomic Drive',
    description: '3-wheel holonomic drive with 120° wheel spacing.',
    wheelCount: 3,
    motorCount: 3,
    capabilities: ['Full Omnidirectional', 'Rotation', 'Any Direction']
  },
  {
    id: 'x-drive',
    name: 'X-Drive',
    description: '4 omni-wheels at 45° angles for superior strafing speed.',
    wheelCount: 4,
    motorCount: 4,
    capabilities: ['Fast Strafing', 'Diagonal Movement', 'Rotation']
  },
  {
    id: 'swerve-drive',
    name: 'Swerve Drive',
    description: 'Advanced drive with independently rotating wheels.',
    wheelCount: 4,
    motorCount: 8,
    capabilities: ['Full Omnidirectional', 'Zero-radius Turns', 'Crab Walking']
  }
]

interface DrivetrainSelectorProps {
  selectedDrivetrain: DrivetrainType
  onSelect: (drivetrain: DrivetrainType) => void
}

export default function DrivetrainSelector({ selectedDrivetrain, onSelect }: DrivetrainSelectorProps) {
  const [animatingDrivetrain, setAnimatingDrivetrain] = useState<DrivetrainType | null>(null)

  const handlePreview = (drivetrain: DrivetrainType) => {
    setAnimatingDrivetrain(drivetrain)
    setTimeout(() => setAnimatingDrivetrain(null), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivetrainConfigs.map((config) => (
          <DrivetrainCard
            key={config.id}
            config={config}
            isSelected={selectedDrivetrain === config.id}
            isAnimating={animatingDrivetrain === config.id}
            onSelect={() => onSelect(config.id)}
            onPreview={() => handlePreview(config.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface DrivetrainCardProps {
  config: DrivetrainConfig
  isSelected: boolean
  isAnimating: boolean
  onSelect: () => void
  onPreview: () => void
}

function DrivetrainCard({ config, isSelected, isAnimating, onSelect, onPreview }: DrivetrainCardProps) {
  return (
    <motion.div
      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
          <Check className="w-4 h-4" />
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-bold text-lg mb-1">{config.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{config.description}</p>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          {config.wheelCount} wheels • {config.motorCount} motors
        </div>
      </div>

      <div className="mb-4 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
        <DrivetrainVisualization type={config.id} isAnimating={isAnimating} />
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Capabilities:</div>
        <div className="flex flex-wrap gap-1">
          {config.capabilities.map((cap) => (
            <span
              key={cap}
              className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded"
            >
              {cap}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onPreview()
        }}
        className="w-full py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
      >
        {isAnimating ? 'Playing...' : 'Preview Movement'}
      </button>
    </motion.div>
  )
}

interface DrivetrainVisualizationProps {
  type: DrivetrainType
  isAnimating: boolean
}

function DrivetrainVisualization({ type, isAnimating }: DrivetrainVisualizationProps) {
  const renderChassis = () => (
    <motion.rect
      x="70"
      y="70"
      width="80"
      height="80"
      fill="#3b82f6"
      rx="4"
      animate={isAnimating ? getChassisAnimation(type) : {}}
      transition={{ duration: 3, ease: "easeInOut" }}
    />
  )

  const renderWheels = () => {
    switch (type) {
      case 'tank-drive':
        return (
          <>
            {/* Left wheels */}
            <Wheel x="60" y="75" type="tank" isAnimating={isAnimating} side="left" />
            <Wheel x="60" y="135" type="tank" isAnimating={isAnimating} side="left" />
            {/* Right wheels */}
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
    <svg viewBox="0 0 220 220" className="w-full h-full">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
        </marker>
        <marker
          id="arrowhead2"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
        </marker>
      </defs>

      {renderWheels()}
      {renderChassis()}

      {/* Direction indicator */}
      {isAnimating && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, times: [0, 0.1, 0.9, 1] }}
        >
          {getMovementIndicators(type)}
        </motion.g>
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
  const wheelRotation = isAnimating ? (side === 'left' ? -360 : 360) : 0

  return (
    <motion.g
      animate={{
        rotate: wheelRotation
      }}
      transition={{ duration: 3, ease: "linear", repeat: 0 }}
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
            <line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke="#1f2937" strokeWidth="1" />
            <line x1={x - 6} y1={y - 5} x2={x + 6} y2={y - 5} stroke="#1f2937" strokeWidth="1" />
            <line x1={x - 6} y1={y + 5} x2={x + 6} y2={y + 5} stroke="#1f2937" strokeWidth="1" />
          </>
        )}
        {type === 'mecanum' && (
          <>
            <line x1={x - 6} y1={y - 8} x2={x + 6} y2={y} stroke="#1f2937" strokeWidth="1.5" />
            <line x1={x - 6} y1={y} x2={x + 6} y2={y + 8} stroke="#1f2937" strokeWidth="1.5" />
          </>
        )}
      </g>
    </motion.g>
  )
}

function SwerveModule({ x, y, isAnimating }: { x: number, y: number, isAnimating: boolean }) {
  return (
    <motion.g
      animate={isAnimating ? { rotate: [0, 90, 180, 90, 0] } : {}}
      transition={{ duration: 3, ease: "easeInOut" }}
      style={{ originX: `${x}px`, originY: `${y}px` }}
    >
      <circle cx={x} cy={y} r="14" fill="#8b5cf6" stroke="#1f2937" strokeWidth="2" />
      <rect
        x={x - 6}
        y={y - 10}
        width="12"
        height="20"
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
      return { x: [0, 0, 0], y: [0, -20, 0] }
    case 'omni-wheel':
    case 'mecanum-wheel':
      return { x: [0, 20, 0, -20, 0], y: [0, 0, -20, 0, 0] }
    case 'holonomic-drive':
      return {
        x: [0, 15, 15, -15, -15, 0],
        y: [0, -15, 15, 15, -15, 0]
      }
    case 'x-drive':
      return { x: [0, 25, 0, -25, 0], y: [0, -25, 0, 25, 0] }
    case 'swerve-drive':
      return {
        x: [0, 20, 10, -10, -20, 0],
        y: [0, 0, 15, 15, 0, 0],
        rotate: [0, 0, 90, 90, 0, 0]
      }
    default:
      return {}
  }
}

function getMovementIndicators(type: DrivetrainType) {
  switch (type) {
    case 'tank-drive':
      return (
        <motion.path
          d="M 110 150 L 110 90"
          stroke="#ef4444"
          strokeWidth="3"
          fill="none"
          markerEnd="url(#arrowhead)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      )
    case 'omni-wheel':
    case 'mecanum-wheel':
      return (
        <>
          <motion.path
            d="M 70 110 L 150 110"
            stroke="#ef4444"
            strokeWidth="3"
            fill="none"
            markerEnd="url(#arrowhead)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />
          <motion.path
            d="M 110 150 L 110 90"
            stroke="#10b981"
            strokeWidth="3"
            fill="none"
            markerEnd="url(#arrowhead2)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          />
        </>
      )
    default:
      return null
  }
}
