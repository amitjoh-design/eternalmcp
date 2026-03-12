'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, BookOpen, Download, Apple, Monitor, Hammer, Wrench, FolderOpen, ChevronDown, ChevronUp, Key, Loader2, Lightbulb } from 'lucide-react'
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
  prompts: string[]
}> = {
  gmail: {
    step4: 'Ask your AI to send an email — it will use Gmail automatically',
    tools: ['send_email', 'create_draft'],
    testPrompt: (email) => `Use tool send_email to send a test email to ${email || 'myself'} with subject "Hello from Claude"`,
    scriptBaseName: 'gmail-mcp',
    prompts: [
      'Use tool send_email to send a meeting invite to john@example.com',
      'Use tool create_draft to draft a follow-up email for my last meeting',
      'Use tool send_email to send the research report PDF as an attachment',
    ],
  },
  'company-research': {
    step4: 'Ask your AI to research a company — it will generate a PDF report',
    tools: ['research_company'],
    testPrompt: () => 'Use tool research_company to research Reliance Industries on NSE and give me the PDF',
    scriptBaseName: 'research-mcp',
    prompts: [
      'Use tool research_company to research Reliance Industries on NSE',
      'Use tool research_company to generate a report on Apple Inc on NASDAQ',
      'Use tool research_company to research HDFC Bank on BSE and email me the PDF',
    ],
  },
}

