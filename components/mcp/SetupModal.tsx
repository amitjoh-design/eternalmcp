'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, BookOpen } from 'lucide-react'
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

export function SetupModal({ token, email, mcpName, mcpIcon, appUrl, onClose }: SetupModalProps) {
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
          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
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

            {/* Steps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-primary" />
                <span className="text-sm font-medium text-text-primary">How to use in your AI client</span>
              </div>
              <ol className="space-y-2.5">
                {[
                  'Copy the config snippet for your AI client below',
                  <>Open the config file and paste — merge into an existing <code className="text-primary">mcpServers</code> key if one already exists</>,
                  'Save the file and restart your AI client',
                  'Ask your AI to send an email — it will call the Gmail tool automatically',
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
