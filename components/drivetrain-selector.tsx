"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronRight } from "lucide-react"
import { DriveTrainType, DRIVETRAIN_DEFINITIONS } from "@/lib/drivetrain-types"

interface DriveTrainSelectorProps {
  selectedType?: DriveTrainType
  onSelect: (type: DriveTrainType) => void
}

// Component to render the robot chassis visualization
function RobotChassis({ type, isAnimating }: { type: DriveTrainType; isAnimating: boolean }) {
  const def = DRIVETRAIN_DEFINITIONS[type]

  // Define movement animations for each drive train type
  const getMovementAnimation = () => {
    switch (type) {
      case 'tank-drive':
        return {
          x: [0, 30, 0],
          rotate: [0, 0, 15, -15, 0],
        }
      case 'omni-wheel':
      case 'mecanum-wheel':
      case 'x-drive':
        return {
          x: [0, 20, 20, 0, 0],
          y: [0, 0, 20, 20, 0],
          rotate: [0, 0, 0, 45, 0],
        }
      case 'h-drive':
        return {
          x: [0, 25, 0, -25, 0],
          y: [0, 0, 20, 0, 0],
        }
      case 'swerve-drive':
        return {
          x: [0, 15, 25, 15, 0],
          y: [0, 15, 0, -15, 0],
          rotate: [0, 90, 180, 270, 360],
        }
      default:
        return { x: 0, y: 0 }
    }
  }

  // Render wheel positions based on drive train type
  const renderWheels = () => {
    const wheelPositions = {
      'tank-drive': [
        { x: 10, y: 20, rotation: 0 },
        { x: 70, y: 20, rotation: 0 },
      ],
      'omni-wheel': [
        { x: 15, y: 15, rotation: 45 },
        { x: 65, y: 15, rotation: -45 },
        { x: 15, y: 65, rotation: -45 },
        { x: 65, y: 65, rotation: 45 },
      ],
      'mecanum-wheel': [
        { x: 15, y: 15, rotation: 45 },
        { x: 65, y: 15, rotation: -45 },
        { x: 15, y: 65, rotation: -45 },
        { x: 65, y: 65, rotation: 45 },
      ],
      'x-drive': [
        { x: 20, y: 20, rotation: 45 },
        { x: 60, y: 20, rotation: -45 },
        { x: 20, y: 60, rotation: -45 },
        { x: 60, y: 60, rotation: 45 },
      ],
      'h-drive': [
        { x: 15, y: 15, rotation: 0 },
        { x: 65, y: 15, rotation: 0 },
        { x: 15, y: 65, rotation: 0 },
        { x: 65, y: 65, rotation: 0 },
        { x: 40, y: 40, rotation: 90 }, // Center strafe wheel
      ],
      'swerve-drive': [
        { x: 15, y: 15, rotation: 0 },
        { x: 65, y: 15, rotation: 0 },
        { x: 15, y: 65, rotation: 0 },
        { x: 65, y: 65, rotation: 0 },
      ],
    }

    const positions = wheelPositions[type] || []

    return positions.map((pos, index) => (
      <g key={index}>
        <motion.rect
          x={pos.x - 5}
          y={pos.y - 8}
          width="10"
          height="16"
          fill="#3b82f6"
          stroke="#60a5fa"
          strokeWidth="1"
          rx="2"
          transform={`rotate(${pos.rotation} ${pos.x} ${pos.y})`}
          animate={
            isAnimating
              ? {
                  fill: ['#3b82f6', '#60a5fa', '#3b82f6'],
                  scale: [1, 1.1, 1],
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
        {type === 'swerve-drive' && index < 4 && (
          // Steering indicators for swerve drive
          <motion.circle
            cx={pos.x}
            cy={pos.y}
            r="3"
            fill="#f59e0b"
            animate={
              isAnimating
                ? {
                    rotate: [0, 360],
                  }
                : {}
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
      </g>
    ))
  }

  return (
    <div className="relative w-full h-40 md:h-48 flex items-center justify-center overflow-hidden bg-zinc-900/30 rounded-lg border border-zinc-800">
      <motion.svg
        width="140"
        height="140"
        viewBox="0 0 100 100"
        className="drop-shadow-lg"
        animate={isAnimating ? getMovementAnimation() : {}}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Robot chassis body */}
        <rect
          x="20"
          y="20"
          width="60"
          height="60"
          fill="#18181b"
          stroke="#52525b"
          strokeWidth="2.5"
          rx="5"
        />

        {/* Robot center indicator */}
        <circle cx="50" cy="50" r="5" fill="#ef4444" opacity="0.8" />

        {/* Wheels */}
        {renderWheels()}

        {/* Direction arrow */}
        <motion.path
          d="M 50 25 L 57 37 L 43 37 Z"
          fill="#10b981"
          stroke="#059669"
          strokeWidth="1"
          animate={
            isAnimating
              ? {
                  opacity: [0.5, 1, 0.5],
                }
              : {}
          }
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      </motion.svg>

      {/* Movement capability indicators */}
      {isAnimating && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {def.movementCapabilities.forward && (
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          {def.movementCapabilities.strafe && (
            <motion.div
              className="w-2 h-2 rounded-full bg-blue-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
          )}
          {def.movementCapabilities.rotate && (
            <motion.div
              className="w-2 h-2 rounded-full bg-purple-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function DriveTrainSelector({ selectedType, onSelect }: DriveTrainSelectorProps) {
  const [hoveredType, setHoveredType] = useState<DriveTrainType | null>(null)

  const driveTrainTypes: DriveTrainType[] = [
    'tank-drive',
    'omni-wheel',
    'mecanum-wheel',
    'x-drive',
    'h-drive',
    'swerve-drive',
  ]

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'advanced':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-4 w-full">
      <div className="text-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Choose Your Drive Train</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Select a drive system for your robot. Hover to see animations!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {driveTrainTypes.map((type) => {
          const def = DRIVETRAIN_DEFINITIONS[type]
          const isSelected = selectedType === type
          const isHovered = hoveredType === type

          return (
            <motion.div
              key={type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredType(type)}
              onHoverEnd={() => setHoveredType(null)}
              className="w-full"
            >
              <Card
                className={`cursor-pointer transition-all h-full min-h-[340px] md:min-h-[360px] ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-border/50 bg-background/50 hover:bg-background/80 hover:border-primary/30'
                }`}
                onClick={() => onSelect(type)}
              >
                <CardHeader className="pb-2 px-3 md:px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm md:text-base flex items-center gap-2">
                        {def.name}
                        {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                      </CardTitle>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="outline" className={`text-[10px] md:text-xs ${getComplexityColor(def.complexity)}`}>
                          {def.complexity}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] md:text-xs">
                          {def.motorCount} motors
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6">
                  {/* Robot visualization */}
                  <RobotChassis type={type} isAnimating={isHovered || isSelected} />

                  {/* Description */}
                  <CardDescription className="text-xs md:text-sm min-h-[36px] md:min-h-[40px] leading-relaxed">
                    {def.description}
                  </CardDescription>

                  {/* Movement capabilities */}
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Movement:</p>
                    <div className="flex flex-wrap gap-1">
                      {def.movementCapabilities.forward && (
                        <Badge variant="secondary" className="text-[9px] md:text-[10px] px-1.5 py-0.5">
                          Forward
                        </Badge>
                      )}
                      {def.movementCapabilities.strafe && (
                        <Badge variant="secondary" className="text-[9px] md:text-[10px] px-1.5 py-0.5">
                          Strafe
                        </Badge>
                      )}
                      {def.movementCapabilities.rotate && (
                        <Badge variant="secondary" className="text-[9px] md:text-[10px] px-1.5 py-0.5">
                          Rotate
                        </Badge>
                      )}
                      {def.movementCapabilities.diagonal && (
                        <Badge variant="secondary" className="text-[9px] md:text-[10px] px-1.5 py-0.5">
                          Diagonal
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
