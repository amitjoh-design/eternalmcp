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
    name: 'Alpha Trading Bot',
    description: 'Autonomous trading agent with real-time market analysis, order execution, and portfolio management via MCP.',
    category: 'Trading',
    icon: TrendingUp,
    color: 'from-emerald-500 to-emerald-700',
    borderColor: 'border-emerald-500/20',
    rating: 4.9,
    reviews: 234,
    usage: '89K',
    tags: ['Finance', 'Trading', 'Automation'],
    creator: 'QuantLabs',
    featured: true,
  },
  {
    id: '2',
    name: 'DataScraper Pro',
    description: 'Extract structured data from any website. Handles JS-rendered pages, pagination, and anti-bot measures.',
    category: 'Data',
    icon: Globe,
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/20',
    rating: 4.8,
    reviews: 189,
    usage: '124K',
    tags: ['Scraping', 'Data', 'Web'],
    creator: 'DataForge',
    featured: true,
  },
  {
    id: '3',
    name: 'CodeReview AI',
    description: 'Automated code review with security vulnerability detection, performance suggestions, and best practices.',
    category: 'Dev Tools',
    icon: Terminal,
    color: 'from-violet-500 to-purple-700',
    borderColor: 'border-violet-500/20',
    rating: 4.9,
    reviews: 312,
    usage: '201K',
    tags: ['Code', 'Security', 'Review'],
    creator: 'DevOps.ai',
    featured: false,
  },
  {
    id: '4',
    name: 'Market Analytics',
    description: 'Real-time market sentiment analysis using news feeds, social data, and on-chain metrics for traders.',
    category: 'Analytics',
    icon: BarChart3,
    color: 'from-orange-500 to-red-600',
    borderColor: 'border-orange-500/20',
    rating: 4.7,
    reviews: 156,
    usage: '67K',
    tags: ['Analytics', 'Trading', 'Sentiment'],
    creator: 'SentimentAI',
    featured: false,
  },
  {
    id: '5',
    name: 'SecureVault',
    description: 'Secure secret management for AI workflows. Store, rotate, and audit API keys and credentials safely.',
    category: 'Security',
    icon: Lock,
    color: 'from-red-500 to-rose-700',
    borderColor: 'border-red-500/20',
    rating: 5.0,
    reviews: 98,
    usage: '44K',
    tags: ['Security', 'Vault', 'DevOps'],
    creator: 'CipherSec',
    featured: false,
  },
  {
    id: '6',
    name: 'VectorDB Connect',
    description: 'Seamlessly query and update vector databases (Pinecone, Weaviate, Qdrant) from any LLM workflow.',
    category: 'Data',
    icon: Database,
    color: 'from-indigo-500 to-blue-700',
    borderColor: 'border-indigo-500/20',
    rating: 4.8,
    reviews: 127,
    usage: '78K',
    tags: ['Vector DB', 'RAG', 'Embeddings'],
    creator: 'VectoTech',
    featured: false,
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
              Trending in the{' '}
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
                  {tool.featured && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="primary" size="sm">
                        ⭐ Featured
                      </Badge>
                    </div>
                  )}

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
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-text-secondary font-medium">{tool.rating}</span>
                      <span>({tool.reviews})</span>
                    </div>
                    <span>{tool.usage} calls</span>
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
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary mb-4">
              Ready to publish your MCP tool?
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-8">
              Join thousands of developers building the AI automation ecosystem. Get your tool in front of the right audience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?mode=signup">
                <Button variant="glow" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
                  Start Publishing — It&apos;s Free
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="secondary" size="lg">
                  Read the Docs
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
