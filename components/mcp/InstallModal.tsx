'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Shield, CheckCircle, XCircle, Code, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SourceViewer } from './SourceViewer'
import { ConfigSnippet } from './ConfigSnippet'
import { GMAIL_MCP_DEFINITION, GMAIL_SOURCE_FILES } from '@/lib/mcps/gmail/definition'

interface InstalledMcp {
  id: string
  mcp_slug: string
  mcp_token: string
  connected_email: string | null
  status: string
  call_count: number
  last_called_at: string | null
}

interface InstallModalProps {
  onClose: () => void
  userId: string
  slug: string
  installed?: InstalledMcp | null
  onConnected?: () => void
}

type Step = 'overview' | 'source' | 'connected'

export function InstallModal({ onClose, userId, slug, installed, onConnected }: InstallModalProps) {
  const [step, setStep] = useState<Step>(
    installed?.status === 'connected' ? 'connected' : 'overview'
  )
  const [showSource, setShowSource] = useState(false)
  const isGmail = slug === 'gmail-sender'
  const def = GMAIL_MCP_DEFINITION // used only for gmail
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.eternalmcp.com'

  // For non-Gmail MCPs (e.g. company-research), show a simpler manage view
  if (!isGmail) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface border border-border-subtle rounded-2xl shadow-glass overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center text-2xl">📊</div>
                <div>
                  <h2 className="font-bold text-text-primary">Company Research</h2>
                  <p className="text-xs text-muted">by EternalMCP · ✅ Verified</p>
                </div>
              </div>
              <button onClick={onClose} className="text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {installed ? (
                <>
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <CheckCircle size={20} className="text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Company Research Connected</p>
                      <p className="text-xs text-muted">Ready to generate equity research reports</p>
                    </div>
                  </div>
                  <ConfigSnippet token={installed.mcp_token} appUrl={appUrl} slug={slug} />
                  <div className="text-xs text-muted space-y-1 pt-2 border-t border-border-subtle">
                    <p>Total calls: <span className="text-text-secondary">{installed.call_count}</span></p>
                    {installed.last_called_at && (
                      <p>Last used: <span className="text-text-secondary">{new Date(installed.last_called_at).toLocaleString()}</span></p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-secondary">This MCP is not yet connected.</p>
              )}
            </div>
            <div className="p-6 pt-0">
              <Button variant="secondary" onClick={onClose} className="w-full">Close</Button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    )
  }

  const handleConnect = () => {
    window.location.href = `/api/mcp/connect/gmail?userId=${userId}`
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-surface border border-border-subtle rounded-2xl shadow-glass overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center text-2xl">
                {def.icon}
              </div>
              <div>
                <h2 className="font-bold text-text-primary">{def.name}</h2>
                <p className="text-xs text-muted">by EternalMCP · ✅ Verified</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted hover:text-text-primary transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {step === 'overview' && (
              <div className="space-y-5">
                <p className="text-sm text-text-secondary">{def.description}</p>

                {/* Permissions */}
                <div className="bg-surface-2 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className="text-primary" />
                    <span className="text-sm font-medium text-text-primary">What this MCP can do</span>
                  </div>
                  {def.permissions.map((p, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      {p.granted
                        ? <CheckCircle size={14} className="text-green-400 shrink-0" />
                        : <XCircle size={14} className="text-red-400/60 shrink-0" />}
                      <span className={`text-xs ${p.granted ? 'text-text-secondary' : 'text-muted line-through'}`}>
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Security note */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    🔒 Your Gmail OAuth token is stored <strong className="text-text-primary">encrypted (AES-256)</strong> in your
                    account. EternalMCP never sees your Gmail password and cannot read your inbox.
                  </p>
                </div>

                {/* Source code toggle */}
                <button
                  onClick={() => setShowSource(!showSource)}
                  className="flex items-center gap-2 text-xs text-primary hover:text-primary-light transition-colors"
                >
                  <Code size={13} />
                  {showSource ? 'Hide source code' : 'View source code (read-only)'}
                </button>

                {showSource && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <SourceViewer files={GMAIL_SOURCE_FILES} />
                  </motion.div>
                )}
              </div>
            )}

            {step === 'connected' && installed && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <CheckCircle size={20} className="text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Gmail Connected</p>
                    <p className="text-xs text-muted">{installed.connected_email}</p>
                  </div>
                </div>

                <ConfigSnippet token={installed.mcp_token} appUrl={appUrl} slug={slug} />

                <div className="text-xs text-muted space-y-1 pt-2 border-t border-border-subtle">
                  <p>Total calls: <span className="text-text-secondary">{installed.call_count}</span></p>
                  {installed.last_called_at && (
                    <p>Last used: <span className="text-text-secondary">{new Date(installed.last_called_at).toLocaleString()}</span></p>
                  )}
                </div>

                <button
                  onClick={handleConnect}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-light transition-colors"
                >
                  <ExternalLink size={12} />
                  Reconnect Gmail account
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 flex gap-3">
            {step === 'overview' && (
              <>
                <Button variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="glow"
                  onClick={handleConnect}
                  icon={<ChevronRight size={16} />}
                  className="flex-1"
                >
                  Connect Gmail
                </Button>
              </>
            )}
            {step === 'connected' && (
              <Button variant="secondary" onClick={onClose} className="w-full">
                Close
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
