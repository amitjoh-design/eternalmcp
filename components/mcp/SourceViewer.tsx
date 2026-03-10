'use client'

import { useState } from 'react'
import { Copy, Check, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

interface SourceViewerProps {
  files: Record<string, string>
}

// Minimal keyword highlighting via regex replacements
function highlight(code: string): string {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(\/\/.*$)/gm, '<span class="text-green-400/70">$1</span>')
    .replace(/(`[^`]*`)/g, '<span class="text-yellow-300">$1</span>')
    .replace(/\b(const|let|var|function|async|await|return|export|import|from|if|else|try|catch|throw|new|typeof|instanceof)\b/g, '<span class="text-purple-400">$1</span>')
    .replace(/\b(string|number|boolean|null|undefined|void|true|false)\b/g, '<span class="text-blue-400">$1</span>')
    .replace(/('[^']*'|"[^"]*")/g, '<span class="text-orange-300">$1</span>')
}

export function SourceViewer({ files }: SourceViewerProps) {
  const fileNames = Object.keys(files)
  const [activeFile, setActiveFile] = useState(fileNames[0])
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(files[activeFile])
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-surface-2">
        <div className="flex items-center gap-2">
          <Lock size={12} className="text-primary" />
          <span className="text-xs text-muted font-medium">Read-only · Verified by EternalMCP</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* File tabs */}
      <div className="flex border-b border-border-subtle bg-surface px-2 pt-2 gap-1">
        {fileNames.map((name) => (
          <button
            key={name}
            onClick={() => setActiveFile(name)}
            className={`px-3 py-1.5 text-xs rounded-t-lg transition-colors ${
              activeFile === name
                ? 'bg-[#0d1117] text-text-primary border border-b-0 border-border-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Code */}
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <pre className="p-4 text-xs leading-relaxed font-mono text-gray-300">
          <code
            dangerouslySetInnerHTML={{ __html: highlight(files[activeFile]) }}
          />
        </pre>
      </div>

      {/* Footer notice */}
      <div className="px-4 py-2 border-t border-border-subtle bg-surface-2">
        <p className="text-xs text-muted">
          ⚠️ This code runs on EternalMCP servers. You can read it but cannot modify it.
          Your Gmail credentials are encrypted and never shared.
        </p>
      </div>
    </div>
  )
}
