'use client'

import { motion } from 'framer-motion'
import { Wifi, WifiOff, BarChart3, Clock, Settings, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDistanceToNow } from 'date-fns'

interface InstalledMcp {
  id: string
  mcp_slug: string
  mcp_token: string
  connected_email: string | null
  status: string
  call_count: number
  last_called_at: string | null
  created_at: string
}

interface McpMeta {
  slug: string
  name: string
  icon: string
  description: string
}

interface McpCardProps {
  installed: InstalledMcp
  meta: McpMeta
  onManage: () => void
  index?: number
}

export function McpCard({ installed, meta, onManage, index = 0 }: McpCardProps) {
  const isConnected = installed.status === 'connected'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.eternalmcp.com'
  const endpointUrl = `${appUrl}/api/mcp/${installed.mcp_token}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface border border-border-subtle rounded-2xl p-5 hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-surface-2 rounded-xl flex items-center justify-center text-2xl shrink-0">
            {meta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text-primary text-sm">{meta.name}</h3>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  isConnected
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                }`}
              >
                {isConnected
                  ? <><Wifi size={10} /> Connected</>
                  : <><WifiOff size={10} /> Pending</>}
              </span>
            </div>
            {installed.connected_email && (
              <p className="text-xs text-muted mt-0.5">{installed.connected_email}</p>
            )}
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={onManage} icon={<Settings size={13} />}>
          Manage
        </Button>
      </div>

      {/* Endpoint URL */}
      {isConnected && (
        <div className="mt-4 flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2">
          <span className="text-xs text-muted font-mono truncate flex-1">{endpointUrl}</span>
          <button
            onClick={() => navigator.clipboard.writeText(endpointUrl)}
            className="text-xs text-primary hover:text-primary-light transition-colors shrink-0 flex items-center gap-1"
          >
            <ExternalLink size={11} />
            Copy
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-subtle">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <BarChart3 size={12} />
          <span>{installed.call_count.toLocaleString()} calls</span>
        </div>
        {installed.last_called_at ? (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock size={12} />
            <span>
              {formatDistanceToNow(new Date(installed.last_called_at), { addSuffix: true })}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted">Never called yet</span>
        )}
      </div>
    </motion.div>
  )
}
