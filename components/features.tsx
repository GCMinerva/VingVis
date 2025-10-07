"use client"

import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useMemo } from "react"
import { Check, Cpu, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import { geist } from "@/lib/fonts"
import { buildRobotKeyframes, orientPath, sampleCubicBezier, samplePolyline } from "@/lib/path-keyframes"

const FEATURES_SAMPLE_COUNT = 90
const FEATURES_BASELINE_FRACTION = 0.58
const FEATURES_REVEAL_START = 0.64
const FEATURES_HANDOFF_PAUSE = 0.6
const FEATURES_OFFSET_X = 24
const FEATURES_OFFSET_Y = 120
const FEATURES_ROBOT_RADIUS = 28

const FEATURES_BASELINE_SEGMENTS = [
  { x: 32, y: 184 },
  { x: 150, y: 184 },
  { x: 150, y: 140 },
  { x: 220, y: 140 },
  { x: 220, y: 80 },
]

const FEATURES_OPTIMIZED_CONTROL_POINTS = [
  { x: 32, y: 184 },
  { x: 120, y: 160 },
  { x: 184, y: 120 },
  { x: 220, y: 80 },
]

const toFeatureCssSpace = ({ x, y }: { x: number; y: number }) => ({
  x: x - FEATURES_ROBOT_RADIUS - FEATURES_OFFSET_X,
  y: y - FEATURES_ROBOT_RADIUS - FEATURES_OFFSET_Y,
})

const createFeatureRobotAnimation = () => {
  const baselineSamples = Math.round(FEATURES_SAMPLE_COUNT * FEATURES_BASELINE_FRACTION)
  const optimizedSamples = FEATURES_SAMPLE_COUNT - baselineSamples + 1

  const baselinePath = samplePolyline(FEATURES_BASELINE_SEGMENTS, baselineSamples).map(toFeatureCssSpace)
  const optimizedPath = sampleCubicBezier(
    FEATURES_OPTIMIZED_CONTROL_POINTS[0],
    FEATURES_OPTIMIZED_CONTROL_POINTS[1],
    FEATURES_OPTIMIZED_CONTROL_POINTS[2],
    FEATURES_OPTIMIZED_CONTROL_POINTS[3],
    optimizedSamples,
  ).map(toFeatureCssSpace)

  const keyframes = buildRobotKeyframes({
    baseline: orientPath(baselinePath),
    optimized: orientPath(optimizedPath),
    baselineFraction: FEATURES_BASELINE_FRACTION,
    revealStart: FEATURES_REVEAL_START,
    handoffPause: FEATURES_HANDOFF_PAUSE,
  })

  return {
    robotMotion: keyframes.keyframes,
    robotTransition: {
      duration: 12,
      repeat: Infinity,
      ease: "easeInOut" as const,
      times: keyframes.times,
    },
  }
}

const FEATURES_ROBOT_ANIMATION = createFeatureRobotAnimation()

const FlowPreview = dynamic(() => import("./feature-flow-preview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-white/10 bg-black/60 text-sm text-white/60">
      Preparing node canvas...
    </div>
  ),
})

type BentoCardProps = {
  eyebrow?: string
  title?: string
  description?: string
  className?: string
  contentClassName?: string
  children?: React.ReactNode
}

const BentoCard = ({ eyebrow, title, description, className, contentClassName, children }: BentoCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-[1px]",
        className,
      )}
    >
      <div
        className={cn(
          "h-full w-full rounded-[calc(theme(borderRadius.3xl)-1px)] bg-black/70 p-6",
          contentClassName,
        )}
      >
        {(eyebrow || title || description) && (
          <div className="space-y-3">
            {eyebrow && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-[#f0a36f]">
                {eyebrow}
              </span>
            )}
            {title && (
              <h3 className={cn("text-2xl font-semibold text-white leading-tight", geist.className)}>{title}</h3>
            )}
            {description && <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>}
          </div>
        )}
        {children && <div className={cn("mt-6", eyebrow || title || description ? "" : "mt-0")}>{children}</div>}
      </div>
    </div>
  )
}

