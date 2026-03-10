'use client'

import { useState } from 'react'
import { Copy, Check, Terminal } from 'lucide-react'
import toast from 'react-hot-toast'

interface ConfigSnippetProps {
  token: string
  appUrl?: string
}

type ClientTab = 'claude' | 'cursor' | 'windsurf' | 'continue'

const TABS: { id: ClientTab; label: string; configFile: string }[] = [
  { id: 'claude',   label: 'Claude Desktop', configFile: 'claude_desktop_config.json' },
  { id: 'cursor',   label: 'Cursor',         configFile: '.cursor/mcp.json' },
  { id: 'windsurf', label: 'Windsurf',       configFile: 'mcp_config.json' },
  { id: 'continue', label: 'Continue.dev',   configFile: '~/.continue/config.json' },
]

function buildConfig(client: ClientTab, token: string, appUrl: string): string {
  const url = `${appUrl}/api/mcp/${token}`
  switch (client) {
    case 'claude':
      return JSON.stringify({ mcpServers: { gmail: { type: 'http', url } } }, null, 2)
    case 'cursor':
      return JSON.stringify({ mcpServers: { gmail: { url } } }, null, 2)
    case 'windsurf':
      return JSON.stringify({ mcpServers: { gmail: { serverUrl: url } } }, null, 2)
    case 'continue':
      return JSON.stringify(
        { mcpServers: [{ name: 'gmail', transport: { type: 'streamable-http', url } }] },
        null,
        2
      )
  }
}

function getConfigPath(client: ClientTab): { mac: string; windows: string } {
  switch (client) {
    case 'claude':
      return { mac: '~/Library/Application Support/Claude/', windows: '%APPDATA%\\Claude\\' }
    case 'cursor':
      return { mac: '~/.cursor/', windows: '%USERPROFILE%\\.cursor\\' }
    case 'windsurf':
      return { mac: '~/.codeium/windsurf/', windows: '%USERPROFILE%\\.codeium\\windsurf\\' }
    case 'continue':
      return { mac: '~/.continue/', windows: '%USERPROFILE%\\.continue\\' }
  }
}

export function ConfigSnippet({ token, appUrl = 'https://www.eternalmcp.com' }: ConfigSnippetProps) {
  const [activeTab, setActiveTab] = useState<ClientTab>('claude')
  const [copied, setCopied] = useState(false)

  const tab = TABS.find((t) => t.id === activeTab)!
  const snippet = buildConfig(activeTab, token, appUrl)
  const paths = getConfigPath(activeTab)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    toast.success('Config copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Terminal size={14} className="text-primary" />
        <span className="text-sm font-medium text-text-primary">Add to your AI client</span>
      </div>

      {/* Client tabs */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-lg">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setCopied(false) }}
            className={`flex-1 text-xs px-2 py-1.5 rounded-md font-medium transition-all ${
              activeTab === t.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-secondary">
        Paste into your <code className="text-primary">{tab.configFile}</code> file:
      </p>

      <div className="relative bg-[#0d1117] border border-border-subtle rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
          <span className="text-xs text-muted">{tab.configFile}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="p-4 text-xs text-gray-300 font-mono overflow-x-auto leading-relaxed">
          {snippet}
        </pre>
      </div>

      <p className="text-xs text-muted">
        Config file:&nbsp;
        <span className="text-text-secondary">macOS: {paths.mac}</span>
        &nbsp;·&nbsp;
        <span className="text-text-secondary">Windows: {paths.windows}</span>
      </p>

      <p className="text-xs text-yellow-400/80">
        ⚡ Restart {tab.label} after saving the config file.
      </p>
    </div>
  )
}
