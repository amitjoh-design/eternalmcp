// Storage Manager MCP — Tool Handler
// upload_file | upload_from_url | save_as_file | list_files | delete_file

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'research-pdfs'
const MAX_FILES = 10
const MAX_STORAGE_BYTES = 10 * 1024 * 1024 * 1024 // 10 GB
const MAX_FILE_BYTES = 20 * 1024 * 1024             // 20 MB per file
const SIGNED_URL_TTL = 24 * 60 * 60                 // 24 hours in seconds

const MIME_MAP: Record<string, string> = {
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  json: 'application/json',
  csv: 'text/csv',
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Check quota and return current active files
async function checkQuota(
  db: SupabaseClient,
  userId: string,
  incomingBytes: number
): Promise<{ ok: true; files: StorageFile[] } | { ok: false; error: string }> {
  const now = new Date().toISOString()
  const { data: files, error } = await db
    .from('storage_files')
    .select('id, filename, file_size, expires_at, created_at, storage_path')
    .eq('user_id', userId)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: `DB error: ${error.message}` }

  const activeFiles = (files ?? []) as StorageFile[]

  if (activeFiles.length >= MAX_FILES) {
    return {
      ok: false,
      error: `Storage limit reached: you have ${activeFiles.length}/${MAX_FILES} active files. Delete some files first using delete_file.`,
    }
  }

  const totalUsed = activeFiles.reduce((sum, f) => sum + (f.file_size ?? 0), 0)
  if (totalUsed + incomingBytes > MAX_STORAGE_BYTES) {
    return {
      ok: false,
      error: `Storage limit: adding this file would exceed your 10 GB quota (currently using ${humanSize(totalUsed)}).`,
    }
  }

  return { ok: true, files: activeFiles }
}

