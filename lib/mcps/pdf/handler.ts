// PDF Creator MCP — Tool Handler
// Converts markdown, plain text, or basic HTML to PDF using pdf-lib
// Stores in Supabase Storage and returns a 24-hour signed URL

import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── HTML → Markdown conversion ────────────────────────────────────────────────
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `# ${t.trim()}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `## ${t.trim()}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `### ${t.trim()}\n\n`)
    .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, (_, t) => `#### ${t.trim()}\n\n`)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_, t) => `**${t.trim()}**`)
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_, t) => `**${t.trim()}**`)
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_, t) => `*${t.trim()}*`)
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_, t) => `*${t.trim()}*`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `- ${t.trim()}\n`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, t) => `${t.trim()}\n\n`)
    .replace(/<\/?(ul|ol|table|thead|tbody|tr)[^>]*>/gi, '\n')
    .replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, (_, t) => `${t.trim()} | `)
    .replace(/<th[^>]*>([\s\S]*?)<\/th>/gi, (_, t) => `**${t.trim()}** | `)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .trim()
}

// ── Sanitize for pdf-lib (Helvetica = Latin-1 only) ──────────────────────────
function sanitize(text: string): string {
  return text
    .replace(/₹|\u20B9/g, 'Rs.')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/–/g, '-')
    .replace(/—/g, '--')
    .replace(/…/g, '...')
    .replace(/×/g, 'x')
    .replace(/[^\x00-\xFF]/g, '?')
}

// ── Strip inline markdown for plain text rendering ────────────────────────────
function stripInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

