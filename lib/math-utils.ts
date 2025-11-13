/**
 * Math utilities for path planning and visualization
 * Ported from Pedro-Pathing Visualizer
 */

export interface BasePoint {
  x: number
  y: number
}

/**
 * Convert a quadratic Bezier curve to a cubic Bezier curve
 */
export function quadraticToCubic(
  P0: BasePoint,
  P1: BasePoint,
  P2: BasePoint
): { Q1: BasePoint; Q2: BasePoint } {
  const Q1 = {
    x: P0.x + (2 / 3) * (P1.x - P0.x),
    y: P0.y + (2 / 3) * (P1.y - P0.y),
  }

  const Q2 = {
    x: P2.x + (2 / 3) * (P1.x - P2.x),
    y: P2.y + (2 / 3) * (P1.y - P2.y),
  }

  return { Q1, Q2 }
}

/**
 * Ease-in-out quadratic easing function
 */
export function easeInOutQuad(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

/**
 * Get mouse position relative to an element
 */
export function getMousePos(evt: MouseEvent, element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  }
}

/**
 * Get viewport height percentage
 */
export function vh(percent: number) {
  const h = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  )
  return (percent * h) / 100
}

/**
 * Get viewport width percentage
 */
export function vw(percent: number) {
  const w = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 0
  )
  return (percent * w) / 100
}

/**
 * Transform angle to range -180 to 180
 */
export function transformAngle(angle: number) {
  return ((angle + 180) % 360) - 180
}

/**
 * Calculate shortest rotation between two angles
 */
export function shortestRotation(
  startAngle: number,
  endAngle: number,
  percentage: number
) {
  // Normalize the angles to the range 0 to 360
  startAngle = (startAngle + 360) % 360
  endAngle = (endAngle + 360) % 360

  // Calculate the difference between the angles
  let difference = endAngle - startAngle

  // Adjust the difference to take the shortest path
  if (difference > 180) {
    difference -= 360
  } else if (difference < -180) {
    difference += 360
  }

  // Calculate the interpolated angle
  const result = startAngle + difference * percentage

  return result
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number) {
  return radians * (180 / Math.PI)
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180)
}

/**
 * Linear interpolation
 */
export function lerp(ratio: number, start: number, end: number) {
  return start + (end - start) * ratio
}

/**
 * 2D linear interpolation
 */
export function lerp2d(ratio: number, start: BasePoint, end: BasePoint) {
  return {
    x: lerp(ratio, start.x, end.x),
    y: lerp(ratio, start.y, end.y),
  }
}

/**
 * Get a point on a Bezier curve using De Casteljau's algorithm
 */
export function getCurvePoint(t: number, points: BasePoint[]): BasePoint {
  if (points.length === 1) return points[0]
  const newpoints: BasePoint[] = []
  for (let i = 0, j = 1; j < points.length; i++, j++) {
    newpoints[i] = lerp2d(t, points[i], points[j])
  }
  return getCurvePoint(t, newpoints)
}

/**
 * Calculate distance between two points
 */
export function distance(p1: BasePoint, p2: BasePoint): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
