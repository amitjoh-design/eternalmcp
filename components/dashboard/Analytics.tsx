'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Star, Zap, Users, ArrowUpRight, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatNumber, formatDate } from '@/lib/utils'

interface AnalyticsStat {
  title: string
  value: string
  change: string
  changeType: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  color: string
  iconBg: string
}

interface UsageDataPoint {
  date: string
  calls: number
  users: number
}

// Generate mock usage data for the last 30 days
function generateMockData(): UsageDataPoint[] {
  const data: UsageDataPoint[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calls: Math.floor(Math.random() * 500 + 100),
      users: Math.floor(Math.random() * 50 + 10),
    })
  }
  return data
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border-subtle rounded-lg px-3 py-2 shadow-glass text-xs">
        <p className="text-muted mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

interface AnalyticsProps {
  toolId?: string
}

export function Analytics({ toolId }: AnalyticsProps) {
  const [usageData] = useState<UsageDataPoint[]>(generateMockData())
  const [stats] = useState<AnalyticsStat[]>([
    {
      title: 'Total API Calls',
      value: '12,847',
      change: '+23%',
      changeType: 'up',
      icon: Zap,
      color: 'text-accent',
      iconBg: 'bg-cyan-500/10',
    },
    {
      title: 'Unique Users',
      value: '1,234',
      change: '+15%',
      changeType: 'up',
      icon: Users,
      color: 'text-primary-light',
      iconBg: 'bg-primary/10',
    },
    {
      title: 'Avg. Rating',
      value: '4.8',
      change: '+0.2',
      changeType: 'up',
      icon: Star,
      color: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10',
    },
    {
      title: 'Total Views',
      value: '48,291',
      change: '+31%',
      changeType: 'up',
      icon: Eye,
      color: 'text-violet-400',
      iconBg: 'bg-violet-500/10',
    },
  ])

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-surface border border-border-subtle rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  stat.changeType === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                <ArrowUpRight size={12} />
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-black text-text-primary mb-1">{stat.value}</p>
            <p className="text-xs text-muted">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Usage chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface border border-border-subtle rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-text-primary">API Usage</h3>
            <p className="text-xs text-muted mt-0.5">Last 30 days</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted">API Calls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-muted">Users</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={usageData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={6}
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="calls"
              name="API Calls"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#callsGradient)"
            />
            <Area
              type="monotone"
              dataKey="users"
              name="Users"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#usersGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bar chart - calls by hour */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface border border-border-subtle rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Calls by Hour</h3>
            <p className="text-xs text-muted mt-0.5">Today&apos;s distribution</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={Array.from({ length: 24 }, (_, i) => ({
              hour: `${i}:00`,
              calls: Math.floor(Math.random() * 200 + 20),
            }))}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={5}
            />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="calls" name="API Calls" fill="#6366f1" radius={[3, 3, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}
