'use client'

import { useState, useRef } from 'react'
import { Upload, Copy, Check, X, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export function FileUpload() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large — max 10 MB')
      return
    }

    setUploading(true)
    setResult(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setResult({ url: data.url, filename: data.filename })
      toast.success('File uploaded — URL ready to share with Claude')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Upload size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-text-primary">Upload File for Email Attachment</h3>
      </div>
      <p className="text-xs text-muted mb-4">
        Upload a local file to get a public URL — then tell Claude to attach it when sending email.
        Max 10 MB · PDF only
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border-subtle hover:border-primary/40 rounded-xl p-6 text-center cursor-pointer transition-colors group"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={22} className="text-muted group-hover:text-primary transition-colors" />
            <p className="text-xs text-text-secondary">
              <span className="text-primary font-medium">Click to browse</span> or drag &amp; drop
            </p>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-medium text-emerald-700 truncate">{result.filename}</span>
            <button
              onClick={() => setResult(null)}
              className="ml-auto text-emerald-400 hover:text-emerald-600"
            >
              <X size={13} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-emerald-800 bg-emerald-100 rounded px-2 py-1 truncate">
              {result.url}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-emerald-600 mt-2">
            Tell Claude: <em>&quot;Send an email and attach this URL: [paste URL]&quot;</em>
          </p>
        </div>
      )}
    </div>
  )
}