// ── PDF generation ────────────────────────────────────────────────────────────
async function buildPdf(markdownText: string, title: string): Promise<Buffer> {
  const text = sanitize(markdownText)
  const safeTitle = sanitize(title)

  const pdfDoc = await PDFDocument.create()
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const PAGE_W = 595.28
  const PAGE_H = 841.89
  const MARGIN = 60
  const CONTENT_W = PAGE_W - MARGIN * 2

  const C_PRIMARY = rgb(0.388, 0.400, 0.945)
  const C_TEXT = rgb(0.122, 0.161, 0.216)
  const C_MUTED = rgb(0.420, 0.447, 0.502)
  const C_LIGHT = rgb(0.216, 0.255, 0.318)
  const C_WHITE = rgb(1, 1, 1)

  function wrapText(t: string, font: PDFFont, size: number, maxW: number): string[] {
    if (!t.trim()) return ['']
    const words = t.split(' ')
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w
      if (font.widthOfTextAtSize(test, size) > maxW && cur) {
        lines.push(cur)
        cur = w
      } else {
        cur = test
      }
    }
    if (cur) lines.push(cur)
    return lines.length > 0 ? lines : ['']
  }

  const pages: PDFPage[] = []
  let curPage: PDFPage = null as unknown as PDFPage
  let curY = 0

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  function newPage() {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H])
    pages.push(page)
    curPage = page
    page.drawRectangle({ x: 0, y: PAGE_H - 32, width: PAGE_W, height: 32, color: C_PRIMARY })
    page.drawText(`EternalMCP  |  ${safeTitle}`, {
      x: MARGIN, y: PAGE_H - 21, font: bold, size: 9, color: C_WHITE,
    })
    curY = PAGE_H - 55
  }

  function ensureY(needed: number) {
    if (curY < MARGIN + 35 + needed) newPage()
  }

  // Cover page
  const cover = pdfDoc.addPage([PAGE_W, PAGE_H])
  pages.push(cover)
  cover.drawRectangle({ x: 0, y: PAGE_H - 90, width: PAGE_W, height: 90, color: C_PRIMARY })
  cover.drawText('EternalMCP', { x: MARGIN, y: PAGE_H - 34, font: bold, size: 18, color: C_WHITE })
  cover.drawText('Document Export', {
    x: MARGIN, y: PAGE_H - 56, font: regular, size: 10, color: rgb(0.78, 0.824, 0.988),
  })

  const titleLines = wrapText(safeTitle, bold, 22, CONTENT_W)
  let ty = PAGE_H - 128
  for (const line of titleLines) {
    cover.drawText(line, { x: MARGIN, y: ty, font: bold, size: 22, color: C_TEXT })
    ty -= 28
  }
  cover.drawText(dateStr, { x: MARGIN, y: ty - 8, font: regular, size: 12, color: C_MUTED })
  cover.drawRectangle({ x: MARGIN, y: ty - 24, width: CONTENT_W, height: 2, color: C_PRIMARY })

  // Content pages
  newPage()
  let tableRowIdx = 0

  for (const line of text.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed) {
      curY -= 5
      continue
    }

    if (/^# /.test(trimmed)) {
      ensureY(36)
      curY -= 4
      curPage.drawRectangle({ x: MARGIN, y: curY - 20, width: CONTENT_W, height: 28, color: rgb(0.97, 0.97, 1.0) })
      curPage.drawRectangle({ x: MARGIN, y: curY - 20, width: 4, height: 28, color: C_PRIMARY })
      const h = trimmed.replace(/^# /, '')
      curPage.drawText(h.length > 80 ? h.slice(0, 78) + '..' : h, {
        x: MARGIN + 12, y: curY - 12, font: bold, size: 12, color: C_PRIMARY,
      })
      curY -= 34
      tableRowIdx = 0

    } else if (/^## /.test(trimmed)) {
      ensureY(24)
      curY -= 4
      const h = trimmed.replace(/^## /, '')
      curPage.drawText(h.length > 90 ? h.slice(0, 88) + '..' : h, {
        x: MARGIN, y: curY, font: bold, size: 11, color: C_TEXT,
      })
      curY -= 16
      tableRowIdx = 0

    } else if (/^#{3,} /.test(trimmed)) {
      ensureY(18)
      const h = trimmed.replace(/^#+\s/, '')
      curPage.drawText(h.length > 90 ? h.slice(0, 88) + '..' : h, {
        x: MARGIN, y: curY, font: bold, size: 10, color: C_LIGHT,
      })
      curY -= 14

    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = sanitize(stripInline(trimmed.replace(/^[*-] /, '')))
      const wrapped = wrapText('*  ' + content, regular, 9.5, CONTENT_W - 14)
      for (const wl of wrapped) {
        ensureY(14)
        curPage.drawText(wl, { x: MARGIN + 10, y: curY, font: regular, size: 9.5, color: C_TEXT })
        curY -= 13
      }

    } else if (trimmed.startsWith('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.every(c => /^[-:]+$/.test(c))) { tableRowIdx = 0; continue }
      ensureY(20)
      const isHeader = tableRowIdx === 0
      const ROW_H = 18
      const cellW = Math.floor(CONTENT_W / Math.max(cells.length, 1))
      const bg = isHeader
        ? rgb(0.937, 0.941, 0.988)
        : tableRowIdx % 2 === 0 ? rgb(0.973, 0.98, 0.988) : C_WHITE
      curPage.drawRectangle({ x: MARGIN, y: curY - ROW_H, width: CONTENT_W, height: ROW_H, color: bg })
      cells.forEach((cell, idx) => {
        const cx = MARGIN + idx * cellW + 4
        let display = sanitize(stripInline(cell))
        while (display.length > 1 && bold.widthOfTextAtSize(display, 8.5) > cellW - 8)
          display = display.slice(0, -2) + '..'
        curPage.drawText(display, {
          x: cx, y: curY - 13,
          font: isHeader ? bold : regular,
          size: 8.5,
          color: isHeader ? C_PRIMARY : C_TEXT,
        })
      })
      curPage.drawLine({
        start: { x: MARGIN, y: curY - ROW_H },
        end: { x: MARGIN + CONTENT_W, y: curY - ROW_H },
        thickness: 0.3, color: rgb(0.9, 0.9, 0.9),
      })
      curY -= ROW_H + 1
      tableRowIdx++

    } else if (trimmed.startsWith('---')) {
      ensureY(10)
      curPage.drawLine({
        start: { x: MARGIN, y: curY },
        end: { x: PAGE_W - MARGIN, y: curY },
        thickness: 0.5, color: rgb(0.9, 0.9, 0.9),
      })
      curY -= 8

    } else {
      const cleaned = sanitize(stripInline(trimmed))
      const wrapped = wrapText(cleaned, regular, 9.5, CONTENT_W)
      for (const wl of wrapped) {
        ensureY(14)
        curPage.drawText(wl, { x: MARGIN, y: curY, font: regular, size: 9.5, color: C_LIGHT })
        curY -= 13
      }
      curY -= 3
    }
  }

  // Footers on all pages
  for (let i = 0; i < pages.length; i++) {
    const pg = pages[i]
    pg.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 30, color: rgb(0.973, 0.98, 0.988) })
    pg.drawLine({
      start: { x: 0, y: 30 }, end: { x: PAGE_W, y: 30 },
      thickness: 0.5, color: rgb(0.886, 0.91, 0.933),
    })
    pg.drawText(
      `EternalMCP  |  ${safeTitle}  |  Page ${i + 1} of ${pages.length}  |  ${dateStr}  |  eternalmcp.com`,
      { x: MARGIN, y: 11, font: regular, size: 7.5, color: C_MUTED },
    )
  }

  return Buffer.from(await pdfDoc.save())
}

