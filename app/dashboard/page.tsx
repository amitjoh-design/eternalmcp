'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Zap, Star, BarChart3, Key, Settings, ChevronRight, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SubmitToolForm } from '@/components/dashboard/SubmitToolForm'
import { Analytics } from '@/components/dashboard/Analytics'
import { MCPTool, User } from '@/lib/types'
import { formatDate, formatNumber, getCategoryMeta } from '@/lib/utils'
import toast from 'react-hot-toast'

type DashboardTab = 'overview' | 'tools' | 'submit' | 'analytics' | 'api-keys'

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', icon: Clock, variant: 'warning' as const },
  approved: { label: 'Live', icon: CheckCircle, variant: 'success' as const },
  rejected: { label: 'Rejected', icon: XCircle, variant: 'danger' as const },
  archived: { label: 'Archived', icon: XCircle, variant: 'default' as const },
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [tools, setTools] = useState<MCPTool[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth')
        return
      }
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (profile) setUser(profile as User)

      // Fetch user's tools
      const { data: userTools } = await supabase
        .from('mcp_tools')
        .select('*')
        .eq('creator_id', authUser.id)
        .order('created_at', { ascending: false })

      setTools((userTools as MCPTool[]) || [])
      setLoading(false)
    }
    init()
  }, [supabase, router])

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool? This cannot be undone.')) return
    const { error } = await supabase.from('mcp_tools').delete().eq('id', toolId)
    if (error) {
      toast.error('Failed to delete tool')
    } else {
      setTools(tools.filter((t) => t.id !== toolId))
      toast.success('Tool deleted')
    }
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'tools', label: 'My Tools', icon: Zap },
    { id: 'submit', label: 'Submit Tool', icon: Plus },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'api-keys', label: 'API Keys', icon: Key },
  ] as const

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const approvedCount = tools.filter((t) => t.status === 'approved').length
  const pendingCount = tools.filter((t) => t.status === 'pending').length
  const totalUsage = tools.reduce((sum, t) => sum + (t.usage_count || 0), 0)

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-text-primary mb-1">
            Developer Dashboard
          </h1>
          <p className="text-text-secondary">
            Welcome back,{' '}
            <span className="text-text-primary font-medium">
              {user?.name || user?.email?.split('@')[0]}
            </span>
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="bg-surface border border-border-subtle rounded-xl p-3 sticky top-24">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1 ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Overview */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Tools', value: tools.length, icon: Zap, color: 'text-primary' },
                    { label: 'Live Tools', value: approvedCount, icon: CheckCircle, color: 'text-emerald-400' },
                    { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-yellow-400' },
                    { label: 'Total Calls', value: formatNumber(totalUsage), icon: BarChart3, color: 'text-accent' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-surface border border-border-subtle rounded-xl p-5">
                      <stat.icon size={20} className={`${stat.color} mb-3`} />
                      <p className="text-2xl font-black text-text-primary">{stat.value}</p>
                      <p className="text-xs text-muted mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="bg-surface border border-border-subtle rounded-xl p-6">
                  <h2 className="text-base font-semibold text-text-primary mb-4">Quick Actions</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="flex items-center gap-3 p-4 bg-surface-2 hover:bg-white/5 border border-border-subtle hover:border-primary/30 rounded-xl transition-all group"
                    >
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Plus size={18} className="text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-text-primary">Submit New Tool</p>
                        <p className="text-xs text-muted">Publish to marketplace</p>
                      </div>
                      <ChevronRight size={16} className="ml-auto text-muted group-hover:text-text-primary" />
                    </button>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="flex items-center gap-3 p-4 bg-surface-2 hover:bg-white/5 border border-border-subtle hover:border-primary/30 rounded-xl transition-all group"
                    >
                      <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
                        <BarChart3 size={18} className="text-accent" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-text-primary">View Analytics</p>
                        <p className="text-xs text-muted">Usage & performance</p>
                      </div>
                      <ChevronRight size={16} className="ml-auto text-muted group-hover:text-text-primary" />
                    </button>
                  </div>
                </div>

                {/* Recent tools */}
                {tools.length > 0 && (
                  <div className="bg-surface border border-border-subtle rounded-xl p-6">
                    <h2 className="text-base font-semibold text-text-primary mb-4">Your Tools</h2>
                    <div className="space-y-3">
                      {tools.slice(0, 3).map((tool) => {
                        const status = STATUS_CONFIG[tool.status]
                        const catMeta = getCategoryMeta(tool.category)
                        return (
                          <div key={tool.id} className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg">
                            <span className="text-xl">{catMeta.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{tool.name}</p>
                              <p className="text-xs text-muted">{formatDate(tool.created_at)}</p>
                            </div>
                            <Badge variant={status.variant} size="sm">{status.label}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* My Tools */}
            {activeTab === 'tools' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-text-primary">My Tools ({tools.length})</h2>
                  <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setActiveTab('submit')}>
                    New Tool
                  </Button>
                </div>

                {tools.length === 0 ? (
                  <div className="text-center py-20 bg-surface border border-border-subtle rounded-xl">
                    <Zap size={40} className="text-border-subtle mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No tools yet</h3>
                    <p className="text-text-secondary mb-6">Submit your first MCP tool to the marketplace.</p>
                    <Button variant="glow" onClick={() => setActiveTab('submit')} icon={<Plus size={16} />}>
                      Submit Your First Tool
                    </Button>
                  </div>
                ) : (
                  tools.map((tool) => {
                    const status = STATUS_CONFIG[tool.status]
                    const catMeta = getCategoryMeta(tool.category)
                    return (
                      <div key={tool.id} className="bg-surface border border-border-subtle rounded-xl p-5 flex items-start gap-4">
                        <span className="text-2xl mt-1">{catMeta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold text-text-primary">{tool.name}</h3>
                              <p className="text-sm text-text-secondary mt-1 line-clamp-1">{tool.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={status.variant} size="sm">{status.label}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                            <span>v{tool.version}</span>
                            <span>{formatDate(tool.created_at)}</span>
                            <span className="flex items-center gap-1">
                              <Zap size={11} className="text-accent" />
                              {formatNumber(tool.usage_count || 0)} calls
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button variant="ghost" size="sm" icon={<Edit size={14} />}>Edit</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            onClick={() => handleDeleteTool(tool.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </motion.div>
            )}

            {/* Submit Tool */}
            {activeTab === 'submit' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-surface border border-border-subtle rounded-xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-text-primary mb-2">Submit MCP Tool</h2>
                  <p className="text-text-secondary mb-8">
                    Share your MCP tool with thousands of developers and AI builders.
                  </p>
                  <SubmitToolForm onSuccess={() => setActiveTab('tools')} />
                </div>
              </motion.div>
            )}

            {/* Analytics */}
            {activeTab === 'analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-lg font-semibold text-text-primary mb-6">Analytics Overview</h2>
                <Analytics />
              </motion.div>
            )}

            {/* API Keys */}
            {activeTab === 'api-keys' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-surface border border-border-subtle rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-text-primary">API Keys</h2>
                    <Button variant="primary" size="sm" icon={<Plus size={15} />}>
                      Create Key
                    </Button>
                  </div>
                  <div className="text-center py-12">
                    <Key size={40} className="text-border-subtle mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-text-primary mb-2">No API keys yet</h3>
                    <p className="text-text-secondary text-sm mb-6">
                      Create an API key to authenticate your MCP tool requests.
                    </p>
                    <Button variant="glow" icon={<Plus size={16} />}>
                      Create First API Key
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
