"use client"

import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useMemo } from "react"
import { Check, Cpu, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import { geist } from "@/lib/fonts"

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
  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
      {/* Background gradients */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-1/4 top-0 h-[300px] w-[300px] rounded-full bg-[#e78a53]/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[250px] w-[250px] rounded-full bg-[#f0a36f]/15 blur-[100px]" />
      </div>

      {/* Main content */}
      <div className="relative h-full w-full p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Path Optimization</h3>
            <p className="mt-1 text-sm text-zinc-400">Baseline vs Optimized Route</p>
          </div>
          <div className="flex gap-4">
            <motion.div
              className="flex items-center gap-2"
              animate={{ opacity: [1, 1, 0.4, 0.4] }}
              transition={{ duration: 10, repeat: Infinity, times: [0, 0.45, 0.55, 1] }}
            >
              <div className="h-3 w-3 rounded-full border-2 border-white/60" />
              <span className="text-xs text-white/70">Baseline Path</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-2"
              animate={{ opacity: [0, 0, 1, 1] }}
              transition={{ duration: 10, repeat: Infinity, times: [0, 0.5, 0.6, 1] }}
            >
              <div className="h-3 w-3 rounded-full bg-[#e78a53]" />
              <span className="text-xs text-[#fcd7b7]">Optimized Path</span>
            </motion.div>
          </div>
        </div>

        {/* Animation canvas */}
        <div className="relative h-[240px] w-full rounded-xl border border-white/5 bg-black/40 p-6">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:40px_40px]" />
          </div>

          {/* SVG paths and robot */}
          <svg viewBox="0 0 600 180" className="absolute inset-6 h-[calc(100%-48px)] w-[calc(100%-48px)]" fill="none">
            <defs>
              <filter id="pathGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Start point */}
            <circle cx="50" cy="140" r="8" fill="#e78a53" opacity="0.3" />
            <circle cx="50" cy="140" r="4" fill="#e78a53" />

            {/* End point */}
            <circle cx="550" cy="40" r="8" fill="#4ade80" opacity="0.3" />
            <circle cx="550" cy="40" r="4" fill="#4ade80" />

            {/* Baseline path - jagged/angular */}
            <motion.path
              d="M 50 140 L 180 140 L 180 100 L 320 100 L 320 60 L 450 60 L 450 40 L 550 40"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="10 5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 0.6, 0.2, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear", times: [0, 0.45, 0.52, 1] }}
            />

            {/* Optimized path - smooth curve */}
            <motion.path
              d="M 50 140 Q 200 130 350 80 T 550 40"
              stroke="#e78a53"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#pathGlow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 0, 1, 1], opacity: [0, 0, 1, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeOut", times: [0, 0.5, 0.75, 1] }}
            />

            {/* Robot - follows the paths */}
            <motion.g
              initial={{ x: 50, y: 140 }}
              animate={{
                x: [50, 180, 180, 320, 320, 450, 450, 500, 550, 550, 550],
                y: [140, 140, 100, 100, 60, 60, 40, 40, 40, 40, 40],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.15, 0.2, 0.3, 0.35, 0.42, 0.45, 0.48, 0.5, 0.9, 1],
                repeatDelay: 5,
              }}
            >
              {/* Robot body */}
              <rect x="-12" y="-12" width="24" height="24" rx="6" fill="url(#robotGradient)" />
              <defs>
                <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e78a53" />
                  <stop offset="100%" stopColor="#f0a36f" />
                </linearGradient>
              </defs>
              {/* Robot eye */}
              <circle cx="0" cy="-4" r="3" fill="white" />
              <circle cx="0" cy="2" r="4" fill="white" opacity="0.6" />
            </motion.g>

            {/* Second robot - follows optimized path */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0, 1, 1, 1, 1],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                times: [0, 0.5, 0.52, 0.95, 0.98, 1],
                repeatDelay: 5,
              }}
            >
              <motion.g
                animate={{
                  x: [50, 150, 250, 350, 450, 550],
                  y: [140, 132, 110, 85, 58, 40],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 5,
                  repeatDelay: 7.5,
                }}
              >
                {/* Optimized robot body */}
                <rect x="-12" y="-12" width="24" height="24" rx="6" fill="url(#robotGradient2)" />
                <defs>
                  <linearGradient id="robotGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f0a36f" />
                    <stop offset="100%" stopColor="#e78a53" />
                  </linearGradient>
                </defs>
                {/* Robot eye */}
                <circle cx="0" cy="-4" r="3" fill="white" />
                <circle cx="0" cy="2" r="4" fill="white" opacity="0.6" />
                {/* Speed trail */}
                <motion.circle
                  cx="0"
                  cy="0"
                  r="16"
                  fill="none"
                  stroke="#e78a53"
                  strokeWidth="2"
                  opacity="0.4"
                  animate={{ r: [12, 20], opacity: [0.6, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </motion.g>
            </motion.g>
          </svg>
        </div>

        {/* Footer description */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-white/40 to-transparent" />
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Step Timeline</p>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Baseline route simulates drift and slow turns before the optimizer redraws a faster spline to the same
            target.
          </p>
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
