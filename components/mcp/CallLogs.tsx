'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Mail, FileText, Clock, Globe, Monitor } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface CallLog {
  id: string
  tool_name: string
  ip_address: string | null
  user_agent: string | null
  status: 'success' | 'error'
  error_message: string | null
  created_at: string
}

interface CallLogsProps {
  installedMcpId: string
}

const TOOL_LABEL: Record<string, string> = {
  send_email: 'Send Email',
  create_draft: 'Create Draft',
}

function parseUA(ua: string | null) {
  if (!ua || ua === 'unknown') return null
  if (ua.includes('mcp-remote')) return 'mcp-remote'
  if (ua.includes('Windows NT')) return 'Windows'
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'Mac'
  if (ua.includes('Linux')) return 'Linux'
  return ua.slice(0, 24)
}

export function CallLogs({ installedMcpId }: CallLogsProps) {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('mcp_call_logs')
      .select('id, tool_name, ip_address, user_agent, status, error_message, created_at')
      .eq('installed_mcp_id', installedMcpId)
      .order('created_at', { ascending: false })
      .limit(25)
    setLogs((data as CallLog[]) || [])
    setLoading(false)
  }, [supabase, installedMcpId])

  useEffect(() => {
    if (open) fetchLogs()
  }, [open, fetchLogs])

  return (
    <div className="border-t border-border-subtle mt-3 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-muted hover:text-text-primary transition-colors w-full"
      >
        <Clock size={12} />
        <span className="font-medium">Activity Log</span>
        {open ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
      </button>

      {open && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">No calls yet — use the MCP to see activity here.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const device = parseUA(log.user_agent)
                return (
                  <div key={log.id} className="bg-surface-2 rounded-lg px-3 py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      {log.status === 'success'
                        ? <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                        : <XCircle size={11} className="text-red-400 shrink-0" />}
                      <span className="flex items-center gap-1 text-text-primary font-medium">
                        {log.tool_name === 'send_email'
                          ? <Mail size={11} className="shrink-0" />
                          : <FileText size={11} className="shrink-0" />}
                        {TOOL_LABEL[log.tool_name] ?? log.tool_name}
                      </span>
                      <span
                        className="ml-auto text-muted"
                        title={format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss')}
                      >
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-muted">
                      {log.ip_address && log.ip_address !== 'unknown' && (
                        <span className="flex items-center gap-1">
                          <Globe size={10} />
                          {log.ip_address}
                        </span>
                      )}
                      {device && (
                        <span className="flex items-center gap-1">
                          <Monitor size={10} />
                          {device}
                        </span>
                      )}
                      <span className="text-[10px]">
                        {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm')}
                      </span>
                    </div>

                    {log.status === 'error' && log.error_message && (
                      <p className="mt-1 text-red-400 text-[10px] leading-tight">{log.error_message}</p>
                    )}
                  </div>
                )
              })}
              <p className="text-[10px] text-muted text-center pt-1">
                Showing last 25 calls · Full history available in admin
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
