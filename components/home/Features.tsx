'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Store,
  Share2,
  GraduationCap,
  Building2,
  Shield,
  CheckCircle2,
} from 'lucide-react'

const WHAT_IS_MCP = {
  title: 'What is MCP?',
  description:
    "Model Context Protocol (MCP) is Anthropic's open standard that enables Claude to connect with external tools, data sources, and APIs — creating a universal interface for Constitutional AI to take real-world actions.",
  points: [
    "Anthropic's native protocol for AI tool communication",
    '100% Claude-dedicated — Constitutional AI powered',
    'Enables autonomous, safe AI-driven workflows',
    'Secure, sandboxed tool execution',
  ],
}

const DIVISIONS = [
  {
    icon: Store,
    number: '01',
    title: 'Cloud MCP Marketplace',
    headline: 'Zero-code AI tools for everyone',
    description:
      'A cloud-hosted platform where individuals, SMEs, and enterprises access, deploy, and subscribe to curated Claude-powered MCP tools — without writing a single line of code.',
    features: [
      'Consumer · SME · Enterprise tiers',
      'Instant deploy, no DevOps required',
      'Constitutional AI guardrails on every tool',
      'India-first tool curation',
    ],
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    glow: 'shadow-glow',
    gradient: 'from-primary/20 to-violet-glow/10',
  },
  {
    icon: Share2,
    number: '02',
    title: 'Community Publishing',
    headline: 'Build tools. Earn recurring income.',
    description:
      'Developers publish their MCP tools on the marketplace. Tools are reviewed for Constitutional AI compliance before listing. Creators earn recurring income via subscriber revenue-share.',
    features: [
      'Revenue-share on every subscription',
      'Constitutional AI compliance review',
      'Network effect: more tools, more users',
      'Open to developers across India',
    ],
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.2)]',
    gradient: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    icon: GraduationCap,
    number: '03',
    title: 'Education & Training',
    headline: "Building India's Claude-native generation",
    description:
      'Structured curriculum for school and college students on Claude and Constitutional AI. Corporate workshops for enterprises. Train-the-trainer programmes to create a certified educator network across India.',
    features: [
      'School & college AI literacy programmes',
      'Enterprise & SME corporate workshops',
      'Certified EternalMCP educator network',
      '100% Claude — no other LLM in curriculum',
    ],
    color: 'text-accent',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-glow-cyan',
    gradient: 'from-cyan-500/20 to-blue-500/10',
  },
  {
    icon: Building2,
    number: '04',
    title: 'Enterprise MCP Suite',
    headline: 'Compliance-ready AI for serious business',
    description:
      'Multi-tenant MCP deployment for corporate clients. Integration with internal data sources with Constitutional AI guardrails enforced. Compliance-ready for BFSI, healthcare, and government sectors.',
    features: [
      'Multi-tenant MCP deployment',
      'Internal data source integration',
      'BFSI · Healthcare · Government ready',
    ],
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: 'shadow-glow-violet',
    gradient: 'from-violet-500/20 to-purple-500/10',
  },
]

function DivisionCard({
  division,
  index,
}: {
  division: (typeof DIVISIONS)[0]
  index: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group relative p-7 bg-surface border ${division.border} rounded-2xl transition-all duration-300 hover:translate-y-[-2px]`}
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${division.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className={`w-12 h-12 ${division.bg} border ${division.border} rounded-xl flex items-center justify-center`}>
            <division.icon size={24} className={division.color} />
          </div>
          <span className="text-4xl font-black text-border-subtle/60 leading-none">{division.number}</span>
        </div>

        {/* Label */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${division.bg} border ${division.border} rounded-full text-xs ${division.color} font-medium mb-3`}>
          {division.title}
        </div>

        {/* Headline */}
        <h3 className="text-lg font-bold text-text-primary mb-3">{division.headline}</h3>

        {/* Description */}
        <p className="text-sm text-text-secondary leading-relaxed mb-5">{division.description}</p>

        {/* Features */}
        <ul className="space-y-2">
          {division.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 size={14} className={`${division.color} flex-shrink-0`} />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export function Features() {
  const titleRef = useRef(null)
  const titleInView = useInView(titleRef, { once: true })
  const shieldRef = useRef(null)
  const shieldInView = useInView(shieldRef, { once: true, margin: '-80px' })

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* What is MCP */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary mb-6">
            PROTOCOL OVERVIEW
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-text-primary mb-6">
            {WHAT_IS_MCP.title}
          </h2>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-300 mb-4">
            🔒 Exclusively powered by Claude — Anthropic&apos;s Constitutional AI
          </div>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            {WHAT_IS_MCP.description}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {WHAT_IS_MCP.points.map((point) => (
              <div
                key={point}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle rounded-full text-sm text-text-secondary"
              >
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                {point}
              </div>
            ))}
          </div>
        </motion.div>

        {/* 4 Divisions */}
        <div>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary mb-6">
              WHAT WE ARE BUILDING
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary mb-4">
              Four divisions.{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                One mission.
              </span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              EternalMCP is not just a marketplace. It is a full Constitutional AI ecosystem —
              covering platform access, community income, education, and enterprise deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {DIVISIONS.map((division, i) => (
              <DivisionCard key={division.title} division={division} index={i} />
            ))}
          </div>
        </div>

        {/* Constitutional AI trust banner */}
        <motion.div
          ref={shieldRef}
          initial={{ opacity: 0, y: 20 }}
          animate={shieldInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-5 p-6 bg-surface border border-primary/20 rounded-2xl"
        >
          <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Shield size={28} className="text-primary" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-base font-bold text-text-primary mb-1">
              Constitutional AI — baked in, not bolted on
            </h3>
            <p className="text-sm text-text-secondary">
              Every tool, every division, every interaction on EternalMCP runs on Anthropic&apos;s Constitutional AI framework.
              For non-technical Indian users, safe AI is a product feature — not a footnote.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
