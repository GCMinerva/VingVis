"use client"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

const navColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Robot Library", href: "/#features" },
      { label: "Release Notes", href: "/new-release" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Discord", href: "https://discord.gg" },
      { label: "YouTube", href: "https://youtube.com" },
      { label: "Support", href: "/contact" },
    ],
  },
]

export function StickyFooter() {
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY
          const windowHeight = window.innerHeight
          const documentHeight = document.documentElement.scrollHeight
          const isNearBottom = scrollTop + windowHeight >= documentHeight - 120

          setIsAtBottom(isNearBottom)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isAtBottom && (
        <motion.footer
          className="fixed bottom-0 left-0 z-50 w-full pb-6"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="relative mx-auto flex max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/90 px-6 py-8 shadow-[0_30px_80px_rgba(231,138,83,0.25)] md:px-10 lg:px-14">
            <div className="pointer-events-none absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#e78a53]/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-28 top-0 h-72 w-72 rounded-full bg-[#f0a36f]/10 blur-[160px]" />
            <div className="relative grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr]">
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70"
                >
                  Ready to deploy
                </motion.div>
                <motion.h3
                  className="text-3xl font-semibold text-white md:text-[36px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.18 }}
                >
                  Ship a match-ready autonomous before your next scrimmage.
                </motion.h3>
                <motion.p
                  className="text-sm text-zinc-300 md:text-base"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.24 }}
                >
                  VingVis keeps drivetrain paths, servo choreography, and telemetry in sync so your team can focus on
                  field strategy instead of rewriting code at midnight.
                </motion.p>
                <motion.div
                  className="flex flex-wrap items-center gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Link
                    href="/signup"
                    className="inline-flex items-center rounded-full bg-[#e78a53] px-5 py-2 text-sm font-semibold text-black transition transform-gpu hover:-translate-y-0.5 hover:bg-[#f19f6e]"
                  >
                    Get Started
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#e78a53]" />
                    <span>Deploy autonomous in under a minute</span>
                  </div>
                </motion.div>
              </div>

              <div className="grid gap-6 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-3">
                {navColumns.map((column) => (
                  <motion.div
                    key={column.title}
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.18 }}
                  >
                    <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">{column.title}</h4>
                    <ul className="space-y-2">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="text-sm text-zinc-300 transition hover:text-white"
                            target={link.href.startsWith("http") ? "_blank" : undefined}
                            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-zinc-400 md:flex-row md:items-center md:justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.36 }}
            >
              <span>© 2025 Jnx03 under GcMinerva Project. Built for FTC innovators!</span>
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  Cloud sync: Operational
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
                  Telemetry hub latency &lt; 12 ms
                </span>
              </div>
            </motion.div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  )
}