// ── Main handler export ───────────────────────────────────────────────────────
export async function handlePdfCreatorTool(
  install: { id: string; user_id: string; call_count: number },
  toolName: string,
  args: Record<string, unknown>,
  writeLog: (status: 'success' | 'error', error?: string) => void,
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  if (toolName !== 'create_pdf') {
    return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true }
  }

  const rawContent = (args.content as string | undefined)?.trim()
  const rawFilename = (args.filename as string | undefined)?.trim()
  const rawTitle = (args.title as string | undefined)?.trim()

  if (!rawContent || !rawFilename) {
    return {
      content: [{ type: 'text', text: 'content and filename are required.' }],
      isError: true,
    }
  }

  // ── Reject binary / unsupported formats ───────────────────────────────────
  if (rawContent.includes('\x00')) {
    writeLog('error', 'Binary content rejected')
    return {
      content: [{
        type: 'text',
        text: [
          '❌ Unsupported file format.',
          '',
          'PDF Creator only supports:',
          '  • Markdown text',
          '  • Plain text',
          '  • Basic HTML',
          '',
          'For Word (.docx), Excel (.xlsx), or PowerPoint (.pptx) files:',
          'Ask Claude to read and extract the file\'s text content first, then pass that text to create_pdf.',
        ].join('\n'),
      }],
      isError: true,
    }
  }

  if (rawContent.length > 200_000) {
    writeLog('error', 'Content too large')
    return {
      content: [{ type: 'text', text: '❌ Content is too large. Maximum size is 200,000 characters.' }],
      isError: true,
    }
  }

  // ── Detect and convert HTML ───────────────────────────────────────────────
  const isHtml = /<[a-z][\s\S]*>/i.test(rawContent)
  const markdownContent = isHtml ? htmlToMarkdown(rawContent) : rawContent

  // ── Build PDF ─────────────────────────────────────────────────────────────
  const title = rawTitle || rawFilename
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await buildPdf(markdownContent, title)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    writeLog('error', `PDF generation error: ${msg}`)
    return {
      content: [{ type: 'text', text: `❌ Failed to generate PDF: ${msg}` }],
      isError: true,
    }
  }

  // ── Upload to Supabase Storage ────────────────────────────────────────────
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const safeFilename = rawFilename.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  const storageFilename = `${safeFilename}-${Date.now()}.pdf`
  const storagePath = `pdfs/${install.user_id}/${storageFilename}`

  const { error: uploadErr } = await serviceClient.storage
    .from('research-pdfs')
    .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadErr) {
    writeLog('error', `Storage upload error: ${uploadErr.message}`)
    return {
      content: [{ type: 'text', text: `❌ Failed to store PDF: ${uploadErr.message}` }],
      isError: true,
    }
  }

  // ── Create signed URL (24 hours) ──────────────────────────────────────────
  const TTL = 24 * 60 * 60
  const { data: signedData, error: signErr } = await serviceClient.storage
    .from('research-pdfs')
    .createSignedUrl(storagePath, TTL)

  if (signErr || !signedData?.signedUrl) {
    writeLog('error', 'Failed to create signed URL')
    return {
      content: [{ type: 'text', text: '❌ Failed to generate download link.' }],
      isError: true,
    }
  }

  // ── Track in storage_files table ──────────────────────────────────────────
  const expiresAt = new Date(Date.now() + TTL * 1000).toISOString()
  await serviceClient.from('storage_files').insert({
    user_id: install.user_id,
    filename: `${safeFilename}.pdf`,
    storage_path: storagePath,
    mime_type: 'application/pdf',
    file_size: pdfBuffer.length,
    expires_at: expiresAt,
  })

  writeLog('success')

  const expiryDate = new Date(Date.now() + TTL * 1000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return {
    content: [{
      type: 'text',
      text: [
        `✅ PDF created: **${safeFilename}.pdf**`,
        ``,
        `📥 Download: ${signedData.signedUrl}`,
        `⏰ Link expires: ${expiryDate} (24 hours)`,
        `📦 Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`,
        isHtml ? `🔄 Converted from HTML` : ``,
      ].filter(Boolean).join('\n'),
    }],
  }
}
