'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Zap, Settings } from 'lucide-react'

export type DrivetrainType = 'tank-drive' | 'omni-wheel' | 'mecanum-wheel' | 'holonomic-drive' | 'x-drive' | 'swerve-drive'

interface DrivetrainConfig {
  id: DrivetrainType
  name: string
  description: string
  wheelCount: number
  motorCount: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  color: string
}

const drivetrainConfigs: DrivetrainConfig[] = [
  {
    id: 'tank-drive',
    name: 'Tank Drive',
    description: 'Simple differential drive. Great for beginners.',
    wheelCount: 4,
    motorCount: 2,
    difficulty: 'Beginner',
    color: '#6b7280'
  },
  {
    id: 'omni-wheel',
    name: 'Omni-Wheel',
    description: 'Standard omnidirectional movement.',
    wheelCount: 4,
    motorCount: 4,
    difficulty: 'Intermediate',
    color: '#10b981'
  },
  {
    id: 'mecanum-wheel',
    name: 'Mecanum',
    description: 'Smooth omnidirectional control.',
    wheelCount: 4,
    motorCount: 4,
    difficulty: 'Intermediate',
    color: '#f59e0b'
  },
  {
    id: 'holonomic-drive',
    name: 'Holonomic',
    description: '3-wheel 120° spacing design.',
    wheelCount: 3,
    motorCount: 3,
    difficulty: 'Advanced',
    color: '#3b82f6'
  },
  {
    id: 'x-drive',
    name: 'X-Drive',
    description: '45° wheels for fast strafing.',
    wheelCount: 4,
    motorCount: 4,
    difficulty: 'Advanced',
    color: '#8b5cf6'
  },
  {
    id: 'swerve-drive',
    name: 'Swerve',
    description: 'Independently rotating modules.',
    wheelCount: 4,
    motorCount: 8,
    difficulty: 'Advanced',
    color: '#ec4899'
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
  const difficultyColor =
    config.difficulty === 'Beginner' ? 'bg-green-500' :
    config.difficulty === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <motion.div
      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-lg scale-[1.02]'
          : 'ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-gray-400 dark:hover:ring-gray-500'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      onHoverStart={() => onHover(true)}
      onHoverEnd={() => onHover(false)}
    >
      {/* Selected Badge */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-2 right-2 z-20 bg-blue-500 text-white rounded-full p-1.5"
          >
            <Check className="w-3 h-3" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative p-3 bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">{config.name}</h3>
            <div className={`w-2 h-2 rounded-full ${difficultyColor}`} title={config.difficulty} />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{config.description}</p>
        </div>

        {/* Visualization */}
        <div className="mb-2 h-32 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
          <DrivetrainVisualization
            type={config.id}
            isAnimating={isHovered || isSelected}
            color={config.color}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{config.motorCount}M</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings className="w-3 h-3" />
            <span>{config.wheelCount}W</span>
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
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
        </filter>
      </defs>

      {/* Wheels */}
      {renderWheels(type, isAnimating)}

      {/* Chassis */}
      <motion.rect
        x="30"
        y="30"
        width="40"
        height="40"
        fill={color}
        rx="3"
        filter="url(#shadow)"
        animate={isAnimating ? getChassisAnimation(type) : {}}
        transition={{ duration: 3, ease: "linear", repeat: isAnimating ? Infinity : 0 }}
      />

      {/* Direction Arrow */}
      <motion.polygon
        points="50,35 52,38 48,38"
        fill="white"
        opacity="0.8"
        animate={isAnimating ? { y: [0, -2, 0] } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  )
}

function renderWheels(type: DrivetrainType, isAnimating: boolean) {
  const wheelColor = '#374151'

  switch (type) {
    case 'tank-drive':
      return (
        <>
          <WheelRect x={23} y={32} isAnimating={isAnimating} color={wheelColor} />
          <WheelRect x={23} y={60} isAnimating={isAnimating} color={wheelColor} />
          <WheelRect x={69} y={32} isAnimating={isAnimating} color={wheelColor} reverse />
          <WheelRect x={69} y={60} isAnimating={isAnimating} color={wheelColor} reverse />
        </>
      )

    case 'omni-wheel':
      return (
        <>
          <WheelRect x={27} y={27} isAnimating={isAnimating} color="#10b981" />
          <WheelRect x={65} y={27} isAnimating={isAnimating} color="#10b981" reverse />
          <WheelRect x={27} y={65} isAnimating={isAnimating} color="#10b981" />
          <WheelRect x={65} y={65} isAnimating={isAnimating} color="#10b981" reverse />
        </>
      )

    case 'mecanum-wheel':
      return (
        <>
          <WheelRect x={27} y={27} isAnimating={isAnimating} color="#f59e0b" angle={45} />
          <WheelRect x={65} y={27} isAnimating={isAnimating} color="#f59e0b" angle={-45} reverse />
          <WheelRect x={27} y={65} isAnimating={isAnimating} color="#f59e0b" angle={-45} />
          <WheelRect x={65} y={65} isAnimating={isAnimating} color="#f59e0b" angle={45} reverse />
        </>
      )

    case 'holonomic-drive':
      return (
        <>
          <WheelRect x={50} y={24} isAnimating={isAnimating} color="#3b82f6" />
          <WheelRect x={32} y={68} isAnimating={isAnimating} color="#3b82f6" reverse />
          <WheelRect x={68} y={68} isAnimating={isAnimating} color="#3b82f6" />
        </>
      )

    case 'x-drive':
      return (
        <>
          <WheelRect x={32} y={32} isAnimating={isAnimating} color="#8b5cf6" angle={45} />
          <WheelRect x={68} y={32} isAnimating={isAnimating} color="#8b5cf6" angle={-45} reverse />
          <WheelRect x={32} y={68} isAnimating={isAnimating} color="#8b5cf6" angle={-45} />
          <WheelRect x={68} y={68} isAnimating={isAnimating} color="#8b5cf6" angle={45} reverse />
        </>
      )

    case 'swerve-drive':
      return (
        <>
          <SwerveModule x={27} y={27} isAnimating={isAnimating} />
          <SwerveModule x={65} y={27} isAnimating={isAnimating} />
          <SwerveModule x={27} y={65} isAnimating={isAnimating} />
          <SwerveModule x={65} y={65} isAnimating={isAnimating} />
        </>
      )

    default:
      return null
  }
}

function WheelRect({ x, y, isAnimating, color, angle = 0, reverse = false }: {
  x: number
  y: number
  isAnimating: boolean
  color: string
  angle?: number
  reverse?: boolean
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g transform={`rotate(${angle}, 0, 0)`}>
        <motion.rect
          x={-3}
          y={-5}
          width="6"
          height="10"
          fill={color}
          rx="1"
          animate={isAnimating ? {
            scaleY: reverse ? [1, 0.8, 1] : [1, 1.2, 1]
          } : {}}
          transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
        />
      </g>
    </g>
  )
}

function SwerveModule({ x, y, isAnimating }: { x: number, y: number, isAnimating: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <motion.g
        animate={isAnimating ? { rotate: [0, 360] } : {}}
        transition={{ duration: 3, ease: "linear", repeat: isAnimating ? Infinity : 0 }}
      >
        <circle r="6" fill="#8b5cf6" />
        <rect x={-2} y={-4} width="4" height="8" fill="#fbbf24" rx="1" />
      </motion.g>
    </g>
  )
}

function getChassisAnimation(type: DrivetrainType) {
  switch (type) {
    case 'tank-drive':
      return { y: [0, -3, 0] }
    case 'omni-wheel':
    case 'mecanum-wheel':
      return { x: [0, 3, 0, -3, 0], y: [0, 0, -3, 0, 0] }
    case 'holonomic-drive':
      return {
        x: [0, 3, 0, -3, 0],
        y: [0, -3, 3, 0, 0],
        rotate: [0, 90, 180, 270, 360]
      }
    case 'x-drive':
      return { x: [0, 4, 0, -4, 0], y: [0, -4, 0, 4, 0] }
    case 'swerve-drive':
      return {
        x: [0, 3, 0, -3, 0],
        y: [0, 0, 3, 0, 0],
        rotate: [0, 90, 180, 270, 360]
      }
    default:
      return {}
  }
}
