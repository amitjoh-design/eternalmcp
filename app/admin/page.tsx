'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Shield, CheckCircle, XCircle, Clock, Trash2,
  Users, Zap, BarChart3, RefreshCw, Eye, Settings,
  Activity, Download, Globe, Monitor, Mail, FileText
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MCPTool, User } from '@/lib/types'
import { formatDate, getCategoryMeta } from '@/lib/utils'
import { format, subDays } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'

type AdminTab = 'overview' | 'pending' | 'tools' | 'users' | 'mcp-logs'

interface McpCallLog {
  id: string
  tool_name: string
  to_address: string | null
  subject: string | null
  ip_address: string | null
  user_agent: string | null
  status: 'success' | 'error'
  error_message: string | null
  created_at: string
  installed_mcp: { mcp_slug: string } | null
  user: { email: string } | null
}

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('overview')
  const [loading, setLoading] = useState(true)
  const [pendingTools, setPendingTools] = useState<MCPTool[]>([])
  const [allTools, setAllTools] = useState<MCPTool[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({ totalTools: 0, totalUsers: 0, pendingCount: 0, approvedCount: 0 })
  const [mcpLogs, setMcpLogs] = useState<McpCallLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [fromDate, setFromDate] = useState(() => format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
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

  const fetchMcpLogs = async () => {
    setLogsLoading(true)
    const from = `${fromDate}T00:00:00.000Z`
    const to = `${toDate}T23:59:59.999Z`
    const { data, error } = await supabase
      .from('mcp_call_logs')
      .select('*, installed_mcp:installed_mcps(mcp_slug), user:users!mcp_call_logs_user_id_fkey(email)')
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false })
    if (error) toast.error('Failed to load logs: ' + error.message)
    setMcpLogs((data as unknown as McpCallLog[]) || [])
    setLogsLoading(false)
  }

  const downloadCsv = () => {
    const header = ['User', 'MCP', 'Tool', 'To', 'Subject', 'IP Address', 'Device', 'Status', 'Error', 'Date/Time (UTC)']
    const rows = mcpLogs.map((l) => [
      l.user?.email ?? '',
      l.installed_mcp?.mcp_slug ?? '',
      l.tool_name,
      l.to_address ?? '',
      l.subject ?? '',
      l.ip_address ?? '',
      l.user_agent ?? '',
      l.status,
      l.error_message ?? '',
      l.created_at,
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mcp-logs-${fromDate}-to-${toDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
    { id: 'mcp-logs', label: 'MCP Logs', icon: Activity },
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
                <Button variant="outline" size="sm" onClick={() => setTab('pending')} icon={<Eye size={14} />}>
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
                        variant="primary"
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

        {/* MCP Logs */}
        {tab === 'mcp-logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Filters */}
            <div className="bg-surface border border-border-subtle rounded-xl p-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={fetchMcpLogs}
                icon={<RefreshCw size={14} className={logsLoading ? 'animate-spin' : ''} />}
              >
                {logsLoading ? 'Loading…' : 'Fetch Logs'}
              </Button>
              {mcpLogs.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadCsv}
                  icon={<Download size={14} />}
                  className="ml-auto"
                >
                  Download CSV ({mcpLogs.length} rows)
                </Button>
              )}
            </div>

            {/* Summary */}
            {mcpLogs.length > 0 && (
              <div className="flex gap-4 text-xs text-muted">
                <span className="text-text-primary font-semibold">{mcpLogs.length} total records</span>
                <span className="text-green-400">{mcpLogs.filter((l) => l.status === 'success').length} successful</span>
                <span className="text-red-400">{mcpLogs.filter((l) => l.status === 'error').length} errors</span>
              </div>
            )}

            {/* Table */}
            {mcpLogs.length > 0 ? (
              <div className="overflow-x-auto bg-surface border border-border-subtle rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      {['Status', 'User', 'MCP', 'Tool', 'To', 'Subject', 'IP Address', 'Device', 'Date / Time'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mcpLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border-subtle hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          {log.status === 'success'
                            ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={11} /> OK</span>
                            : <span className="flex items-center gap-1 text-red-400 text-xs" title={log.error_message ?? ''}><XCircle size={11} /> Error</span>}
                        </td>
                        <td className="px-4 py-3 text-muted text-xs">{log.user?.email ?? '—'}</td>
                        <td className="px-4 py-3 text-muted text-xs">{log.installed_mcp?.mcp_slug ?? '—'}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className="flex items-center gap-1 text-text-primary">
                            {log.tool_name === 'send_email' ? <Mail size={11} /> : <FileText size={11} />}
                            {log.tool_name === 'send_email' ? 'Send Email' : 'Create Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted text-xs max-w-[160px] truncate">{log.to_address ?? '—'}</td>
                        <td className="px-4 py-3 text-muted text-xs max-w-[180px] truncate italic">{log.subject ?? '—'}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className="flex items-center gap-1 text-muted font-mono">
                            <Globe size={10} />
                            {log.ip_address ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="flex items-center gap-1 text-muted">
                            <Monitor size={10} />
                            {log.user_agent
                              ? log.user_agent.includes('mcp-remote') ? 'mcp-remote'
                                : log.user_agent.includes('Windows') ? 'Windows'
                                : log.user_agent.includes('Mac') ? 'Mac'
                                : log.user_agent.slice(0, 20)
                              : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !logsLoading ? (
              <div className="text-center py-16 bg-surface border border-border-subtle rounded-xl">
                <Activity size={36} className="text-border-subtle mx-auto mb-4" />
                <p className="text-text-secondary text-sm">Select a date range and click Fetch Logs.</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </div>
    </div>
  )
}
