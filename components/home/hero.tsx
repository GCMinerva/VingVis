"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { buildRobotKeyframes, orientPath, sampleCubicBezier, samplePolyline } from "@/lib/path-keyframes"

const HERO_SAMPLE_COUNT = 80
const HERO_BASELINE_FRACTION = 0.58
const HERO_REVEAL_START = 0.64
const HERO_HANDOFF_PAUSE = 0.6
const HERO_OFFSET = 24
const HERO_ROBOT_RADIUS = 24

const HERO_BASELINE_SEGMENTS = [
  { x: 20, y: 180 },
  { x: 100, y: 180 },
  { x: 100, y: 100 },
  { x: 180, y: 100 },
  { x: 180, y: 20 },
]

const HERO_OPTIMIZED_CONTROL_POINTS = [
  { x: 20, y: 180 },
  { x: 92, y: 156 },
  { x: 140, y: 118 },
  { x: 180, y: 20 },
]

const toHeroCssSpace = ({ x, y }: { x: number; y: number }) => ({
  x: x - HERO_ROBOT_RADIUS - HERO_OFFSET,
  y: y - HERO_ROBOT_RADIUS - HERO_OFFSET,
})

const createHeroRobotAnimation = () => {
  const baselineSamples = Math.round(HERO_SAMPLE_COUNT * HERO_BASELINE_FRACTION)
  const optimizedSamples = HERO_SAMPLE_COUNT - baselineSamples + 1

  const baselinePath = samplePolyline(HERO_BASELINE_SEGMENTS, baselineSamples).map(toHeroCssSpace)
  const optimizedPath = sampleCubicBezier(
    HERO_OPTIMIZED_CONTROL_POINTS[0],
    HERO_OPTIMIZED_CONTROL_POINTS[1],
    HERO_OPTIMIZED_CONTROL_POINTS[2],
    HERO_OPTIMIZED_CONTROL_POINTS[3],
    optimizedSamples,
  ).map(toHeroCssSpace)

  const heroKeyframes = buildRobotKeyframes({
    baseline: orientPath(baselinePath),
    optimized: orientPath(optimizedPath),
    baselineFraction: HERO_BASELINE_FRACTION,
    revealStart: HERO_REVEAL_START,
    handoffPause: HERO_HANDOFF_PAUSE,
  })

  return {
    robotPath: heroKeyframes.keyframes,
    boardTransition: {
      duration: 12,
      repeat: Infinity,
      ease: "easeInOut" as const,
      times: heroKeyframes.times,
    },
  }
}

const HERO_ROBOT_ANIMATION = createHeroRobotAnimation()

export default function Hero() {
  const { robotPath, boardTransition } = HERO_ROBOT_ANIMATION

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(231,138,83,0.18),transparent_55%)]" />
      <motion.pre
        className="pointer-events-none absolute left-[-12%] top-[12%] hidden max-w-xl rounded-3xl border border-white/5 bg-black/65 p-6 font-mono text-xs leading-relaxed text-emerald-100/70 shadow-[0_20px_60px_rgba(0,0,0,0.45)] md:block"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: [0.4, 0.75, 0.4], y: [40, 0, 40] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
{`path.start(x: 0, y: 0)
  .driveTo(36, 8)
  .turn(90)
  .servo("intake", "in")
  .driveTo(48, 48)
  .deploy("score")
  .telemetry("freight", true);`}
      </motion.pre>

      <div className="relative z-10 mx-auto flex min-h-screen w-full flex-col justify-center px-4 py-20 sm:py-32 lg:max-w-6xl lg:flex-row lg:items-center lg:gap-16">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Badge variant="secondary" className="inline-flex items-center gap-2 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4" />
              FTC Autonomous Builder
            </Badge>
          </motion.div>

          <motion.h1
            id="main-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-[52px] sm:leading-[1.05] lg:text-[64px]"
          >
            Draw your route, drop in mechanisms, deploy in under a minute.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg text-zinc-300"
          >
            VingVis keeps your FTC autonomous in sync. Visualize drivetrain motion, choreograph servos, and publish to the
            Control Hub without touching Android Studio.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >
            <a
              href="/waitlist"
              className="inline-flex items-center rounded-full bg-[#e78a53] px-6 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[#f19f6e]"
            >
              Join the waitlist
            </a>
            <a
              href="#features"
              className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              Explore features
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.38 }}
            className="mt-10 flex flex-wrap items-center gap-4 text-xs text-zinc-400"
          >
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              Live telemetry stream
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
              Upload to robot in 28 s
            </span>
          </motion.div>
        </div>

        <div className="relative mt-16 flex-1 lg:mt-0">
          <div className="relative mx-auto max-w-md">
            <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-white/15 via-white/5 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/70 p-6 shadow-[0_30px_100px_rgba(231,138,83,0.25)]">
              <div className="relative h-[260px] w-full rounded-[24px] border border-white/10 bg-gradient-to-br from-black via-[#0d0d0d] to-[#131313]">
                <div className="absolute inset-0 opacity-30">
                  <div className="grid h-full w-full grid-cols-6 grid-rows-6">
                    {Array.from({ length: 36 }).map((_, idx) => (
                      <div key={idx} className="border border-white/5" />
                    ))}
                  </div>
                </div>
                <svg className="absolute inset-6 h-[200px] w-[200px]" viewBox="0 0 200 200" fill="none">
                  <path d="M20 180 L100 180 L100 100 L180 100 L180 20" stroke="rgba(255,255,255,0.12)" strokeWidth={6} />
                  <path
                    d="M20 180 C92 156 140 118 180 20"
                    stroke="rgba(231,138,83,0.25)"
                    strokeWidth={8}
                    strokeLinecap="round"
                  />
                  <motion.path
                    d="M20 180 C92 156 140 118 180 20"
                    stroke="#e78a53"
                    strokeWidth={4}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "1 1", strokeDashoffset: 1 }}
                    animate={{ strokeDashoffset: [1, 1, 0, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", times: [0, 0.58, 0.82, 1] }}
                  />
                </svg>
                <motion.div
                  className="absolute left-6 top-6 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#e78a53] via-[#f0a36f] to-[#e78a53] shadow-[0_15px_30px_rgba(231,138,83,0.35)]"
                  animate={robotPath}
                  transition={boardTransition}
                >
                  <div className="relative flex size-6 items-center justify-center rounded-md bg-black/60">
                    <div className="absolute -top-1 size-1.5 rounded-full bg-white" />
                    <div className="size-2.5 rounded-sm bg-white/80" />
                  </div>
                </motion.div>
                <motion.div
                  className="absolute left-8 top-8 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/75"
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 0.6, 1] }}
                >
                  Baseline
                </motion.div>
                <motion.div
                  className="absolute right-8 top-8 rounded-full bg-[#e78a53]/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#fcd7b7]"
                  animate={{ opacity: [0, 0, 1, 1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", times: [0, 0.6, 0.7, 1] }}
                >
                  Optimized
                </motion.div>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-zinc-400">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Step timeline</p>
                  <p className="mt-1 max-w-[220px] text-[11px] text-zinc-400">
                    Robot walks the baseline first, then reroutes through the optimizer to win back precious seconds.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-white/70">
                    <span className="inline-flex h-2 w-2 rounded-full bg-white/40" />
                    Original
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-white/90">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#e78a53]" />
                    Optimized
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
