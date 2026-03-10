'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, BookOpen, Download, Apple, Monitor, Hammer, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfigSnippet } from './ConfigSnippet'

interface SetupModalProps {
  token: string
  email: string | null
  mcpName: string
  mcpIcon: string
  appUrl?: string
  onClose: () => void
}

export function SetupModal({ token, email, mcpName, mcpIcon, appUrl = 'https://www.eternalmcp.com', onClose }: SetupModalProps) {
  const emailParam = email ? `&email=${encodeURIComponent(email)}` : ''
  const macUrl    = `/api/mcp/install/${token}?platform=mac${emailParam}`
  const winUrl    = `/api/mcp/install/${token}?platform=windows${emailParam}`

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
                {mcpIcon}
              </div>
              <div>
                <h2 className="font-bold text-text-primary">{mcpName} — Setup Guide</h2>
                <p className="text-xs text-muted">Add to your AI coding assistant</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted hover:text-text-primary transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">

            {/* Connected status */}
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle size={16} className="text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Connected{email ? ` as ${email}` : ''}
                </p>
                <p className="text-xs text-muted">Token encrypted and ready to use</p>
              </div>
            </div>

            {/* ── AUTO-INSTALL (prominent, non-tech users) ── */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Download size={14} className="text-primary" />
                <span className="text-sm font-semibold text-text-primary">Auto-Install</span>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">
                  Recommended
                </span>
              </div>

              <p className="text-xs text-text-secondary">
                Download a script that automatically updates your Claude Desktop config — no manual editing needed.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {/* Mac / Linux */}
                <a
                  href={macUrl}
                  download="install-gmail-mcp.sh"
                  className="flex flex-col items-center gap-2 p-3 bg-surface border border-border-subtle hover:border-primary/40 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 bg-surface-2 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Apple size={16} className="text-text-secondary group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-text-primary">Mac / Linux</p>
                    <p className="text-[10px] text-muted mt-0.5">install-gmail-mcp.sh</p>
                  </div>
                  <span className="text-[10px] text-primary flex items-center gap-0.5">
                    <Download size={9} /> Download
                  </span>
                </a>

                {/* Windows */}
                <a
                  href={winUrl}
                  download="install-gmail-mcp.bat"
                  className="flex flex-col items-center gap-2 p-3 bg-surface border border-border-subtle hover:border-primary/40 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 bg-surface-2 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Monitor size={16} className="text-text-secondary group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-text-primary">Windows</p>
                    <p className="text-[10px] text-muted mt-0.5">install-gmail-mcp.bat</p>
                  </div>
                  <span className="text-[10px] text-primary flex items-center gap-0.5">
                    <Download size={9} /> Download
                  </span>
                </a>
              </div>

              {/* Run instructions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-surface-2 rounded-lg p-2.5 space-y-1">
                  <p className="text-[10px] font-semibold text-text-primary">Mac / Linux</p>
                  <p className="text-[10px] text-muted leading-relaxed">
                    Open Terminal, drag the file in, press Enter. Then restart Claude Desktop.
                  </p>
                </div>
                <div className="bg-surface-2 rounded-lg p-2.5 space-y-1">
                  <p className="text-[10px] font-semibold text-text-primary">Windows</p>
                  <p className="text-[10px] text-muted leading-relaxed">
                    Double-click the .bat file. Then restart Claude Desktop.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-xs text-muted">or configure manually</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Manual steps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-primary" />
                <span className="text-sm font-medium text-text-primary">Manual setup</span>
              </div>
              <ol className="space-y-2.5">
                {[
                  'Copy the config snippet for your AI client below',
                  <>Open the config file and paste — merge into any existing <code className="text-primary">mcpServers</code> key</>,
                  'Save the file and restart your AI client',
                  'Ask your AI to send an email — it will use Gmail automatically',
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-text-secondary">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-center text-[10px] font-bold shrink-0 leading-4">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Config snippet with client tabs */}
            <ConfigSnippet token={token} appUrl={appUrl} />

            {/* ── VERIFY IT WORKED ── */}
            <div className="bg-surface-2 border border-border-subtle rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Hammer size={14} className="text-accent" />
                <span className="text-sm font-semibold text-text-primary">Verify it worked</span>
              </div>

              <p className="text-xs text-text-secondary">
                After restarting Claude Desktop, the{' '}
                <strong className="text-text-primary">🔨 tools icon</strong> appears in the chat bar
                bottom-left — next to the <strong className="text-text-primary">+</strong> button.
              </p>

              {/* Visual mockup matching actual Claude Desktop UI */}
              <div className="rounded-xl overflow-hidden border border-black/20 shadow-md">
                {/* Title bar */}
                <div className="bg-[#f0ede8] flex items-center justify-between px-3 py-2 border-b border-black/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-[10px] text-black/40 font-medium">Claude Desktop</span>
                  <div className="w-12" />
                </div>
                {/* Chat input area */}
                <div className="bg-[#f7f4ef] p-3 space-y-2">
                  <div className="bg-white rounded-xl border border-black/10 px-3 py-2.5 shadow-sm">
                    <p className="text-[11px] text-black/30 mb-3">Type / for commands</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* + button */}
                        <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center">
                          <span className="text-[13px] text-black/40 leading-none">+</span>
                        </div>
                        {/* Hammer icon — highlighted */}
                        <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                          <span className="text-[11px] leading-none">🔨</span>
                        </div>
                        <div className="text-[9px] text-primary font-semibold animate-pulse">← appears here</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-black/30">Sonnet 4.6</span>
                        <div className="w-5 h-5 rounded-md bg-[#d4a89a] flex items-center justify-center">
                          <span className="text-[9px] text-white">↑</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-black/30 text-center">
                    Click 🔨 to see connected tools — you should see <code className="bg-black/5 px-1 rounded">send_email</code> and <code className="bg-black/5 px-1 rounded">create_draft</code>
                  </p>
                </div>
              </div>

              {/* What to see */}
              <div className="flex gap-2">
                {['send_email', 'create_draft'].map((tool) => (
                  <div
                    key={tool}
                    className="flex items-center gap-1.5 bg-surface border border-border-subtle rounded-lg px-2.5 py-1.5"
                  >
                    <Wrench size={10} className="text-primary" />
                    <span className="text-[11px] font-mono text-text-primary">{tool}</span>
                  </div>
                ))}
              </div>

              {/* Test prompt */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5">
                <p className="text-[10px] text-muted mb-1">Try this prompt in Claude Desktop:</p>
                <p className="text-xs text-text-primary font-mono">
                  &quot;Send a test email to {email || 'yourself'} with subject Hello from Claude&quot;
                </p>
              </div>

              {/* Important: fully quit note */}
              <p className="text-[10px] text-yellow-400/80">
                ⚠️ Make sure to <strong>fully quit</strong> Claude Desktop (not just close the window) and reopen it — otherwise the config won&apos;t load.
              </p>
            </div>

          </div>

          <div className="p-6 pt-0">
            <Button variant="secondary" onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
