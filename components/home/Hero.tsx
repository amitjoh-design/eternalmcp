'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Zap, Terminal, Mail, BarChart3, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const FLOATING_CARDS = [
  {
    icon: BarChart3,
    title: 'Company Research',
    tag: 'Finance',
    rating: '4.9',
    color: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/20',
    delay: 0,
    position: 'top-20 -left-4 lg:left-8',
  },
  {
    icon: Mail,
    title: 'Gmail Sender',
    tag: 'Productivity',
    rating: '4.8',
    color: 'from-primary/20 to-violet-glow/10',
    border: 'border-primary/20',
    delay: 0.3,
    position: 'bottom-32 -left-4 lg:left-16',
  },
  {
    icon: TrendingUp,
    title: 'Trading Intelligence',
    tag: 'Quant Finance',
    rating: '4.9',
    color: 'from-cyan-500/20 to-accent/10',
    border: 'border-cyan-500/20',
    delay: 0.1,
    position: 'top-16 -right-4 lg:right-8',
  },
  {
    icon: Terminal,
    title: 'EdTech Tutor',
    tag: 'Education',
    rating: '4.7',
    color: 'from-orange-500/20 to-yellow-500/10',
    border: 'border-orange-500/20',
    delay: 0.4,
    position: 'bottom-24 -right-4 lg:right-12',
  },
]

const STATS = [
  { value: '100%', label: 'Claude-Powered' },
  { value: '1.4B', label: 'India Addressable' },
  { value: 'No Code', label: 'Required' },
  { value: '99.9%', label: 'Uptime' },
]

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background mesh gradient */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />

      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(to right, rgba(99,102,241,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-glow/5 rounded-full blur-3xl" />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16"
      >
        <div className="flex flex-col items-center text-center">
          {/* Announcement badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary-light">
              <Zap size={14} className="animate-pulse" />
              <span>India&apos;s #1 Claude-Dedicated MCP Platform</span>
              <ArrowRight size={14} />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-300">
              🇮🇳 Built for Bharat
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-none mb-6"
          >
            <span className="text-text-primary">Eternal</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-glow to-accent bg-clip-text text-transparent animate-gradient-x">
              MCP
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-xl sm:text-2xl text-text-secondary max-w-2xl mb-4 font-light"
          >
            Bringing Constitutional AI to 1.4 Billion People
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-base text-muted max-w-xl mb-12"
          >
            India&apos;s only Claude-dedicated MCP marketplace. Zero code, zero setup — access institutional-grade AI tools built on Anthropic&apos;s Constitutional AI for individuals, SMEs, and enterprises.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Link href="/marketplace">
              <Button variant="glow" size="xl" icon={<ArrowRight size={20} />} iconPosition="right">
                Explore MCP Tools
              </Button>
            </Link>
            <Link href="/auth?mode=signup">
              <Button variant="outline" size="xl" icon={<Terminal size={20} />}>
                Get Started Free
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-20"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-text-primary to-primary bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Floating Tool Cards */}
          <div className="relative w-full max-w-4xl hidden lg:block">
            <div className="relative h-32">
              {FLOATING_CARDS.map((card) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 + card.delay }}
                  className={`absolute ${card.position}`}
                  style={{ animation: `float ${6 + card.delay * 2}s ease-in-out infinite` }}
                >
                  <div
                    className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-br ${card.color} backdrop-blur-md border ${card.border} rounded-xl shadow-glass w-48`}
                  >
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <card.icon size={16} className="text-text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{card.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">{card.tag}</span>
                        <span className="text-xs text-yellow-400">★ {card.rating}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
