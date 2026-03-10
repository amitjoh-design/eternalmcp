'use client'

import { useState } from 'react'
import { Copy, Check, Terminal } from 'lucide-react'
import toast from 'react-hot-toast'

interface ConfigSnippetProps {
  token: string
  appUrl?: string
}

export function ConfigSnippet({ token, appUrl = 'https://www.eternalmcp.com' }: ConfigSnippetProps) {
  const [copied, setCopied] = useState(false)

  const config = {
    mcpServers: {
      gmail: {
        type: 'http',
        url: `${appUrl}/api/mcp/${token}`,
      },
    },
  }

  const snippet = JSON.stringify(config, null, 2)

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
        <span className="text-sm font-medium text-text-primary">Add to Claude Desktop config</span>
      </div>

      <p className="text-xs text-text-secondary">
        Add this to your <code className="text-primary">claude_desktop_config.json</code> file:
      </p>

      <div className="relative bg-[#0d1117] border border-border-subtle rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
          <span className="text-xs text-muted">claude_desktop_config.json</span>
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
        Config file location:&nbsp;
        <span className="text-text-secondary">macOS: ~/Library/Application Support/Claude/</span>
        &nbsp;·&nbsp;
        <span className="text-text-secondary">Windows: %APPDATA%\Claude\</span>
      </p>
    </div>
  )
}
