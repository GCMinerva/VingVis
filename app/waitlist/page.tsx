"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function WaitlistPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    ftcTeamName: "",
    ftcTeamId: "",
    email: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ftc_team_name: formData.ftcTeamName,
          ftc_team_id: formData.ftcTeamId,
          email: formData.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist')
      }

      setSuccess(true)
      setFormData({
        ftcTeamName: "",
        ftcTeamId: "",
        email: "",
      })
    } catch (err: any) {
      setError(err.message || 'Failed to join waitlist')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(231,138,83,0.2),transparent_60%)]" />
        <div className="relative z-10 mx-auto flex min-h-screen w-full flex-col items-center justify-center px-6 py-24 text-center sm:max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="rounded-full bg-green-500/10 p-4 mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold sm:text-[46px] sm:leading-tight mb-4">
              You&apos;re on the list!
            </h1>
            <p className="text-base text-zinc-300 mb-8">
              We&apos;ll reach out to your team with beta access and behind-the-scenes build notes soon.
            </p>
            <Link
              href="/"
              className="rounded-full bg-[#e78a53] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f19f6e]"
            >
              Back to home
            </Link>
          </motion.div>
        </div>
      </main>
    )
  }

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
          onSubmit={handleSubmit}
          className="mt-10 w-full space-y-4"
        >
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-left">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-2 text-left">
            <label htmlFor="ftcTeamName" className="block text-sm font-medium text-zinc-300">
              FTC Team Name
            </label>
            <input
              id="ftcTeamName"
              type="text"
              required
              placeholder="e.g., Robo Warriors"
              value={formData.ftcTeamName}
              onChange={(e) => setFormData({ ...formData, ftcTeamName: e.target.value })}
              className="w-full rounded-full border border-white/10 bg-black/60 px-5 py-3 text-sm text-white outline-none transition hover:border-white/30 focus:border-[#e78a53]"
            />
          </div>

          <div className="space-y-2 text-left">
            <label htmlFor="ftcTeamId" className="block text-sm font-medium text-zinc-300">
              FTC Team ID
            </label>
            <input
              id="ftcTeamId"
              type="text"
              required
              placeholder="e.g., 12345"
              value={formData.ftcTeamId}
              onChange={(e) => setFormData({ ...formData, ftcTeamId: e.target.value })}
              className="w-full rounded-full border border-white/10 bg-black/60 px-5 py-3 text-sm text-white outline-none transition hover:border-white/30 focus:border-[#e78a53]"
            />
          </div>

          <div className="space-y-2 text-left">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              Gmail Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="your.email@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-full border border-white/10 bg-black/60 px-5 py-3 text-sm text-white outline-none transition hover:border-white/30 focus:border-[#e78a53]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#e78a53] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f19f6e] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Joining..." : "Join waitlist"}
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
