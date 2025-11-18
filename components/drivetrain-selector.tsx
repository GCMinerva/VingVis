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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'ring-4 ring-blue-500 shadow-2xl scale-[1.02]'
          : 'ring-2 ring-gray-300 dark:ring-gray-600 hover:ring-blue-400 dark:hover:ring-blue-500'
      }`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      onHoverStart={() => onHover(true)}
      onHoverEnd={() => onHover(false)}
    >
      {/* Selected Badge */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="absolute top-3 right-3 z-20 bg-blue-500 text-white rounded-full p-2 shadow-lg"
          >
            <Check className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative p-4 bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">{config.name}</h3>
            <div className={`w-2.5 h-2.5 rounded-full ${difficultyColor}`} title={config.difficulty} />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{config.description}</p>
        </div>

        {/* Visualization */}
        <div className="mb-3 h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
          <DrivetrainVisualization
            type={config.id}
            isAnimating={isHovered || isSelected}
            color={config.color}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span className="font-medium">{config.motorCount} Motors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            <span className="font-medium">{config.wheelCount} Wheels</span>
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
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25"/>
        </filter>
      </defs>

      {/* Render based on type */}
      {renderDrivetrain(type, isAnimating, color)}
    </svg>
  )
}

function renderDrivetrain(type: DrivetrainType, isAnimating: boolean, color: string) {
  switch (type) {
    case 'tank-drive':
      return <TankDrive isAnimating={isAnimating} color={color} />
    case 'omni-wheel':
      return <OmniWheel isAnimating={isAnimating} color={color} />
    case 'mecanum-wheel':
      return <MecanumWheel isAnimating={isAnimating} color={color} />
    case 'holonomic-drive':
      return <HolonomicDrive isAnimating={isAnimating} color={color} />
    case 'x-drive':
      return <XDrive isAnimating={isAnimating} color={color} />
    case 'swerve-drive':
      return <SwerveDrive isAnimating={isAnimating} color={color} />
    default:
      return null
  }
}

function TankDrive({ isAnimating, color }: { isAnimating: boolean, color: string }) {
  return (
    <g>
      {/* Left Wheels */}
      <motion.rect x="50" y="65" width="12" height="30" rx="2" fill="#374151" filter="url(#shadow)"
        animate={isAnimating ? { y: [65, 63, 65] } : {}}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect x="50" y="105" width="12" height="30" rx="2" fill="#374151" filter="url(#shadow)"
        animate={isAnimating ? { y: [105, 103, 105] } : {}}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />

      {/* Right Wheels */}
      <motion.rect x="138" y="65" width="12" height="30" rx="2" fill="#374151" filter="url(#shadow)"
        animate={isAnimating ? { y: [65, 63, 65] } : {}}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect x="138" y="105" width="12" height="30" rx="2" fill="#374151" filter="url(#shadow)"
        animate={isAnimating ? { y: [105, 103, 105] } : {}}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />

      {/* Chassis */}
      <motion.rect x="65" y="70" width="70" height="60" rx="4" fill={color} filter="url(#shadow)"
        animate={isAnimating ? { y: [70, 65, 70] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Front Indicator */}
      <polygon points="100,75 105,82 95,82" fill="white" opacity="0.9" />
    </g>
  )
}

function OmniWheel({ isAnimating, color }: { isAnimating: boolean, color: string }) {
  return (
    <g>
      {/* Front Left Wheel */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 360] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '73px', originY: '73px' }}
      >
        <rect x="67" y="67" width="12" height="12" rx="2" fill="#10b981" filter="url(#shadow)" />
        <line x1="73" y1="70" x2="73" y2="76" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="70" y1="73" x2="76" y2="73" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Front Right Wheel */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 360] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '127px', originY: '73px' }}
      >
        <rect x="121" y="67" width="12" height="12" rx="2" fill="#10b981" filter="url(#shadow)" />
        <line x1="127" y1="70" x2="127" y2="76" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="124" y1="73" x2="130" y2="73" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Back Left Wheel */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 360] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '73px', originY: '127px' }}
      >
        <rect x="67" y="121" width="12" height="12" rx="2" fill="#10b981" filter="url(#shadow)" />
        <line x1="73" y1="124" x2="73" y2="130" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="70" y1="127" x2="76" y2="127" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Back Right Wheel */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 360] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '127px', originY: '127px' }}
      >
        <rect x="121" y="121" width="12" height="12" rx="2" fill="#10b981" filter="url(#shadow)" />
        <line x1="127" y1="124" x2="127" y2="130" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="124" y1="127" x2="130" y2="127" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Chassis */}
      <motion.rect x="80" y="80" width="40" height="40" rx="3" fill={color} filter="url(#shadow)"
        animate={isAnimating ? { x: [80, 85, 80, 75, 80], y: [80, 80, 75, 80, 80] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <polygon points="100,85 103,90 97,90" fill="white" opacity="0.9" />
    </g>
  )
}

function MecanumWheel({ isAnimating, color }: { isAnimating: boolean, color: string }) {
  return (
    <g>
      {/* Front Left Wheel (/ rollers) */}
      <motion.g transform="rotate(45, 73, 73)"
        animate={isAnimating ? { rotate: [45, 405] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '73px', originY: '73px' }}
      >
        <rect x="67" y="67" width="12" height="12" rx="2" fill="#f59e0b" filter="url(#shadow)" />
        <line x1="70" y1="70" x2="76" y2="76" stroke="#1f2937" strokeWidth="2" />
      </motion.g>

      {/* Front Right Wheel (\ rollers) */}
      <motion.g transform="rotate(-45, 127, 73)"
        animate={isAnimating ? { rotate: [-45, 315] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '127px', originY: '73px' }}
      >
        <rect x="121" y="67" width="12" height="12" rx="2" fill="#f59e0b" filter="url(#shadow)" />
        <line x1="124" y1="76" x2="130" y2="70" stroke="#1f2937" strokeWidth="2" />
      </motion.g>

      {/* Back Left Wheel (\ rollers) */}
      <motion.g transform="rotate(-45, 73, 127)"
        animate={isAnimating ? { rotate: [-45, 315] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '73px', originY: '127px' }}
      >
        <rect x="67" y="121" width="12" height="12" rx="2" fill="#f59e0b" filter="url(#shadow)" />
        <line x1="70" y1="130" x2="76" y2="124" stroke="#1f2937" strokeWidth="2" />
      </motion.g>

      {/* Back Right Wheel (/ rollers) */}
      <motion.g transform="rotate(45, 127, 127)"
        animate={isAnimating ? { rotate: [45, 405] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '127px', originY: '127px' }}
      >
        <rect x="121" y="121" width="12" height="12" rx="2" fill="#f59e0b" filter="url(#shadow)" />
        <line x1="124" y1="124" x2="130" y2="130" stroke="#1f2937" strokeWidth="2" />
      </motion.g>

      {/* Chassis */}
      <motion.rect x="80" y="80" width="40" height="40" rx="3" fill={color} filter="url(#shadow)"
        animate={isAnimating ? { x: [80, 85, 80, 75, 80], y: [80, 80, 75, 80, 80] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <polygon points="100,85 103,90 97,90" fill="white" opacity="0.9" />
    </g>
  )
}

function HolonomicDrive({ isAnimating, color }: { isAnimating: boolean, color: string }) {
  // 3 wheels at 120° spacing
  return (
    <g>
      {/* Top Wheel (0°) */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 360] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '100px', originY: '60px' }}
      >
        <rect x="94" y="54" width="12" height="12" rx="2" fill="#3b82f6" filter="url(#shadow)" />
        <line x1="100" y1="57" x2="100" y2="63" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="97" y1="60" x2="103" y2="60" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Bottom Left Wheel (240°) */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 360] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '70px', originY: '130px' }}
      >
        <rect x="64" y="124" width="12" height="12" rx="2" fill="#3b82f6" filter="url(#shadow)" />
        <line x1="70" y1="127" x2="70" y2="133" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="67" y1="130" x2="73" y2="130" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Bottom Right Wheel (120°) */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 360] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '130px', originY: '130px' }}
      >
        <rect x="124" y="124" width="12" height="12" rx="2" fill="#3b82f6" filter="url(#shadow)" />
        <line x1="130" y1="127" x2="130" y2="133" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="127" y1="130" x2="133" y2="130" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Triangular Chassis */}
      <motion.path
        d="M 100 70 L 75 125 L 125 125 Z"
        fill={color}
        filter="url(#shadow)"
        animate={isAnimating ? {
          x: [0, 5, 0, -5, 0],
          y: [0, -5, 5, 0, 0],
          rotate: [0, 90, 180, 270, 360]
        } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ originX: '100px', originY: '107px' }}
      />
      {/* Center dot */}
      <circle cx="100" cy="107" r="3" fill="white" opacity="0.9" />
    </g>
  )
}

function XDrive({ isAnimating, color }: { isAnimating: boolean, color: string }) {
  return (
    <g>
      {/* Front Left Wheel (45°) */}
      <motion.g transform="rotate(45, 80, 80)"
        animate={isAnimating ? { rotate: [45, 405] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '80px', originY: '80px' }}
      >
        <rect x="74" y="74" width="12" height="12" rx="2" fill="#8b5cf6" filter="url(#shadow)" />
        <line x1="80" y1="77" x2="80" y2="83" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="77" y1="80" x2="83" y2="80" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Front Right Wheel (-45°) */}
      <motion.g transform="rotate(-45, 120, 80)"
        animate={isAnimating ? { rotate: [-45, 315] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '120px', originY: '80px' }}
      >
        <rect x="114" y="74" width="12" height="12" rx="2" fill="#8b5cf6" filter="url(#shadow)" />
        <line x1="120" y1="77" x2="120" y2="83" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="117" y1="80" x2="123" y2="80" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Back Left Wheel (-45°) */}
      <motion.g transform="rotate(-45, 80, 120)"
        animate={isAnimating ? { rotate: [-45, 315] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '80px', originY: '120px' }}
      >
        <rect x="74" y="114" width="12" height="12" rx="2" fill="#8b5cf6" filter="url(#shadow)" />
        <line x1="80" y1="117" x2="80" y2="123" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="77" y1="120" x2="83" y2="120" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Back Right Wheel (45°) */}
      <motion.g transform="rotate(45, 120, 120)"
        animate={isAnimating ? { rotate: [45, 405] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ originX: '120px', originY: '120px' }}
      >
        <rect x="114" y="114" width="12" height="12" rx="2" fill="#8b5cf6" filter="url(#shadow)" />
        <line x1="120" y1="117" x2="120" y2="123" stroke="#1f2937" strokeWidth="1.5" />
        <line x1="117" y1="120" x2="123" y2="120" stroke="#1f2937" strokeWidth="1.5" />
      </motion.g>

      {/* Diamond Chassis */}
      <motion.rect x="85" y="85" width="30" height="30" rx="2" fill={color} filter="url(#shadow)"
        transform="rotate(45, 100, 100)"
        animate={isAnimating ? {
          x: [85, 90, 85, 80, 85],
          y: [85, 80, 85, 90, 85]
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <polygon points="100,85 103,90 97,90" fill="white" opacity="0.9" />
    </g>
  )
}

function SwerveDrive({ isAnimating, color }: { isAnimating: boolean, color: string }) {
  return (
    <g>
      {/* Front Left Module */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 90, 180, 270, 360] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ originX: '73px', originY: '73px' }}
      >
        <circle cx="73" cy="73" r="10" fill="#8b5cf6" filter="url(#shadow)" />
        <rect x="68" y="66" width="10" height="14" rx="2" fill="#fbbf24" />
      </motion.g>

      {/* Front Right Module */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 90, 180, 270, 360] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ originX: '127px', originY: '73px' }}
      >
        <circle cx="127" cy="73" r="10" fill="#8b5cf6" filter="url(#shadow)" />
        <rect x="122" y="66" width="10" height="14" rx="2" fill="#fbbf24" />
      </motion.g>

      {/* Back Left Module */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 90, 180, 270, 360] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ originX: '73px', originY: '127px' }}
      >
        <circle cx="73" cy="127" r="10" fill="#8b5cf6" filter="url(#shadow)" />
        <rect x="68" y="120" width="10" height="14" rx="2" fill="#fbbf24" />
      </motion.g>

      {/* Back Right Module */}
      <motion.g
        animate={isAnimating ? { rotate: [0, 90, 180, 270, 360] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ originX: '127px', originY: '127px' }}
      >
        <circle cx="127" cy="127" r="10" fill="#8b5cf6" filter="url(#shadow)" />
        <rect x="122" y="120" width="10" height="14" rx="2" fill="#fbbf24" />
      </motion.g>

      {/* Chassis */}
      <motion.rect x="80" y="80" width="40" height="40" rx="3" fill={color} filter="url(#shadow)"
        animate={isAnimating ? {
          x: [80, 85, 82, 78, 80],
          y: [80, 80, 85, 82, 80],
          rotate: [0, 45, 90, 135, 180]
        } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ originX: '100px', originY: '100px' }}
      />
      <circle cx="100" cy="100" r="3" fill="white" opacity="0.9" />
    </g>
  )
}