export function SetupModal({ token, email, mcpName, mcpIcon, appUrl = 'https://www.eternalmcp.com', slug = 'gmail', onClose }: SetupModalProps) {
  const [showFindGuide, setShowFindGuide] = useLocalState(false)
  const [apiKey, setApiKey] = useLocalState('')
  const [apiKeySaving, setApiKeySaving] = useLocalState(false)
  const [apiKeySaved, setApiKeySaved] = useLocalState(false)
  const [apiKeyError, setApiKeyError] = useLocalState('')
  const emailParam = email ? `&email=${encodeURIComponent(email)}` : ''
  const macUrl    = `/api/mcp/install/${token}?platform=mac&slug=${slug}${emailParam}`
  const winUrl    = `/api/mcp/install/${token}?platform=windows&slug=${slug}${emailParam}`
  const content   = MCP_CONTENT[slug] ?? MCP_CONTENT.gmail

  const saveApiKey = async () => {
    if (!apiKey.trim()) return
    setApiKeySaving(true)
    setApiKeyError('')
    try {
      const res = await fetch('/api/mcp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, anthropic_api_key: apiKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setApiKeySaved(true)
      setApiKey('')
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : 'Failed to save key')
    } finally {
      setApiKeySaving(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-2xl">
                {mcpIcon}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{mcpName} — Setup Guide</h2>
                <p className="text-xs text-gray-500">Add to your AI coding assistant</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">

            {/* Connected status */}
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {email ? `Connected as ${email}` : 'Connected — ready to use'}
                </p>
                <p className="text-xs text-gray-500">Token encrypted and stored securely</p>
              </div>
            </div>

            {/* ── HOW TO USE IN CLAUDE ── */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={14} className="text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-900">How to use in Claude</span>
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed">
                <strong>Important:</strong> Always say <strong>&quot;use tool [tool_name]&quot;</strong> in your prompt so Claude knows to use this MCP instead of its built-in skills.
              </p>
              <div className="space-y-1.5">
                {content.prompts.map((prompt, i) => (
                  <div key={i} className="bg-white border border-indigo-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-indigo-800 font-mono">&quot;{prompt}&quot;</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-indigo-500">
                💡 Available tools: {content.tools.map(t => <code key={t} className="bg-indigo-100 px-1 rounded font-semibold">{t}</code>).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, ', ', el], [])}
              </p>
            </div>

            {/* ── ANTHROPIC API KEY (Company Research only) ── */}
            {slug === 'company-research' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-amber-600" />
                  <span className="text-sm font-semibold text-gray-900">Your Anthropic API Key</span>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold border border-amber-200">
                    Recommended
                  </span>
                </div>

                {apiKeySaved ? (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium">API key saved — unlimited reports, no credits deducted!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-600">
                      Enter your Anthropic API key to generate <strong className="text-gray-900">unlimited reports at no cost</strong>.
                      Without it, each report costs <strong className="text-amber-700">₹25</strong> from your credit balance.
                    </p>
                    <div className="space-y-2">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-ant-api03-..."
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 font-mono"
                      />
                      {apiKeyError && (
                        <p className="text-[11px] text-red-600">{apiKeyError}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <a
                          href="https://console.anthropic.com/settings/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-amber-600 hover:text-amber-700 underline underline-offset-2"
                        >
                          Get your key at console.anthropic.com →
                        </a>
                        <button
                          onClick={saveApiKey}
                          disabled={!apiKey.trim() || apiKeySaving}
                          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {apiKeySaving ? <Loader2 size={11} className="animate-spin" /> : <Key size={11} />}
                          {apiKeySaving ? 'Saving...' : 'Save Key'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── AUTO-INSTALL ── */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Download size={14} className="text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900">Auto-Install</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold border border-indigo-200">
                  Recommended
                </span>
              </div>

              <p className="text-xs text-gray-600">
                Download a script that automatically updates your Claude Desktop config — no manual editing needed.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {/* Mac / Linux */}
                <a
                  href={macUrl}
                  download={`install-${content.scriptBaseName}.sh`}
                  className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Apple size={16} className="text-gray-500 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-800">Mac / Linux</p>
                    <p className="text-[10px] text-indigo-600 mt-0.5">install-{content.scriptBaseName}.sh</p>
                  </div>
                  <span className="text-[10px] text-indigo-600 flex items-center gap-0.5 font-medium">
                    <Download size={9} /> Download
                  </span>
                </a>

                {/* Windows */}
                <a
                  href={winUrl}
                  download={`install-${content.scriptBaseName}.bat`}
                  className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Monitor size={16} className="text-gray-500 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-800">Windows</p>
                    <p className="text-[10px] text-indigo-600 mt-0.5">install-{content.scriptBaseName}.bat</p>
                  </div>
                  <span className="text-[10px] text-indigo-600 flex items-center gap-0.5 font-medium">
                    <Download size={9} /> Download
                  </span>
                </a>
              </div>

              {/* Run instructions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white rounded-lg p-2.5 space-y-1 border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-800">Mac / Linux</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Open Terminal, drag the file in, press Enter. Then restart Claude Desktop.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2.5 space-y-1 border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-800">Windows</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Double-click the .bat file. Then restart Claude Desktop.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or configure manually</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Manual steps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900">Manual setup</span>
              </div>
              <ol className="space-y-2.5">
                {[
                  'Copy the config snippet for your AI client below',
                  <>Open the config file and paste — merge into any existing <code className="text-indigo-600 bg-indigo-50 px-1 rounded">mcpServers</code> key</>,
                  'Save the file and restart your AI client',
                  content.step4,
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-center text-[10px] font-bold shrink-0 leading-5">
                      {i + 1}
                    </span>
                    <span className="leading-5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* ── HOW TO FIND CONFIG FILE ── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowFindGuide(!showFindGuide)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen size={14} className="text-indigo-600" />
                  <span className="text-xs font-semibold text-gray-800">Where is the config file?</span>
                </div>
                {showFindGuide
                  ? <ChevronUp size={14} className="text-gray-400" />
                  : <ChevronDown size={14} className="text-gray-400" />}
              </button>

              {showFindGuide && (
                <div className="p-4 space-y-4 border-t border-gray-100">
                  {/* Claude Desktop shortcut */}
                  <div>
                    <p className="text-xs font-semibold text-gray-800 mb-2">
                      Easiest way — use Claude Desktop&apos;s built-in button:
                    </p>
                    <ol className="space-y-2">
                      {[
                        <>Click the <strong className="text-indigo-600">☰ three lines</strong> in the top-left of Claude Desktop</>,
                        <>Go to <strong className="text-indigo-600">Settings</strong></>,
                        <>Click <strong className="text-indigo-600">Developer</strong> in the left sidebar</>,
                        <>Click the <strong className="text-indigo-600">Edit Config</strong> button — a folder window opens</>,
                        <>Open <code className="text-indigo-600 bg-indigo-50 px-1 rounded">claude_desktop_config.json</code> with <strong className="text-gray-900">Notepad</strong> or <strong className="text-gray-900">VS Code</strong></>,
                      ].map((step, i) => (
                        <li key={i} className="flex gap-2.5 text-xs text-gray-600">
                          <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-center text-[10px] font-bold shrink-0 leading-4">{i + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Manual paths */}
                  <div>
                    <p className="text-xs font-semibold text-gray-800 mb-2">Or navigate there directly:</p>
                    <div className="space-y-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                        <p className="text-[10px] text-gray-500 mb-1">🍎 Mac</p>
                        <code className="text-[11px] text-indigo-700 break-all">~/Library/Application Support/Claude/</code>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                        <p className="text-[10px] text-gray-500 mb-1">🪟 Windows — Standard installer</p>
                        <code className="text-[11px] text-indigo-700 break-all">%APPDATA%\Claude\</code>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                        <p className="text-[10px] text-gray-500 mb-1">🪟 Windows — Microsoft Store version</p>
                        <code className="text-[11px] text-indigo-700 break-all">%LOCALAPPDATA%\Packages\Claude_xxx\LocalCache\Roaming\Claude\</code>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                      💡 On Windows, paste these paths into the File Explorer address bar and press Enter.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Config snippet with client tabs */}
            <ConfigSnippet token={token} appUrl={appUrl} slug={slug} />

            {/* ── VERIFY IT WORKED ── */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Hammer size={14} className="text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900">Verify it worked</span>
              </div>

              <p className="text-xs text-gray-600">
                After restarting Claude Desktop, the{' '}
                <strong className="text-gray-900">🔨 tools icon</strong> appears in the chat bar
                bottom-left — next to the <strong className="text-gray-900">+</strong> button.
              </p>

              {/* Visual mockup matching actual Claude Desktop UI */}
              <div className="rounded-xl overflow-hidden border border-black/10 shadow-sm">
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
                    className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5"
                  >
                    <Wrench size={10} className="text-indigo-600" />
                    <span className="text-[11px] font-mono text-indigo-700 font-semibold">{tool}</span>
                  </div>
                ))}
              </div>

              {/* Test prompt */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1 font-medium">Try this prompt in Claude Desktop:</p>
                <p className="text-xs text-indigo-800 font-mono font-medium">
                  &quot;{content.testPrompt(email)}&quot;
                </p>
              </div>

              {/* Important: fully quit note */}
              <p className="text-[10px] text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-lg p-2">
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
