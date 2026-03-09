'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { UserPlus, Upload, Code2, Rocket, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const STEPS_DEVELOPER = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create Account',
    description: 'Sign up with email or GitHub. Get your developer profile and API keys in seconds.',
    color: 'from-primary to-violet-glow',
  },
  {
    step: '02',
    icon: Code2,
    title: 'Build Your MCP Tool',
    description: 'Implement the MCP protocol in your tool. Use our SDK and documentation to get started fast.',
    color: 'from-violet-glow to-accent',
  },
  {
    step: '03',
    icon: Upload,
    title: 'Submit & Publish',
    description: 'Submit your tool for review. Once approved, it appears in the marketplace instantly.',
    color: 'from-accent to-emerald-500',
  },
  {
    step: '04',
    icon: Rocket,
    title: 'Scale & Earn',
    description: 'Track usage analytics, gather reviews, and monetize your tool as adoption grows.',
    color: 'from-emerald-500 to-primary',
  },
]

const STEPS_USER = [
  {
    step: '01',
    title: 'Browse Marketplace',
    description: 'Discover MCP tools by category, rating, or use case.',
  },
  {
    step: '02',
    title: 'Connect to Your LLM',
    description: 'Copy the MCP endpoint and add it to your AI configuration.',
  },
  {
    step: '03',
    title: 'Automate & Analyze',
    description: 'Let your AI model use the tool to execute real-world tasks autonomously.',
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Developer Flow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-xs text-accent mb-6">
            FOR DEVELOPERS
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-text-primary mb-4">
            Publish your first MCP tool{' '}
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-glow to-accent bg-clip-text text-transparent">
              in minutes
            </span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            From zero to published in 4 simple steps. Our platform handles the infrastructure so you can focus on building.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {STEPS_DEVELOPER.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {i < STEPS_DEVELOPER.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%+12px)] w-[calc(100%-24px)] h-px bg-gradient-to-r from-border-subtle to-transparent" />
              )}
              <div className="p-6 bg-surface border border-border-subtle rounded-xl hover:border-primary/30 transition-all duration-300 group">
                {/* Step number */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform`}
                  >
                    <step.icon size={22} className="text-white" />
                  </div>
                  <span className="text-3xl font-black text-border-subtle">{step.step}</span>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* User Flow */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 mb-6">
              FOR AI BUILDERS & TRADERS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary mb-4">
              Supercharge your AI with
              <br />
              <span className="text-emerald-400">ready-made tools</span>
            </h2>
            <p className="text-text-secondary mb-8">
              Connect your LLM to powerful MCP tools in seconds. No infrastructure, no DevOps — just plug and play.
            </p>
            <div className="space-y-4">
              {STEPS_USER.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-1">{step.title}</h4>
                    <p className="text-sm text-text-secondary">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              <Link href="/marketplace">
                <Button variant="primary" icon={<ArrowRight size={16} />} iconPosition="right">
                  Explore Tools
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="ghost">Read Docs</Button>
              </Link>
            </div>
          </motion.div>

          {/* Code snippet visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative"
          >
            <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-glass">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-2 border-b border-border-subtle">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 text-xs text-muted font-mono">mcp-config.json</span>
              </div>
              {/* Code */}
              <pre className="p-6 text-sm font-mono overflow-x-auto">
                <code className="text-text-secondary">
                  {`{
  `}
                  <span className="text-accent">&quot;mcpServers&quot;</span>
                  {`: {
    `}
                  <span className="text-violet-400">&quot;trading-bot&quot;</span>
                  {`: {
      `}
                  <span className="text-accent">&quot;url&quot;</span>
                  {`: `}
                  <span className="text-emerald-400">&quot;https://api.eternalmcp.com&quot;</span>
                  {`
        `}
                  <span className="text-accent">&quot;/tools/trading-bot&quot;</span>
                  {`,
      `}
                  <span className="text-accent">&quot;headers&quot;</span>
                  {`: {
        `}
                  <span className="text-violet-400">&quot;Authorization&quot;</span>
                  {`: `}
                  <span className="text-yellow-400">&quot;Bearer emcp_...&quot;</span>
                  {`
      }
    },
    `}
                  <span className="text-violet-400">&quot;web-scraper&quot;</span>
                  {`: {
      `}
                  <span className="text-accent">&quot;url&quot;</span>
                  {`: `}
                  <span className="text-emerald-400">&quot;https://api.eternalmcp.com&quot;</span>
                  {`
        `}
                  <span className="text-accent">&quot;/tools/web-scraper&quot;</span>
                  {`
    }
  }
}`}
                </code>
              </pre>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400">2 tools connected</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
