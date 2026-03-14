'use client'

import { useState } from 'react'
import { Copy, Check, Terminal, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

interface InstalledEntry {
  token: string
  slug: string
}

interface ConfigSnippetProps {
  token: string
  appUrl?: string
  slug?: string
  // When provided, generates a combined config for ALL connected MCPs
  allInstalled?: InstalledEntry[]
}

type ClientTab = 'claude' | 'cursor' | 'windsurf' | 'continue'

const TABS: { id: ClientTab; label: string; configFile: string }[] = [
  { id: 'claude',   label: 'Claude Desktop', configFile: 'claude_desktop_config.json' },
  { id: 'cursor',   label: 'Cursor',         configFile: '.cursor/mcp.json' },
  { id: 'windsurf', label: 'Windsurf',       configFile: 'mcp_config.json' },
  { id: 'continue', label: 'Continue.dev',   configFile: '~/.continue/config.json' },
]

function buildConfig(client: ClientTab, entries: InstalledEntry[], appUrl: string): string {
  switch (client) {
    case 'claude': {
      const servers: Record<string, unknown> = {}
      for (const e of entries) {
        servers[e.slug] = {
          command: 'npx',
          args: ['-y', 'mcp-remote', `${appUrl}/api/mcp/${e.token}`],
          timeout: 300000,
        }
      }
      return JSON.stringify({ mcpServers: servers }, null, 2)
    }
    case 'cursor': {
      const servers: Record<string, unknown> = {}
      for (const e of entries) {
        servers[e.slug] = { url: `${appUrl}/api/mcp/${e.token}` }
      }
      return JSON.stringify({ mcpServers: servers }, null, 2)
    }
    case 'windsurf': {
      const servers: Record<string, unknown> = {}
      for (const e of entries) {
        servers[e.slug] = { serverUrl: `${appUrl}/api/mcp/${e.token}` }
      }
      return JSON.stringify({ mcpServers: servers }, null, 2)
    }
    case 'continue': {
      const mcpServers = entries.map((e) => ({
        name: e.slug,
        transport: { type: 'streamable-http', url: `${appUrl}/api/mcp/${e.token}` },
      }))
      return JSON.stringify({ mcpServers }, null, 2)
    }
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

export function ConfigSnippet({
  token,
  appUrl = 'https://www.eternalmcp.com',
  slug = 'gmail',
  allInstalled,
}: ConfigSnippetProps) {
  const [activeTab, setActiveTab] = useState<ClientTab>('claude')
  const [copied, setCopied] = useState(false)

  // Use allInstalled if provided (combined view), else fall back to single MCP
  const entries: InstalledEntry[] =
    allInstalled && allInstalled.length > 0
      ? allInstalled
      : [{ token, slug }]

  const isMulti = entries.length > 1

  const tab = TABS.find((t) => t.id === activeTab)!
  const snippet = buildConfig(activeTab, entries, appUrl)
  const paths = getConfigPath(activeTab)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    toast.success('Config copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-primary" />
          <span className="text-sm font-medium text-text-primary">Add to your AI client</span>
        </div>
        {isMulti && (
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
            <Layers size={10} className="text-primary" />
            <span className="text-[10px] text-primary font-semibold">All {entries.length} MCPs included</span>
          </div>
        )}
      </div>

      {isMulti && (
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-surface-2 border border-border-subtle rounded-lg">
          {entries.map((e) => (
            <span key={e.slug} className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono font-semibold">
              {e.slug}
            </span>
          ))}
        </div>
      )}

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
        {isMulti
          ? <>Replace the entire <code className="text-primary">mcpServers</code> block in your <code className="text-primary">{tab.configFile}</code> with this:</>
          : <>Paste into your <code className="text-primary">{tab.configFile}</code> file:</>
        }
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

      {activeTab === 'claude' ? (
        <div className="text-xs text-muted space-y-1">
          <p>🍎 Mac: <span className="text-text-secondary font-mono">~/Library/Application Support/Claude/</span></p>
          <p>🪟 Windows (standard): <span className="text-text-secondary font-mono">%APPDATA%\Claude\</span></p>
          <p>🪟 Windows (Store): <span className="text-text-secondary font-mono">%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\</span></p>
          <p className="text-[10px]">💡 Find it in Claude Desktop: ☰ → Settings → Developer → Edit Config</p>
          <p className="text-[10px] text-yellow-400/80">⏱ <code>timeout: 300000</code> gives tools like Company Research enough time to generate reports without timing out.</p>
        </div>
      ) : (
        <p className="text-xs text-muted">
          Config file:&nbsp;
          <span className="text-text-secondary">macOS: {paths.mac}</span>
          &nbsp;·&nbsp;
          <span className="text-text-secondary">Windows: {paths.windows}</span>
        </p>
      )}

      <p className="text-xs text-yellow-400/80">
        ⚡ Restart {tab.label} after saving the config file.
      </p>
    </div>
  )
}
