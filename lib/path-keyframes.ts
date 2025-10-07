export type Point = {
  x: number
  y: number
}

export type OrientedPoint = Point & {
  angle: number
}

const clampSamples = (samples: number) => Math.max(2, Math.floor(samples))

export const samplePolyline = (points: Point[], samples: number): Point[] => {
  const safeSamples = clampSamples(samples)
  if (points.length < 2) {
    return Array.from({ length: safeSamples }, () => ({ ...points[0] }))
  }

  const segments = points.slice(1).map((point, index) => {
    const start = points[index]
    const end = point
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.hypot(dx, dy)
    return { start, end, length }
  })

  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0)
  if (totalLength === 0) {
    return Array.from({ length: safeSamples }, () => ({ ...points[0] }))
  }

  return Array.from({ length: safeSamples }, (_, sampleIndex) => {
    const distance = (totalLength * sampleIndex) / (safeSamples - 1)
    let covered = 0

    for (const segment of segments) {
      if (covered + segment.length >= distance || segment === segments[segments.length - 1]) {
        const segmentDistance = Math.max(0, distance - covered)
        const t = segment.length === 0 ? 0 : segmentDistance / segment.length
        return {
          x: segment.start.x + (segment.end.x - segment.start.x) * t,
          y: segment.start.y + (segment.end.y - segment.start.y) * t,
        }
      }
      covered += segment.length
    }

    return { ...points[points.length - 1] }
  })
}

export const sampleCubicBezier = (p0: Point, p1: Point, p2: Point, p3: Point, samples: number): Point[] => {
  const safeSamples = clampSamples(samples)

  return Array.from({ length: safeSamples }, (_, index) => {
    const t = index / (safeSamples - 1)
    const u = 1 - t
    const tt = t * t
    const uu = u * u
    const uuu = uu * u
    const ttt = tt * t

    const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x
    const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y

    return { x, y }
  })
}

export const orientPath = (points: Point[]): OrientedPoint[] => {
  if (points.length === 0) {
    return []
  }

  if (points.length === 1) {
    return [{ ...points[0], angle: 0 }]
  }

  return points.map((point, index) => {
    const prev = points[index === 0 ? index : index - 1]
    const next = points[Math.min(points.length - 1, index + 1)]
    const angle = Math.atan2(next.y - prev.y, next.x - prev.x) * (180 / Math.PI)
    return { ...point, angle }
  })
}

type KeyframeBuildConfig = {
  baseline: OrientedPoint[]
  optimized: OrientedPoint[]
  baselineFraction: number
  revealStart: number
  handoffPause?: number
}

export const buildRobotKeyframes = ({
  baseline,
  optimized,
  baselineFraction,
  revealStart,
  handoffPause = 0.6,
}: KeyframeBuildConfig) => {
  if (baseline.length === 0 || optimized.length === 0) {
    return {
      keyframes: {
        x: [0, 0],
        y: [0, 0],
        rotate: [0, 0],
        opacity: [0, 0],
      },
      times: [0, 1],
    }
  }

  const baselineTimes = baseline.map((_, index) =>
    (index / Math.max(1, baseline.length - 1)) * baselineFraction,
  )

  const optimizedTimes = optimized.map(
    (_, index) => revealStart + (index / Math.max(1, optimized.length - 1)) * (1 - revealStart),
  )

  const optimizedTail = optimized.slice(1)
  const baselineEnd = baseline[baseline.length - 1]
  const optimizedStart = optimized[0]

  const keyframeTimes = [...baselineTimes, handoffPause, revealStart, ...optimizedTimes.slice(1)]

  const keyframeX = [
    ...baseline.map((point) => point.x),
    baselineEnd.x,
    optimizedStart.x,
    ...optimizedTail.map((point) => point.x),
  ]
  const keyframeY = [
    ...baseline.map((point) => point.y),
    baselineEnd.y,
    optimizedStart.y,
    ...optimizedTail.map((point) => point.y),
  ]
  const keyframeRotate = [
    ...baseline.map((point) => point.angle),
    baselineEnd.angle,
    optimizedStart.angle,
    ...optimizedTail.map((point) => point.angle),
  ]
  const keyframeOpacity = [
    ...baseline.map(() => 1),
    0,
    0,
    ...optimizedTail.map(() => 1),
  ]

  return {
    keyframes: {
      x: keyframeX,
      y: keyframeY,
      rotate: keyframeRotate,
      opacity: keyframeOpacity,
    },
    times: keyframeTimes,
  }
}
