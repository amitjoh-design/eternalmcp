'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Star, TrendingUp, Globe, Terminal, BarChart3, Lock, Database } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const FEATURED_TOOLS = [
  {
    id: '1',
    name: 'Company Research',
    description: 'Generate institutional-grade equity research reports for any listed company — PDF output with 9-section analysis, valuation, and risk assessment.',
    category: 'Finance',
    icon: BarChart3,
    color: 'from-emerald-500 to-emerald-700',
    borderColor: 'border-emerald-500/20',
    rating: 4.9,
    reviews: 12,
    usage: 'Live',
    tags: ['Finance', 'Research', 'PDF'],
    creator: 'EternalMCP',
    featured: true,
    live: true,
  },
  {
    id: '2',
    name: 'Gmail Sender',
    description: 'Send emails directly from Claude. Draft, compose, and dispatch emails via your connected Gmail — with full OAuth security.',
    category: 'Productivity',
    icon: Globe,
    color: 'from-primary to-violet-glow',
    borderColor: 'border-primary/20',
    rating: 4.8,
    reviews: 8,
    usage: 'Live',
    tags: ['Email', 'Gmail', 'Productivity'],
    creator: 'EternalMCP',
    featured: true,
    live: true,
  },
  {
    id: '3',
    name: 'Trading Intelligence',
    description: 'Quant-grade market intelligence for NIFTY 50 and Indian equities — powered by institutional models from EternalQuants.',
    category: 'Quant Finance',
    icon: TrendingUp,
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/20',
    rating: 4.9,
    reviews: 0,
    usage: 'Coming Soon',
    tags: ['Quant', 'NIFTY 50', 'India'],
    creator: 'DeltaFlow × EternalMCP',
    featured: false,
    live: false,
  },
  {
    id: '4',
    name: 'EdTech Tutor',
    description: 'Constitutional AI-powered tutor for school and college students. Structured curriculum on Claude, AI safety, and responsible technology.',
    category: 'Education',
    icon: Terminal,
    color: 'from-orange-500 to-amber-600',
    borderColor: 'border-orange-500/20',
    rating: 0,
    reviews: 0,
    usage: 'Coming Soon',
    tags: ['Education', 'Students', 'AI Literacy'],
    creator: 'EternalMCP',
    featured: false,
    live: false,
  },
  {
    id: '5',
    name: 'Enterprise Data MCP',
    description: 'Connect internal data sources to Claude with Constitutional AI guardrails. Compliance-ready for BFSI, healthcare, and government sectors.',
    category: 'Enterprise',
    icon: Lock,
    color: 'from-violet-500 to-purple-700',
    borderColor: 'border-violet-500/20',
    rating: 0,
    reviews: 0,
    usage: 'Coming Soon',
    tags: ['Enterprise', 'BFSI', 'Compliance'],
    creator: 'EternalMCP',
    featured: false,
    live: false,
  },
  {
    id: '6',
    name: 'SME Business Suite',
    description: 'A bundle of Claude-powered MCP tools for Indian SMEs — market research, email automation, financial analysis, and customer insights.',
    category: 'Business',
    icon: Database,
    color: 'from-indigo-500 to-blue-700',
    borderColor: 'border-indigo-500/20',
    rating: 0,
    reviews: 0,
    usage: 'Coming Soon',
    tags: ['SME', 'Business', 'India'],
    creator: 'EternalMCP',
    featured: false,
    live: false,
  },
]

export function FeaturedTools() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section ref={ref} className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/3 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary mb-4">
              FEATURED TOOLS
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-text-primary">
              Tools in the{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ecosystem
              </span>
            </h2>
          </div>
          <Link href="/marketplace">
            <Button variant="outline" icon={<ArrowRight size={16} />} iconPosition="right">
              View all tools
            </Button>
          </Link>
        </motion.div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURED_TOOLS.map((tool, i) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            >
              <Link href={`/tools/${tool.id}`}>
                <div
                  className={`group relative p-6 bg-surface border ${tool.borderColor} rounded-xl transition-all duration-300 hover:shadow-glow hover:translate-y-[-3px] cursor-pointer h-full`}
                >
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    {tool.live && (
                      <Badge variant="primary" size="sm">
                        ✅ Live
                      </Badge>
                    )}
                    {!tool.live && (
                      <Badge variant="default" size="sm">
                        🔜 Coming Soon
                      </Badge>
                    )}
                    {tool.featured && tool.live && (
                      <Badge variant="primary" size="sm">
                        ⭐ Featured
                      </Badge>
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center mb-4 shadow-glow group-hover:scale-110 transition-transform`}
                  >
                    <tool.icon size={22} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {tool.name}
                      </h3>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tool.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="default" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted pt-4 border-t border-border-subtle">
                    <div className="flex items-center gap-1">
                      {tool.live && tool.rating > 0 ? (
                        <>
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-text-secondary font-medium">{tool.rating}</span>
                          <span>({tool.reviews})</span>
                        </>
                      ) : (
                        <span className="text-primary text-xs">🔒 Constitutional AI</span>
                      )}
                    </div>
                    <span className={tool.live ? 'text-emerald-400 font-medium' : 'text-muted'}>{tool.usage}</span>
                    <span className="text-text-secondary">by {tool.creator}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-violet-glow/10 to-accent/10 border border-primary/20 p-8 sm:p-12 text-center"
        >
          <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-300 mb-4">
              🇮🇳 India&apos;s Claude-Dedicated MCP Platform
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary mb-4">
              Start using Constitutional AI today
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-8">
              No code. No setup. Connect your Claude client in 2 minutes and unlock institutional-grade AI tools built on Anthropic&apos;s safety principles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?mode=signup">
                <Button variant="glow" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="secondary" size="lg">
                  Explore All Tools
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
