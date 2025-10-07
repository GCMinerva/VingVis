"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function WaitlistPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(231,138,83,0.2),transparent_60%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full flex-col items-center justify-center px-6 py-24 text-center sm:max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70"
        >
          VingVis Waitlist
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-4xl font-bold sm:text-[46px] sm:leading-tight"
        >
          We&apos;re prepping the next drop of Minerva/VingVis.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-4 text-base text-zinc-300"
        >
          Join the waitlist and be first to deploy autonomous routines with live telemetry insights, servo choreographer, and
          cloud projects made for FTC teams.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-10 flex w-full flex-col gap-4 sm:flex-row"
        >
          <input
            type="email"
            required
            placeholder="Your email"
            className="w-full rounded-full border border-white/10 bg-black/60 px-5 py-3 text-sm text-white outline-none transition hover:border-white/30 focus:border-[#e78a53]"
          />
          <button
            type="submit"
            className="rounded-full bg-[#e78a53] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f19f6e]"
          >
            Join waitlist
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.36 }}
          className="mt-8 text-xs text-zinc-500"
        >
          We&apos;ll reach out with beta access and behind-the-scenes build notes.
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42 }}
          className="mt-12 text-sm text-zinc-400"
        >
          <Link href="/" className="text-[#e78a53] hover:text-[#f19f6e]">
            ← Back to home
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
