'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Shield, Heart, Puzzle, GraduationCap, Users, Lock } from 'lucide-react'

const REASONS = [
  {
    icon: Shield,
    title: 'Constitutional AI',
    description:
      "Anthropic's Constitutional AI framework is the only production-grade approach to safe AI. This is the foundation of our trust narrative for India's 1.4 billion users.",
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: Heart,
    title: 'Safety as a Feature',
    description:
      "For non-technical Indian users, 'safe AI' is a product differentiator, not a footnote. Claude's Constitutional AI safety profile is our core selling point.",
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  {
    icon: Puzzle,
    title: 'Deep Protocol Integration',
    description:
      "MCP is Anthropic's own protocol — building on it exclusively creates the deepest possible technical alignment and partnership potential.",
    color: 'text-accent',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    icon: GraduationCap,
    title: 'Education Narrative',
    description:
      'Teaching students and enterprises on Claude creates a generation of Claude-native users — directly growing the Constitutional AI ecosystem in India.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Users,
    title: 'Community Trust',
    description:
      'A Claude-only marketplace builds trust signals that a multi-model platform cannot. Curated, consistent, and constitutionally aligned — every single tool.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    icon: Lock,
    title: 'Long-Term Commitment',
    description:
      "Our roadmap, branding, and technical architecture are built 100% around Claude. This is not a pivot-able position — it's a permanent strategic choice.",
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
]

export function WhyClaudeOnly() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary mb-6">
            WHY CLAUDE — WHY ONLY CLAUDE
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-text-primary mb-4">
            Not a multi-LLM aggregator.{' '}
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-glow to-accent bg-clip-text text-transparent">
              A deliberate choice.
            </span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            EternalMCP is 100% Claude-dedicated — a strategic and permanent decision rooted in Anthropic&apos;s Constitutional AI principles.
          </p>
        </motion.div>

        {/* Reasons grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {REASONS.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className={`group p-6 bg-surface border ${reason.border} rounded-xl hover:translate-y-[-2px] transition-all duration-300`}
            >
              <div className={`w-11 h-11 ${reason.bg} border ${reason.border} rounded-xl flex items-center justify-center mb-4`}>
                <reason.icon size={22} className={reason.color} />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-2">{reason.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Quote block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative rounded-2xl bg-gradient-to-r from-primary/10 via-violet-glow/10 to-accent/10 border border-primary/20 p-8 sm:p-12 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="relative">
            <p className="text-4xl text-primary/30 font-serif mb-4">&ldquo;</p>
            <p className="text-lg sm:text-xl text-text-primary font-medium max-w-3xl mx-auto mb-4 leading-relaxed">
              We are not building on Claude because it is a good API.
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
                We are building on Claude because Constitutional AI is the only right foundation for India&apos;s AI future.
              </span>
            </p>
            <p className="text-sm text-muted">— Amit, Founder · EternalMCP</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
