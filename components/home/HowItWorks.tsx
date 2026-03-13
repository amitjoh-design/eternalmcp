'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { User, Building2, Factory, Code2, Upload, Rocket, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const TIERS = [
  {
    icon: User,
    label: 'Consumer',
    badge: 'Individuals',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    badgeColor: 'bg-primary/10 border-primary/20 text-primary',
    steps: [
      { title: 'Sign up free', description: 'Create your account in seconds. No credit card required to explore.' },
      { title: 'Browse & subscribe', description: 'Explore curated MCP tools by category — finance, productivity, education, and more.' },
      { title: 'Connect to Claude', description: 'Copy the MCP endpoint and add it to your Claude configuration. Zero code required.' },
    ],
  },
  {
    icon: Building2,
    label: 'SME',
    badge: 'Small & Medium Business',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    badgeColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    steps: [
      { title: 'Choose SME tier', description: 'Access a bundle of Claude-powered tools for market research, email, finance, and customer insights.' },
      { title: 'Deploy for your team', description: 'Multi-user access with role management. No IT team needed — we handle the infrastructure.' },
      { title: 'Automate & grow', description: 'Let Constitutional AI handle repetitive tasks while your team focuses on what matters.' },
    ],
  },
  {
    icon: Factory,
    label: 'Enterprise',
    badge: 'Large Organisations',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    badgeColor: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    steps: [
      { title: 'Multi-tenant deployment', description: 'Private, dedicated MCP infrastructure with compliance-ready architecture for BFSI, healthcare, and government.' },
      { title: 'Internal data integration', description: 'Connect your internal data sources to Claude with Constitutional AI guardrails enforced at every layer.' },
      { title: 'Enterprise SLA & support', description: 'Dedicated onboarding, SLA guarantees, and direct access to the EternalMCP team.' },
    ],
  },
]

const STEPS_DEVELOPER = [
  {
    step: '01',
    icon: Code2,
    title: 'Build Your MCP Tool',
    description: "Implement the MCP protocol in your tool. Use Anthropic's SDK and our documentation to get started fast.",
    color: 'from-primary to-violet-glow',
  },
  {
    step: '02',
    icon: Upload,
    title: 'Submit for Review',
    description: 'Submit your tool for Constitutional AI compliance review. We ensure every tool meets our safety standards before listing.',
    color: 'from-violet-glow to-accent',
  },
  {
    step: '03',
    icon: Rocket,
    title: 'Publish & Earn',
    description: 'Once approved, your tool appears in the marketplace. Earn recurring revenue from every subscriber — automatically.',
    color: 'from-accent to-emerald-500',
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const devRef = useRef(null)
  const devInView = useInView(devRef, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* User Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 mb-6">
            THREE TIERS — ONE PLATFORM
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-text-primary mb-4">
            From individuals to{' '}
            <span className="bg-gradient-to-r from-primary via-violet-glow to-accent bg-clip-text text-transparent">
              enterprises
            </span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            Whether you are a student, an SME owner, or a corporate CTO — EternalMCP has a tier built for your scale.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-24">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className={`p-6 bg-surface border ${tier.border} rounded-2xl`}
            >
              {/* Tier header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 ${tier.bg} border ${tier.border} rounded-xl flex items-center justify-center`}>
                  <tier.icon size={20} className={tier.color} />
                </div>
                <div>
                  <div className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${tier.badgeColor}`}>
                    {tier.badge}
                  </div>
                  <h3 className="text-base font-bold text-text-primary mt-0.5">{tier.label}</h3>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-5">
                {tier.steps.map((step, j) => (
                  <div key={step.title} className="flex items-start gap-3">
                    <div className={`w-6 h-6 ${tier.bg} border ${tier.border} rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${tier.color} mt-0.5`}>
                      {j + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-1">{step.title}</h4>
                      <p className="text-xs text-text-secondary leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Developer Flow */}
        <div ref={devRef}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={devInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-xs text-accent mb-6">
              FOR MCP DEVELOPERS
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-text-primary mb-4">
              Publish. Get discovered.{' '}
              <span className="bg-gradient-to-r from-primary via-violet-glow to-accent bg-clip-text text-transparent">
                Earn.
              </span>
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              Build Constitutional AI-compliant MCP tools and earn recurring revenue from
              India&apos;s fastest-growing AI ecosystem.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {STEPS_DEVELOPER.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                animate={devInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="relative"
              >
                {i < STEPS_DEVELOPER.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(100%+12px)] w-[calc(100%-24px)] h-px bg-gradient-to-r from-border-subtle to-transparent" />
                )}
                <div className="p-6 bg-surface border border-border-subtle rounded-xl hover:border-primary/30 transition-all duration-300 group">
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={devInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/marketplace">
              <Button variant="primary" icon={<ArrowRight size={16} />} iconPosition="right">
                Explore Tools
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="ghost">Read Docs</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