// Upload buffer to Supabase, insert DB record, return signed URL
async function storeFile(
  serviceClient: SupabaseClient,
  userId: string,
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ signedUrl: string; fileId: string; expiresAt: string }> {
  const storagePath = `storage/${userId}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const { error: uploadErr } = await serviceClient.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false })

  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`)

  const expiresAt = new Date(Date.now() + SIGNED_URL_TTL * 1000).toISOString()

  const { data: signedData, error: signErr } = await serviceClient.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL)

  if (signErr || !signedData?.signedUrl) {
    // Clean up the uploaded file
    await serviceClient.storage.from(BUCKET).remove([storagePath])
    throw new Error('Failed to generate signed URL')
  }

  const { data: dbRow, error: dbErr } = await serviceClient
    .from('storage_files')
    .insert({
      user_id: userId,
      filename,
      storage_path: storagePath,
      mime_type: mimeType,
      file_size: buffer.length,
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (dbErr || !dbRow) {
    await serviceClient.storage.from(BUCKET).remove([storagePath])
    throw new Error(`DB insert failed: ${dbErr?.message ?? 'unknown'}`)
  }

  return { signedUrl: signedData.signedUrl, fileId: dbRow.id, expiresAt }
}

interface StorageFile {
  id: string
  filename: string
  file_size: number | null
  expires_at: string
  created_at: string
  storage_path: string
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handleStorageTool(
  install: { id: string; user_id: string; call_count: number },
  toolName: string,
  args: Record<string, unknown>,
  writeLog: (status: 'success' | 'error', error?: string) => void,
  db: SupabaseClient
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const userId = install.user_id
  const serviceClient = getServiceClient()

  // ── upload_file ────────────────────────────────────────────────────────────
  if (toolName === 'upload_file') {
    const contentBase64 = (args.content_base64 as string | undefined)?.trim()
    const filename = (args.filename as string | undefined)?.trim()
    const mimeType = (args.mime_type as string | undefined)?.trim() || 'application/octet-stream'

    if (!contentBase64 || !filename) {
      return { content: [{ type: 'text', text: 'content_base64 and filename are required.' }], isError: true }
    }

    let buffer: Buffer
    try {
      buffer = Buffer.from(contentBase64, 'base64')
    } catch {
      return { content: [{ type: 'text', text: 'Invalid base64 content.' }], isError: true }
    }

    if (buffer.length > MAX_FILE_BYTES) {
      return {
        content: [{ type: 'text', text: `File too large: ${humanSize(buffer.length)}. Maximum is ${humanSize(MAX_FILE_BYTES)}.` }],
        isError: true,
      }
    }

    const quota = await checkQuota(db, userId, buffer.length)
    if (!quota.ok) {
      return { content: [{ type: 'text', text: quota.error }], isError: true }
    }

    try {
      const { signedUrl, fileId, expiresAt } = await storeFile(serviceClient, userId, buffer, filename, mimeType)
      writeLog('success')
      return {
        content: [{
          type: 'text',
          text: [
            `File uploaded successfully!`,
            ``,
            `File: ${filename}`,
            `Size: ${humanSize(buffer.length)}`,
            `File ID: ${fileId}`,
            `Download link: ${signedUrl}`,
            `Link expires: ${new Date(expiresAt).toLocaleString('en-IN')} (24 hours)`,
            ``,
            `Files used: ${quota.files.length + 1}/${MAX_FILES}`,
          ].join('\n'),
        }],
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      writeLog('error', msg)
      return { content: [{ type: 'text', text: `Upload error: ${msg}` }], isError: true }
    }
  }

  // ── upload_from_url ────────────────────────────────────────────────────────
  if (toolName === 'upload_from_url') {
    const url = (args.url as string | undefined)?.trim()
    if (!url) {
      return { content: [{ type: 'text', text: 'url is required.' }], isError: true }
    }

    let filename = (args.filename as string | undefined)?.trim()
    if (!filename) {
      try {
        const urlObj = new URL(url)
        filename = urlObj.pathname.split('/').pop() || 'downloaded-file'
      } catch {
        filename = 'downloaded-file'
      }
    }

    let buffer: Buffer
    let mimeType = 'application/octet-stream'
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
      mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || mimeType
      const arrayBuffer = await response.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      writeLog('error', `Fetch error: ${msg}`)
      return { content: [{ type: 'text', text: `Failed to download from URL: ${msg}` }], isError: true }
    }

    if (buffer.length > MAX_FILE_BYTES) {
      return {
        content: [{ type: 'text', text: `File too large: ${humanSize(buffer.length)}. Maximum is ${humanSize(MAX_FILE_BYTES)}.` }],
        isError: true,
      }
    }

    const quota = await checkQuota(db, userId, buffer.length)
    if (!quota.ok) {
      return { content: [{ type: 'text', text: quota.error }], isError: true }
    }

    try {
      const { signedUrl, fileId, expiresAt } = await storeFile(serviceClient, userId, buffer, filename, mimeType)
      writeLog('success')
      return {
        content: [{
          type: 'text',
          text: [
            `File downloaded and stored successfully!`,
            ``,
            `File: ${filename}`,
            `Size: ${humanSize(buffer.length)}`,
            `Source: ${url}`,
            `File ID: ${fileId}`,
            `Download link: ${signedUrl}`,
            `Link expires: ${new Date(expiresAt).toLocaleString('en-IN')} (24 hours)`,
          ].join('\n'),
        }],
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      writeLog('error', msg)
      return { content: [{ type: 'text', text: `Storage error: ${msg}` }], isError: true }
    }
  }

  // ── save_as_file ───────────────────────────────────────────────────────────
  if (toolName === 'save_as_file') {
    const content = args.content as string | undefined
    const filenameBase = (args.filename as string | undefined)?.trim()
    const format = ((args.format as string | undefined) ?? 'txt').toLowerCase()

    if (!content || !filenameBase) {
      return { content: [{ type: 'text', text: 'content and filename are required.' }], isError: true }
    }

    const ext = ['txt', 'md', 'html', 'json', 'csv'].includes(format) ? format : 'txt'
    const filename = filenameBase.endsWith(`.${ext}`) ? filenameBase : `${filenameBase}.${ext}`
    const mimeType = MIME_MAP[ext] ?? 'text/plain'
    const buffer = Buffer.from(content, 'utf-8')

    if (buffer.length > MAX_FILE_BYTES) {
      return {
        content: [{ type: 'text', text: `Content too large: ${humanSize(buffer.length)}. Maximum is ${humanSize(MAX_FILE_BYTES)}.` }],
        isError: true,
      }
    }

    const quota = await checkQuota(db, userId, buffer.length)
    if (!quota.ok) {
      return { content: [{ type: 'text', text: quota.error }], isError: true }
    }

    try {
      const { signedUrl, fileId, expiresAt } = await storeFile(serviceClient, userId, buffer, filename, mimeType)
      writeLog('success')
      return {
        content: [{
          type: 'text',
          text: [
            `Content saved as file successfully!`,
            ``,
            `File: ${filename}`,
            `Size: ${humanSize(buffer.length)}`,
            `File ID: ${fileId}`,
            `Download link: ${signedUrl}`,
            `Link expires: ${new Date(expiresAt).toLocaleString('en-IN')} (24 hours)`,
          ].join('\n'),
        }],
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      writeLog('error', msg)
      return { content: [{ type: 'text', text: `Save error: ${msg}` }], isError: true }
    }
  }

  // ── list_files ─────────────────────────────────────────────────────────────
  if (toolName === 'list_files') {
    const now = new Date().toISOString()
    const { data: files, error } = await db
      .from('storage_files')
      .select('id, filename, file_size, expires_at, created_at, storage_path')
      .eq('user_id', userId)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })

    if (error) {
      writeLog('error', error.message)
      return { content: [{ type: 'text', text: `Failed to list files: ${error.message}` }], isError: true }
    }

    const activeFiles = (files ?? []) as StorageFile[]

    if (activeFiles.length === 0) {
      writeLog('success')
      return {
        content: [{ type: 'text', text: 'No files stored. Upload files using upload_file, upload_from_url, or save_as_file.' }],
      }
    }

    // Generate fresh signed URLs for each file
    const lines: string[] = [
      `Your stored files (${activeFiles.length}/${MAX_FILES}):`,
      '',
    ]

    for (const file of activeFiles) {
      const { data: signedData } = await serviceClient.storage
        .from(BUCKET)
        .createSignedUrl(file.storage_path, SIGNED_URL_TTL)

      const uploadedAt = new Date(file.created_at).toLocaleString('en-IN')
      const expiresAt = new Date(file.expires_at).toLocaleString('en-IN')

      lines.push(`📄 ${file.filename}`)
      lines.push(`   ID: ${file.id}`)
      lines.push(`   Size: ${humanSize(file.file_size ?? 0)}`)
      lines.push(`   Uploaded: ${uploadedAt}`)
      lines.push(`   Expires: ${expiresAt}`)
      lines.push(`   Link: ${signedData?.signedUrl ?? '(could not generate)'}`)
      lines.push('')
    }

    const totalUsed = activeFiles.reduce((sum, f) => sum + (f.file_size ?? 0), 0)
    lines.push(`Total storage used: ${humanSize(totalUsed)} of 10 GB`)

    writeLog('success')
    return { content: [{ type: 'text', text: lines.join('\n') }] }
  }

  // ── delete_file ────────────────────────────────────────────────────────────
  if (toolName === 'delete_file') {
    const fileId = (args.file_id as string | undefined)?.trim()
    if (!fileId) {
      return { content: [{ type: 'text', text: 'file_id is required.' }], isError: true }
    }

    // Fetch the file record (must belong to this user)
    const { data: fileRow, error: fetchErr } = await db
      .from('storage_files')
      .select('id, filename, storage_path')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single()

    if (fetchErr || !fileRow) {
      return { content: [{ type: 'text', text: 'File not found or you do not have permission to delete it.' }], isError: true }
    }

    // Delete from Supabase Storage
    await serviceClient.storage.from(BUCKET).remove([fileRow.storage_path])

    // Delete DB record
    const { error: deleteErr } = await db
      .from('storage_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId)

    if (deleteErr) {
      writeLog('error', deleteErr.message)
      return { content: [{ type: 'text', text: `Failed to delete file record: ${deleteErr.message}` }], isError: true }
    }

    writeLog('success')
    return {
      content: [{ type: 'text', text: `File "${fileRow.filename}" deleted successfully.` }],
    }
  }

  return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true }
}
