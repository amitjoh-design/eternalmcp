'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, BookOpen, Download, Apple, Monitor, Hammer, Wrench, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { useState as useLocalState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfigSnippet } from './ConfigSnippet'

interface SetupModalProps {
  token: string
  email: string | null
  mcpName: string
  mcpIcon: string
  appUrl?: string
  slug?: string
  onClose: () => void
}

// Per-MCP content that differs between MCPs
const MCP_CONTENT: Record<string, {
  step4: string
  tools: string[]
  testPrompt: (email: string | null) => string
  scriptBaseName: string
}> = {
  gmail: {
    step4: 'Ask your AI to send an email — it will use Gmail automatically',
    tools: ['send_email', 'create_draft'],
    testPrompt: (email) => `Send a test email to ${email || 'myself'} with subject Hello from Claude`,
    scriptBaseName: 'gmail-mcp',
  },
  'company-research': {
    step4: 'Ask your AI to research a company — it will generate a PDF report',
    tools: ['research_company'],
    testPrompt: () => 'Research Reliance Industries on NSE and give me the PDF',
    scriptBaseName: 'research-mcp',
  },
}

export function SetupModal({ token, email, mcpName, mcpIcon, appUrl = 'https://www.eternalmcp.com', slug = 'gmail', onClose }: SetupModalProps) {
  const [showFindGuide, setShowFindGuide] = useLocalState(false)
  const emailParam = email ? `&email=${encodeURIComponent(email)}` : ''
  const macUrl    = `/api/mcp/install/${token}?platform=mac&slug=${slug}${emailParam}`
  const winUrl    = `/api/mcp/install/${token}?platform=windows&slug=${slug}${emailParam}`
  const content   = MCP_CONTENT[slug] ?? MCP_CONTENT.gmail

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#111118] border border-indigo-500/20 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.15)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-2xl">
                {mcpIcon}
              </div>
              <div>
                <h2 className="font-bold text-white">{mcpName} — Setup Guide</h2>
                <p className="text-xs text-slate-400">Add to your AI coding assistant</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">

            {/* Connected status */}
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">
                  {email ? `Connected as ${email}` : 'Connected — ready to use'}
                </p>
                <p className="text-xs text-slate-400">Token encrypted and stored securely</p>
              </div>
            </div>

            {/* ── AUTO-INSTALL ── */}
            <div className="bg-indigo-500/5 border border-indigo-500/25 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Download size={14} className="text-indigo-400" />
                <span className="text-sm font-semibold text-white">Auto-Install</span>
                <span className="text-[10px] bg-indigo-500/25 text-indigo-300 px-1.5 py-0.5 rounded-full font-semibold">
                  Recommended
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Download a script that automatically updates your Claude Desktop config — no manual editing needed.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {/* Mac / Linux */}
                <a
                  href={macUrl}
                  download={`install-${content.scriptBaseName}.sh`}
                  className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/10 hover:border-indigo-400/50 hover:bg-indigo-500/10 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <Apple size={16} className="text-slate-300 group-hover:text-indigo-300 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white">Mac / Linux</p>
                    <p className="text-[10px] text-cyan-400 mt-0.5">install-{content.scriptBaseName}.sh</p>
                  </div>
                  <span className="text-[10px] text-indigo-400 flex items-center gap-0.5 font-medium">
                    <Download size={9} /> Download
                  </span>
                </a>

                {/* Windows */}
                <a
                  href={winUrl}
                  download={`install-${content.scriptBaseName}.bat`}
                  className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/10 hover:border-indigo-400/50 hover:bg-indigo-500/10 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <Monitor size={16} className="text-slate-300 group-hover:text-indigo-300 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white">Windows</p>
                    <p className="text-[10px] text-cyan-400 mt-0.5">install-{content.scriptBaseName}.bat</p>
                  </div>
                  <span className="text-[10px] text-indigo-400 flex items-center gap-0.5 font-medium">
                    <Download size={9} /> Download
                  </span>
                </a>
              </div>

              {/* Run instructions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white/5 rounded-lg p-2.5 space-y-1 border border-white/5">
                  <p className="text-[10px] font-bold text-white">Mac / Linux</p>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Open Terminal, drag the file in, press Enter. Then restart Claude Desktop.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5 space-y-1 border border-white/5">
                  <p className="text-[10px] font-bold text-white">Windows</p>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Double-click the .bat file. Then restart Claude Desktop.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-400 font-medium">or configure manually</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Manual steps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-indigo-400" />
                <span className="text-sm font-semibold text-white">Manual setup</span>
              </div>
              <ol className="space-y-2.5">
                {[
                  'Copy the config snippet for your AI client below',
                  <>Open the config file and paste — merge into any existing <code className="text-cyan-400 bg-cyan-400/10 px-1 rounded">mcpServers</code> key</>,
                  'Save the file and restart your AI client',
                  content.step4,
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-center text-[10px] font-bold shrink-0 leading-5 shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                      {i + 1}
                    </span>
                    <span className="leading-5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* ── HOW TO FIND CONFIG FILE ── */}
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowFindGuide(!showFindGuide)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/8 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen size={14} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-white">Where is the config file?</span>
                </div>
                {showFindGuide
                  ? <ChevronUp size={14} className="text-slate-400" />
                  : <ChevronDown size={14} className="text-slate-400" />}
              </button>

              {showFindGuide && (
                <div className="p-4 space-y-4 border-t border-white/10">
                  {/* Claude Desktop shortcut */}
                  <div>
                    <p className="text-xs font-semibold text-white mb-2">
                      Easiest way — use Claude Desktop&apos;s built-in button:
                    </p>
                    <ol className="space-y-2">
                      {[
                        <>Click the <strong className="text-indigo-300">☰ three lines</strong> in the top-left of Claude Desktop</>,
                        <>Go to <strong className="text-indigo-300">Settings</strong></>,
                        <>Click <strong className="text-indigo-300">Developer</strong> in the left sidebar</>,
                        <>Click the <strong className="text-indigo-300">Edit Config</strong> button — a folder window opens</>,
                        <>Open <code className="text-cyan-400 bg-cyan-400/10 px-1 rounded">claude_desktop_config.json</code> with <strong className="text-white">Notepad</strong> or <strong className="text-white">VS Code</strong></>,
                      ].map((step, i) => (
                        <li key={i} className="flex gap-2.5 text-xs text-slate-300">
                          <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 text-center text-[10px] font-bold shrink-0 leading-4">{i + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Manual paths */}
                  <div>
                    <p className="text-xs font-semibold text-white mb-2">Or navigate there directly:</p>
                    <div className="space-y-2">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-400 mb-1">🍎 Mac</p>
                        <code className="text-[11px] text-cyan-300 break-all">~/Library/Application Support/Claude/</code>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-400 mb-1">🪟 Windows — Standard installer</p>
                        <code className="text-[11px] text-cyan-300 break-all">%APPDATA%\Claude\</code>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-400 mb-1">🪟 Windows — Microsoft Store version</p>
                        <code className="text-[11px] text-cyan-300 break-all">%LOCALAPPDATA%\Packages\Claude_xxx\LocalCache\Roaming\Claude\</code>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      💡 On Windows, paste these paths into the File Explorer address bar and press Enter.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Config snippet with client tabs */}
            <ConfigSnippet token={token} appUrl={appUrl} slug={slug} />

            {/* ── VERIFY IT WORKED ── */}
            <div className="bg-white/3 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Hammer size={14} className="text-cyan-400" />
                <span className="text-sm font-semibold text-white">Verify it worked</span>
              </div>

              <p className="text-xs text-slate-300">
                After restarting Claude Desktop, the{' '}
                <strong className="text-white">🔨 tools icon</strong> appears in the chat bar
                bottom-left — next to the <strong className="text-white">+</strong> button.
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
                        <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center">
                          <span className="text-[13px] text-black/40 leading-none">+</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center">
                          <span className="text-[11px] leading-none">🔨</span>
                        </div>
                        <div className="text-[9px] text-indigo-600 font-bold animate-pulse">← appears here</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-black/30">Sonnet 4.6</span>
                        <div className="w-5 h-5 rounded-md bg-[#d4a89a] flex items-center justify-center">
                          <span className="text-[9px] text-white">↑</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-black/40 text-center">
                    Click 🔨 to see connected tools — you should see{' '}
                    {content.tools.map((t, i) => (
                      <span key={t}>{i > 0 && ' and '}<code className="bg-black/8 px-1 rounded font-semibold">{t}</code></span>
                    ))}
                  </p>
                </div>
              </div>

              {/* Tool badges */}
              <div className="flex flex-wrap gap-2">
                {content.tools.map((tool) => (
                  <div
                    key={tool}
                    className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-2.5 py-1.5"
                  >
                    <Wrench size={10} className="text-indigo-400" />
                    <span className="text-[11px] font-mono text-indigo-200 font-semibold">{tool}</span>
                  </div>
                ))}
              </div>

              {/* Test prompt */}
              <div className="bg-indigo-500/8 border border-indigo-500/25 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400 mb-1 font-medium">Try this prompt in Claude Desktop:</p>
                <p className="text-xs text-white font-mono font-medium">
                  &quot;{content.testPrompt(email)}&quot;
                </p>
              </div>

              {/* Important: fully quit note */}
              <p className="text-[10px] text-yellow-300 font-medium">
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