const RobotPathAnimation = () => {
  const { robotMotion, robotTransition } = FEATURES_ROBOT_ANIMATION

  return (
    <div className="relative h-[340px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-900/80 via-black/80 to-zinc-900/60">
      <div className="absolute inset-0">
        <div className="absolute -left-24 -top-32 h-64 w-64 rounded-full bg-[#e78a53]/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-[#f0a36f]/10 blur-[100px]" />
      </div>
      <div className="absolute inset-6 overflow-hidden rounded-[22px] border border-white/10 bg-black/60 shadow-[0_40px_120px_rgba(231,138,83,0.08)]">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>
        <div className="relative h-full w-full">
          <svg
            viewBox="0 0 320 220"
            className="absolute inset-0 h-full w-full"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M32 184 L150 184 L150 140 L220 140 L220 80"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={5}
            />
            <motion.path
              d="M32 184 L150 184 L150 140 L220 140 L220 80"
              stroke="#f6f6f6"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 1, 0.2, 0.2] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", times: [0, 0.52, 0.62, 1] }}
            />
            <motion.path
              d="M32 184 C120 160 184 120 220 80"
              stroke="#e78a53"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 0, 1, 1], opacity: [0, 0, 1, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", times: [0, 0.6, 0.85, 1] }}
            />
          </svg>

          <motion.div
            className="absolute left-10 top-[60px] flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80 backdrop-blur"
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", times: [0, 0.48, 0.6, 1] }}
          >
            Baseline Path
          </motion.div>

          <motion.div
            className="absolute right-10 top-[60px] flex items-center gap-2 rounded-full bg-[#e78a53]/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#fcd7b7]"
            animate={{ opacity: [0, 0, 1, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", times: [0, 0.6, 0.72, 1] }}
          >
            Optimized Path
          </motion.div>

          <motion.div
            animate={robotMotion}
            transition={robotTransition}
            className="absolute left-6 top-[120px] flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e78a53] via-[#f0a36f] to-[#e78a53] shadow-[0_20px_40px_rgba(231,138,83,0.35)]"
          >
            <div className="relative flex size-8 items-center justify-center rounded-lg bg-black/60">
              <div className="absolute -top-1 size-2 rounded-full bg-white" />
              <div className="size-3 rounded-sm bg-white/80" />
            </div>
          </motion.div>

          <div className="absolute inset-x-10 bottom-2 flex items-center justify-between text-xs text-zinc-400">
            <div>
              <p className="font-semibold uppercase tracking-[0.3em] text-white/70">Step timeline</p>
              <p className="mt-1 text-[11px] text-zinc-400">
                Baseline route simulates drift and slow turns before the optimizer redraws a faster spline to the same
                target.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-2 w-2 rounded-full bg-white/40" />
                <span className="text-[11px] text-white/70">Original</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#e78a53]" />
                <span className="text-[11px] text-white/90">Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TelemetryBars = () => {
  const bars = useMemo(
    () => [
      { id: "1", base: 40, peak: 68, delay: 0 },
      { id: "2", base: 55, peak: 92, delay: 0.15 },
      { id: "3", base: 35, peak: 70, delay: 0.28 },
      { id: "4", base: 62, peak: 98, delay: 0.42 },
      { id: "5", base: 48, peak: 80, delay: 0.58 },
    ],
    [],
  )

  return (
    <div className="mt-6 flex h-40 items-end justify-between gap-2">
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="w-4 rounded-full bg-gradient-to-t from-[#e78a53]/15 via-[#e78a53]/60 to-[#f0a36f]"
          initial={{ height: `${bar.base}%` }}
          animate={{ height: [`${bar.base}%`, `${bar.peak}%`, `${bar.base}%`] }}
          transition={{ duration: 3.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: bar.delay }}
        />
      ))}
    </div>
  )
}

export default function Features() {
  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-40%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#e78a53]/15 blur-[180px]" />
        <div className="absolute -left-32 bottom-[-30%] h-[360px] w-[360px] rounded-full bg-[#f0a36f]/10 blur-[120px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
            VingVis Features
          </span>
          <h2
            className={cn(
              "mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl",
              geist.className,
            )}
          >
            Plan, optimize, and deploy your FTC autonomous faster than ever
          </h2>
          <p className="mt-4 text-base text-zinc-400 sm:text-lg">
            Every card in the VingVis Bento wall reflects a live capability -- from path tuning to no-code flow authoring --
            so your team can see progress before the robot even hits the field.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12">
          <BentoCard
            eyebrow="Field ready"
            title="Visual intelligence for real FTC matches"
            description="Translate drive coach sketches into competition-ready routines. Watch the robot walk each move, sync mechanisms, and push builds to the bot without touching Android Studio."
            className="xl:col-span-4"
          >
            <ul className="space-y-3 text-sm text-zinc-300">
              {[
                "Live walk-cycle optimizer with drift prediction",
                "Drag and drop node palettes for drivetrain, servo, and sensor actions",
                "Instant robot uploads with telemetry snapshots on every push",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-[#f0a36f]" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </BentoCard>

          <BentoCard className="md:col-span-2 xl:col-span-8" contentClassName="p-6">
            <RobotPathAnimation />
          </BentoCard>

          <BentoCard
            eyebrow="No-code / low-code"
            title="ReactFlow-powered logic builder"
            description="Wire start, move, and mechanism nodes with a single drag. VingVis keeps transforms, rotations, and sequencing in sync while you focus on field strategy."
            className="xl:col-span-5"
          >
            <FlowPreview />
          </BentoCard>

          <BentoCard
            eyebrow="Telemetry"
            title="Unlimited runs, automatic insights"
            description="Season Pass teams get full telemetry without credit limits. Spot slippage, battery sag, and mechanism latency before it costs you points."
            className="xl:col-span-3"
          >
            <TelemetryBars />
            <div className="mt-6 space-y-2 text-[11px] uppercase tracking-[0.3em] text-zinc-400">
              <div className="flex items-center gap-2 text-white/80">
                <Radio className="h-3 w-3 text-[#f0a36f]" />
                Field sampling at 120Hz
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Cpu className="h-3 w-3" />
                AI tuned mechanism offsets
              </div>
            </div>
          </BentoCard>

          <BentoCard
            eyebrow="VingVis robot library"
            title="Servo choreography and expansion hub support"
            description="Deploy complex subsystems in minutes with pre-tested libraries. Mix linear slides, dual intake, and custom attachments without breaking your teleop."
            className="md:col-span-2 xl:col-span-4"
          >
            <ul className="space-y-2 text-sm text-zinc-300">
              {[
                "Extension Hub templates for +4 motors and +4 servos",
                "Servo choreographer with conditional logic and state saves",
                "Cloud-synced versions so every driver station stays aligned",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 text-[#f0a36f]" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </BentoCard>
        </div>
      </div>
    </section>
  )
}
