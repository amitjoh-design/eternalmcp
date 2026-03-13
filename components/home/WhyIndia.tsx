'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Building2, GraduationCap, TrendingUp, Scale, Zap } from 'lucide-react'

const INDIA_REASONS = [
  {
    icon: Users,
    stat: '1.4B',
    title: 'Market Size',
    description:
      "India is the world's most populous nation with 600M+ internet users — the largest untapped AI market on the planet.",
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    statColor: 'from-primary to-violet-glow',
  },
  {
    icon: Building2,
    stat: '70M+',
    title: 'SME Opportunity',
    description:
      '70 million SMEs with near-zero AI adoption — a massive, underserved market hungry for no-code, safe AI tools.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    statColor: 'from-emerald-400 to-teal-500',
  },
  {
    icon: GraduationCap,
    stat: '$7B+',
    title: 'EdTech Readiness',
    description:
      "India's EdTech market is booming. AI literacy is the next wave — and Constitutional AI is the right foundation.",
    color: 'text-accent',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    statColor: 'from-accent to-blue-500',
  },
  {
    icon: TrendingUp,
    stat: '40M+',
    title: 'Fintech Synergy',
    description:
      '40M+ retail equity investors. EternalMCP + EternalQuants + DeltaFlow forms a complete fintech AI stack for India.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    statColor: 'from-orange-400 to-amber-500',
  },
  {
    icon: Scale,
    stat: 'Evolving',
    title: 'Regulatory Climate',
    description:
      "India's AI policy is moving fast — with a clear emphasis on responsible, safe AI. Constitutional AI is a strategic fit.",
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    statColor: 'from-violet-400 to-purple-500',
  },
  {
    icon: Zap,
    stat: 'First',
    title: 'Claude Penetration',
    description:
      "Claude adoption in India is still early. EternalMCP is building first-mover, deep market penetration — exclusively for the Constitutional AI ecosystem.",
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    statColor: 'from-yellow-400 to-orange-400',
  },
]

export function WhyIndia() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/3 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-300 mb-6">
            🇮🇳 WHY INDIA — WHY NOW
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-text-primary mb-4">
            The world&apos;s largest{' '}
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-primary to-accent bg-clip-text text-transparent">
              AI opportunity
            </span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            India will produce the world&apos;s largest AI user base in the next decade.
            EternalMCP&apos;s mission is to ensure that user base is built on Constitutional AI —
            safely, responsibly, and exclusively on Claude.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {INDIA_REASONS.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className={`group p-6 bg-surface border ${reason.border} rounded-xl hover:translate-y-[-2px] transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 ${reason.bg} border ${reason.border} rounded-xl flex items-center justify-center`}>
                  <reason.icon size={22} className={reason.color} />
                </div>
                <span className={`text-3xl font-black bg-gradient-to-r ${reason.statColor} bg-clip-text text-transparent`}>
                  {reason.stat}
                </span>
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-2">{reason.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative rounded-2xl bg-gradient-to-r from-orange-500/10 via-primary/10 to-accent/10 border border-orange-500/20 p-8 sm:p-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-mesh opacity-20 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
                600M+ internet users. Zero access to safe AI.
              </p>
              <p className="text-text-secondary max-w-xl">
                EternalMCP changes that — one no-code Constitutional AI tool at a time.
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-orange-400 to-primary bg-clip-text text-transparent">₹0</div>
                <div className="text-xs text-muted mt-1">Code Required</div>
              </div>
              <div className="w-px h-10 bg-border-subtle" />
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">3</div>
                <div className="text-xs text-muted mt-1">Tiers Available</div>
              </div>
              <div className="w-px h-10 bg-border-subtle" />
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">100%</div>
                <div className="text-xs text-muted mt-1">Claude-Powered</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
