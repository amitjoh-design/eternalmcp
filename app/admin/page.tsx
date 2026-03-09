'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Shield, CheckCircle, XCircle, Clock, Trash2,
  Users, Zap, BarChart3, Star, RefreshCw, Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MCPTool, User } from '@/lib/types'
import { formatDate, getCategoryMeta, formatNumber } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

type AdminTab = 'overview' | 'pending' | 'tools' | 'users'

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('overview')
  const [loading, setLoading] = useState(true)
  const [pendingTools, setPendingTools] = useState<MCPTool[]>([])
  const [allTools, setAllTools] = useState<MCPTool[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({ totalTools: 0, totalUsers: 0, pendingCount: 0, approvedCount: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth'); return }

      const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.id).single()
      if (!profile || profile.role !== 'admin') {
        router.push('/')
        toast.error('Access denied')
        return
      }

      const [{ data: pending }, { data: all }, { data: userList }] = await Promise.all([
        supabase.from('mcp_tools').select('*, creator:users!mcp_tools_creator_id_fkey(id, name, email)').eq('status', 'pending').order('created_at'),
        supabase.from('mcp_tools').select('*, creator:users!mcp_tools_creator_id_fkey(id, name, email)').order('created_at', { ascending: false }).limit(50),
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50),
      ])

      setPendingTools((pending as unknown as MCPTool[]) || [])
      setAllTools((all as unknown as MCPTool[]) || [])
      setUsers((userList as User[]) || [])
      setStats({
        totalTools: all?.length || 0,
        totalUsers: userList?.length || 0,
        pendingCount: pending?.length || 0,
        approvedCount: all?.filter((t: any) => t.status === 'approved').length || 0,
      })
      setLoading(false)
    }
    init()
  }, [supabase, router])

  const approveTool = async (toolId: string) => {
    const { error } = await supabase.from('mcp_tools').update({ status: 'approved' }).eq('id', toolId)
    if (error) { toast.error('Failed to approve'); return }
    setPendingTools(pendingTools.filter((t) => t.id !== toolId))
    toast.success('Tool approved and published!')
  }

  const rejectTool = async (toolId: string) => {
    const { error } = await supabase.from('mcp_tools').update({ status: 'rejected' }).eq('id', toolId)
    if (error) { toast.error('Failed to reject'); return }
    setPendingTools(pendingTools.filter((t) => t.id !== toolId))
    toast.success('Tool rejected')
  }

  const deleteTool = async (toolId: string) => {
    if (!confirm('Permanently delete this tool?')) return
    await supabase.from('mcp_tools').delete().eq('id', toolId)
    setAllTools(allTools.filter((t) => t.id !== toolId))
    toast.success('Tool deleted')
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'pending', label: `Pending (${stats.pendingCount})`, icon: Clock },
    { id: 'tools', label: 'All Tools', icon: Zap },
    { id: 'users', label: 'Users', icon: Users },
  ] as const

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-primary" />
            </div>
            <h1 className="text-3xl font-black text-text-primary">Admin Panel</h1>
          </div>
          <p className="text-text-secondary ml-12">Manage tools, users, and platform settings.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border-subtle rounded-xl p-1 mb-8 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Tools', value: stats.totalTools, icon: Zap, color: 'text-primary' },
                { label: 'Approved Tools', value: stats.approvedCount, icon: CheckCircle, color: 'text-emerald-400' },
                { label: 'Pending Review', value: stats.pendingCount, icon: Clock, color: 'text-yellow-400' },
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-accent' },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface border border-border-subtle rounded-xl p-5">
                  <stat.icon size={20} className={`${stat.color} mb-3`} />
                  <p className="text-2xl font-black text-text-primary">{stat.value}</p>
                  <p className="text-xs text-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {pendingTools.length > 0 && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-yellow-400" />
                  <span className="text-sm text-text-primary font-medium">
                    {stats.pendingCount} tool{stats.pendingCount !== 1 ? 's' : ''} awaiting review
                  </span>
                </div>
                <Button variant="warning" size="sm" onClick={() => setTab('pending')} icon={<Eye size={14} />}>
                  Review Now
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Pending Tools */}
        {tab === 'pending' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {pendingTools.length === 0 ? (
              <div className="text-center py-20 bg-surface border border-border-subtle rounded-xl">
                <CheckCircle size={40} className="text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">All caught up!</h3>
                <p className="text-text-secondary">No tools pending review.</p>
              </div>
            ) : (
              pendingTools.map((tool) => {
                const catMeta = getCategoryMeta(tool.category)
                return (
                  <div key={tool.id} className="bg-surface border border-yellow-500/20 rounded-xl p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{catMeta.icon}</span>
                        <div>
                          <h3 className="text-base font-semibold text-text-primary">{tool.name}</h3>
                          <p className="text-sm text-text-secondary mt-1">{tool.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                            <span>By {(tool as any).creator?.name || (tool as any).creator?.email}</span>
                            <span>{formatDate(tool.created_at)}</span>
                            <span>v{tool.version}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="warning" size="sm">Pending</Badge>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted mb-4">
                      <span><strong className="text-text-secondary">Endpoint:</strong> {tool.api_endpoint}</span>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="success"
                        size="sm"
                        icon={<CheckCircle size={15} />}
                        onClick={() => approveTool(tool.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<XCircle size={15} />}
                        onClick={() => rejectTool(tool.id)}
                      >
                        Reject
                      </Button>
                      <Link href={`/tools/${tool.id}`} target="_blank">
                        <Button variant="ghost" size="sm" icon={<Eye size={14} />}>Preview</Button>
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </motion.div>
        )}

        {/* All Tools */}
        {tab === 'tools' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {['Tool', 'Category', 'Creator', 'Status', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allTools.map((tool) => {
                    const catMeta = getCategoryMeta(tool.category)
                    const statusColor = tool.status === 'approved' ? 'success' : tool.status === 'pending' ? 'warning' : 'danger'
                    return (
                      <tr key={tool.id} className="border-b border-border-subtle hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{catMeta.icon}</span>
                            <span className="font-medium text-text-primary">{tool.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{catMeta.label}</td>
                        <td className="px-4 py-3 text-muted">{(tool as any).creator?.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusColor as any} size="sm">{tool.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted">{formatDate(tool.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/tools/${tool.id}`} target="_blank">
                              <Button variant="ghost" size="sm" icon={<Eye size={12} />} />
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={12} />}
                              onClick={() => deleteTool(tool.id)}
                              className="text-red-400 hover:text-red-300"
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {['User', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border-subtle hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-text-primary">{user.name || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-muted">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'developer' ? 'primary' : 'default'} size="sm">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" icon={<Settings size={12} />}>Manage</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
