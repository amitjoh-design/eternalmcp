'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Puzzle,
  Shield,
  Zap,
  Globe,
  Code2,
  BarChart3,
  Lock,
  Layers,
} from 'lucide-react'

const WHAT_IS_MCP = {
  title: 'What is MCP?',
  description:
    'Model Context Protocol (MCP) is an open standard that enables AI models to connect with external tools, data sources, and APIs. It creates a universal interface for LLMs to take real-world actions.',
  points: [
    'Standardized protocol for AI tool communication',
    'Works with Claude, GPT-4, Gemini, and more',
    'Enables autonomous AI-driven workflows',
    'Secure, sandboxed tool execution',
  ],
}

const FEATURES = [
  {
    icon: Puzzle,
    title: 'Universal Protocol',
    description: 'MCP tools work with any LLM that supports the protocol. Build once, use everywhere.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    glow: 'shadow-glow',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description: 'Every tool runs in a sandboxed environment with rate limiting, authentication, and audit logs.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.2)]',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized API endpoints with global CDN distribution for sub-100ms response times.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
  },
  {
    icon: Globe,
    title: 'Global Registry',
    description: 'A unified marketplace where developers can publish tools and users can discover them instantly.',
    color: 'text-accent',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-glow-cyan',
  },
  {
    icon: Code2,
    title: 'Developer First',
    description: 'Rich SDKs, clear documentation, and developer-friendly onboarding to ship tools faster.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: 'shadow-glow-violet',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Real-time dashboards for usage metrics, performance monitoring, and revenue tracking.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
  },
  {
    icon: Lock,
    title: 'API Key Management',
    description: 'Fine-grained access control with API keys, OAuth, and enterprise SSO integration.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.2)]',
  },
  {
    icon: Layers,
    title: 'Versioning & Rollback',
    description: 'Semantic versioning for all tools. Deploy with confidence and roll back instantly.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.2)]',
  },
]

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0]
  index: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group relative p-6 bg-surface border ${feature.border} rounded-xl transition-all duration-300 hover:${feature.glow} hover:border-opacity-50 hover:translate-y-[-2px]`}
    >
      <div className={`w-11 h-11 ${feature.bg} ${feature.border} border rounded-xl flex items-center justify-center mb-4`}>
        <feature.icon size={22} className={feature.color} />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}

export function Features() {
  const titleRef = useRef(null)
  const titleInView = useInView(titleRef, { once: true })

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

        {/* Features grid */}
        <div className="mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary mb-4">
              Everything you need to build{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI-powered workflows
              </span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Eternal MCP provides all the tools, infrastructure, and ecosystem you need to publish and consume MCP tools at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
