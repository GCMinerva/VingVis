// Drive train type definitions for VingVis

export type DriveTrainType =
  | 'tank-drive'
  | 'omni-wheel'
  | 'mecanum-wheel'
  | 'x-drive'
  | 'h-drive'
  | 'swerve-drive'

export interface DriveTrainMotorConfig {
  position: 'fl' | 'fr' | 'bl' | 'br' | 'cl' | 'cr' // front-left, front-right, back-left, back-right, center-left, center-right
  defaultName: string
  required: boolean
}

export interface DriveTrainDefinition {
  id: DriveTrainType
  name: string
  description: string
  motorCount: number
  motors: DriveTrainMotorConfig[]
  movementCapabilities: {
    forward: boolean
    backward: boolean
    strafe: boolean
    rotate: boolean
    diagonal: boolean
  }
  complexity: 'beginner' | 'intermediate' | 'advanced'
}

export const DRIVETRAIN_DEFINITIONS: Record<DriveTrainType, DriveTrainDefinition> = {
  'tank-drive': {
    id: 'tank-drive',
    name: 'Tank Drive',
    description: 'Simple 2-motor drive system - left and right side motors',
    motorCount: 2,
    motors: [
      { position: 'fl', defaultName: 'leftMotor', required: true },
      { position: 'fr', defaultName: 'rightMotor', required: true },
    ],
    movementCapabilities: {
      forward: true,
      backward: true,
      strafe: false,
      rotate: true,
      diagonal: false,
    },
    complexity: 'beginner',
  },
  'omni-wheel': {
    id: 'omni-wheel',
    name: 'Omni-Wheel Drive',
    description: '4-wheel omnidirectional drive with holonomic movement',
    motorCount: 4,
    motors: [
      { position: 'fl', defaultName: 'frontLeft', required: true },
      { position: 'fr', defaultName: 'frontRight', required: true },
      { position: 'bl', defaultName: 'backLeft', required: true },
      { position: 'br', defaultName: 'backRight', required: true },
    ],
    movementCapabilities: {
      forward: true,
      backward: true,
      strafe: true,
      rotate: true,
      diagonal: true,
    },
    complexity: 'intermediate',
  },
  'mecanum-wheel': {
    id: 'mecanum-wheel',
    name: 'Mecanum Wheel Drive',
    description: '4-wheel mecanum drive with omnidirectional movement',
    motorCount: 4,
    motors: [
      { position: 'fl', defaultName: 'frontLeft', required: true },
      { position: 'fr', defaultName: 'frontRight', required: true },
      { position: 'bl', defaultName: 'backLeft', required: true },
      { position: 'br', defaultName: 'backRight', required: true },
    ],
    movementCapabilities: {
      forward: true,
      backward: true,
      strafe: true,
      rotate: true,
      diagonal: true,
    },
    complexity: 'intermediate',
  },
  'x-drive': {
    id: 'x-drive',
    name: 'X-Drive (Holonomic)',
    description: '4-wheel X-configuration for holonomic movement',
    motorCount: 4,
    motors: [
      { position: 'fl', defaultName: 'frontLeft', required: true },
      { position: 'fr', defaultName: 'frontRight', required: true },
      { position: 'bl', defaultName: 'backLeft', required: true },
      { position: 'br', defaultName: 'backRight', required: true },
    ],
    movementCapabilities: {
      forward: true,
      backward: true,
      strafe: true,
      rotate: true,
      diagonal: true,
    },
    complexity: 'intermediate',
  },
  'h-drive': {
    id: 'h-drive',
    name: 'H-Drive',
    description: '5-motor drive with center strafe wheel for enhanced lateral movement',
    motorCount: 5,
    motors: [
      { position: 'fl', defaultName: 'frontLeft', required: true },
      { position: 'fr', defaultName: 'frontRight', required: true },
      { position: 'bl', defaultName: 'backLeft', required: true },
      { position: 'br', defaultName: 'backRight', required: true },
      { position: 'cl', defaultName: 'centerStrafe', required: true },
    ],
    movementCapabilities: {
      forward: true,
      backward: true,
      strafe: true,
      rotate: true,
      diagonal: true,
    },
    complexity: 'advanced',
  },
  'swerve-drive': {
    id: 'swerve-drive',
    name: 'Swerve Drive',
    description: 'Advanced 8-motor system with independent wheel steering (4 drive + 4 steering motors)',
    motorCount: 8,
    motors: [
      { position: 'fl', defaultName: 'frontLeftDrive', required: true },
      { position: 'fr', defaultName: 'frontRightDrive', required: true },
      { position: 'bl', defaultName: 'backLeftDrive', required: true },
      { position: 'br', defaultName: 'backRightDrive', required: true },
      { position: 'fl', defaultName: 'frontLeftSteer', required: true },
      { position: 'fr', defaultName: 'frontRightSteer', required: true },
      { position: 'bl', defaultName: 'backLeftSteer', required: true },
      { position: 'br', defaultName: 'backRightSteer', required: true },
    ],
    movementCapabilities: {
      forward: true,
      backward: true,
      strafe: true,
      rotate: true,
      diagonal: true,
    },
    complexity: 'advanced',
  },
}

// Helper function to get motor configuration for a drive train type
export function getMotorConfigForDriveTrainType(type: DriveTrainType) {
  return DRIVETRAIN_DEFINITIONS[type].motors
}

// Helper function to get default motor names
export function getDefaultMotorNames(type: DriveTrainType): Record<string, string> {
  const definition = DRIVETRAIN_DEFINITIONS[type]
  const config: Record<string, string> = {}

  definition.motors.forEach((motor, index) => {
    const key = motor.position + (index > 3 ? '_steer' : '')
    config[key] = motor.defaultName
  })

  return config
}
