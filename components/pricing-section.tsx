"use client"

import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"

const pricingPlans = [
  {
    name: "Free",
    priceLabel: "$0",
    cadence: "per team",
    description: "Build your first autonomous routine the visual way.",
    features: [
      "Drag-and-drop node editor",
      "2 saved routines",
      "50 telemetry credits",
      "Starter drivetrain & servo nodes",
    ],
    popular: false,
    cta: "Start for free",
  },
  {
    name: "FTC Season Pass",
    priceLabel: "$30",
    cadence: "per season",
    description: "Unlock pro-grade tooling for high scoring autonomous runs.",
    features: [
      "Path optimizer with walking robot preview",
      "Ovoid field kits & obstacle packs",
      "AI Kit with pre-trained scoring model",
      "Unlimited telemetry (no credits)",
      "Upload to robot directly from the web",
      "Cloud saves & team sharing",
      "Expansion Hub support (+4 motors/+4 servos)",
      "Custom Advanced TeleOp designer",
    ],
    popular: true,
    cta: "Upgrade for $30",
  },
] as const

export function PricingSection() {
  return (
    <section className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#e78a53]" />
            <span className="text-sm font-medium text-white/80">Pricing</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-4">
            Season-ready plans for FTC teams
          </h2>

          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Publish a match-ready autonomous in minutes. Upgrade when you need advanced hardware support and optimization.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`relative rounded-2xl p-8 backdrop-blur-sm border transition-all duration-300 ${
                plan.popular
                  ? "bg-gradient-to-b from-[#e78a53]/15 to-transparent border-[#e78a53]/30 shadow-lg shadow-[#e78a53]/15"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-[#e78a53] to-[#e78a53]/80 text-white text-sm font-medium px-4 py-2 rounded-full">
                    Most Picked
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-white">{plan.priceLabel}</span>
                  <span className="text-white/60 text-base">{plan.cadence}</span>
                </div>
                <p className="text-white/60 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8 text-left">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#e78a53] flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  plan.popular
                    ? "bg-gradient-to-r from-[#e78a53] to-[#e78a53]/80 text-white shadow-lg shadow-[#e78a53]/25 hover:shadow-[#e78a53]/40"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-white/60 mb-4">Need something tailored for your control system?</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[#e78a53] hover:text-[#e78a53]/80 font-medium transition-colors"
          >
            Talk with the VingVis team
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
