"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const faqs = [
    {
      question: "How does VingVis connect to our FTC robot?",
      answer:
        "Pair the Control Hub or Expansion Hub over Wi-Fi or USB, choose your target in the deploy dialog, and VingVis pushes the compiled routine straight to the robot with built-in telemetry streaming.",
    },
    {
      question: "Can we mix low-code blocks with our own Java?",
      answer:
        "Yes. Drop in custom Java or Kotlin nodes wherever you need advanced logic. VingVis automatically wires them into the generated op mode so you keep full control when it matters.",
    },
    {
      question: "How many mechanisms can the library handle?",
      answer:
        "Season Pass teams get expansion hub templates for four extra motors and four extra servos, plus ready-to-use choreographies for intakes, slides, turrets, and endgame attachments.",
    },
    {
      question: "Does the optimizer account for drift?",
      answer:
        "Every path is simulated with field-aware motion planning and telemetry feedback. VingVis shows predicted drift, recommends alternate approach angles, and lets you lock in the correction with a single click.",
    },
    {
      question: "What if our team runs multiple robots?",
      answer:
        "Cloud projects keep routines, telemetry, and wiring presets in sync across squads. You can clone a project, adjust hardware mappings, and be match-ready in minutes.",
    },
    {
      question: "How fast can we deploy after tuning?",
      answer:
        "Teams usually redeploy in under 30 seconds. VingVis bundles the autonomous, pushes it to the hub, restarts the op mode, and shows a telemetry diff so you can run the next iteration immediately.",
    },
  ]

  return (
    <section id="faq" className="relative overflow-hidden pb-120 pt-24">
      {/* Background blur effects */}
      <div className="bg-primary/20 absolute top-1/2 -right-20 z-[-1] h-64 w-64 rounded-full opacity-80 blur-3xl"></div>
      <div className="bg-primary/20 absolute top-1/2 -left-20 z-[-1] h-64 w-64 rounded-full opacity-80 blur-3xl"></div>

      <div className="z-10 container mx-auto px-4">
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="border-primary/40 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 uppercase">
            <span>*</span>
            <span className="text-sm">Faqs</span>
          </div>
        </motion.div>

        <motion.h2
          className="mx-auto mt-6 max-w-xl text-center text-4xl font-medium md:text-[54px] md:leading-[60px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Questions? We've got{" "}
          <span className="bg-gradient-to-b from-foreground via-rose-200 to-primary bg-clip-text text-transparent">
            answers
          </span>
        </motion.h2>

        <div className="mx-auto mt-12 grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr]">
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true }}
          >
            <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-[#e78a53]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-0 h-44 w-44 rounded-full bg-[#f0a36f]/20 blur-[120px]" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                Quick facts
              </div>
              <h3 className="text-2xl font-semibold text-white md:text-3xl">Built for scouting captains and drive teams</h3>
              <p className="text-sm text-zinc-300 md:text-base">
                Every workflow in VingVis is mapped to an FTC pit checklist. Tune a path, sync a mechanism, deploy, and review
                telemetry without leaving the browser.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Average deploy time", value: "28 s" },
                  { label: "Nodes in library", value: "48 commands" },
                  { label: "Telemetry retention", value: "30 days" },
                  { label: "Field plans saved", value: "Unlimited" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/60">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                className="from-secondary/40 to-secondary/10 cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-b p-5 shadow-[0px_2px_0px_0px_rgba(255,255,255,0.08)_inset] transition-all duration-300 hover:border-white/20"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (index % 3) }}
                viewport={{ once: true }}
                whileHover={{ translateY: -4 }}
                onClick={() => toggleItem(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggleItem(index)
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="m-0 text-sm font-semibold text-white">{faq.question}</h3>
                  <motion.div
                    animate={{ rotate: openItems.includes(index) ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {openItems.includes(index) ? (
                      <Minus className="text-primary flex-shrink-0 transition duration-300" size={20} />
                    ) : (
                      <Plus className="text-primary flex-shrink-0 transition duration-300" size={20} />
                    )}
                  </motion.div>
                </div>
                <AnimatePresence>
                  {openItems.includes(index) && (
                    <motion.p
                      className="mt-3 text-xs leading-relaxed text-zinc-300 md:text-sm"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{
                        duration: 0.35,
                        ease: "easeInOut",
                        opacity: { duration: 0.2 },
                      }}
                    >
                      {faq.answer}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
