// Company Research MCP — Tool Handler
// Calls Claude API -> generates PDF -> uploads to Supabase Storage -> returns signed URL

import Anthropic from '@anthropic-ai/sdk'
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── Institutional Research Prompt ────────────────────────────────────────────
const RESEARCH_PROMPT = `Write a short equity research snapshot for COMPANY_NAME (EXCHANGE). Use training knowledge. N/A for unknowns. Be extremely brief.

# 1. Summary
2 sentences: what the company does and BUY/HOLD/SELL with one reason.

# 2. Business
- 3 bullet points on core business and revenue segments

# 3. Financials

| Metric | FY2023 | FY2024 |
|--------|--------|--------|
| Revenue (Cr) | | |
| Net Profit (Cr) | | |
| ROE % | | |

# 4. Valuation
P/E: [value] vs sector [value]. Verdict: Undervalued/Fairly Valued/Overvalued.

# 5. Risks
3 risks — one line each.

# 6. Recommendation
Rating: BUY/HOLD/SELL | Target: N/A | Horizon: Short/Medium/Long
One sentence summary.

DISCLAIMER: AI-generated. Not investment advice.`

// ── Strip inline markdown ──────────────────────────────────────────────────────
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

// ── Sanitize text for pdf-lib (Helvetica = Latin-1 only) ──────────────────────
function sanitizeForPdf(text: string): string {
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

// ── PDF Generation using pdf-lib (no file system access required) ─────────────
async function generateResearchPDF(
  reportText: string,
  companyName: string,
  exchange: string
): Promise<Buffer> {
  // Sanitize all input text — Helvetica only supports Latin-1 (WinAnsiEncoding)
  reportText  = sanitizeForPdf(reportText)
  companyName = sanitizeForPdf(companyName)
  exchange    = sanitizeForPdf(exchange)

  const pdfDoc = await PDFDocument.create()

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const PAGE_W    = 595.28
  const PAGE_H    = 841.89
  const MARGIN    = 60
  const CONTENT_W = PAGE_W - MARGIN * 2

  const C_PRIMARY = rgb(0.388, 0.400, 0.945)
  const C_TEXT    = rgb(0.122, 0.161, 0.216)
  const C_MUTED   = rgb(0.420, 0.447, 0.502)
  const C_LIGHT   = rgb(0.216, 0.255, 0.318)
  const C_WHITE   = rgb(1, 1, 1)

  function wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
    if (!text.trim()) return ['']
    const words = text.split(' ')
    const lines: string[] = []
    let cur = ''
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word
      if (font.widthOfTextAtSize(test, size) > maxW && cur) {
        lines.push(cur)
        cur = word
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

  function newPage() {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H])
    pages.push(page)
    curPage = page
    page.drawRectangle({ x: 0, y: PAGE_H - 32, width: PAGE_W, height: 32, color: C_PRIMARY })
    page.drawText(`EternalMCP Research  |  ${companyName}`, {
      x: MARGIN, y: PAGE_H - 21, font: bold, size: 9, color: C_WHITE,
    })
    curY = PAGE_H - 55
  }

  function ensureY(needed: number) {
    if (curY < MARGIN + 35 + needed) newPage()
  }

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  // Title Page
  const titlePage = pdfDoc.addPage([PAGE_W, PAGE_H])
  pages.push(titlePage)

  titlePage.drawRectangle({ x: 0, y: PAGE_H - 90, width: PAGE_W, height: 90, color: C_PRIMARY })
  titlePage.drawText('EternalMCP', { x: MARGIN, y: PAGE_H - 34, font: bold, size: 18, color: C_WHITE })
  titlePage.drawText('Institutional Grade Equity Research Platform', {
    x: MARGIN, y: PAGE_H - 56, font: regular, size: 10, color: rgb(0.78, 0.824, 0.988),
  })

  const cNameLines = wrapText(companyName.toUpperCase(), bold, 22, CONTENT_W)
  let titleY = PAGE_H - 128
  for (const cl of cNameLines) {
    titlePage.drawText(cl, { x: MARGIN, y: titleY, font: bold, size: 22, color: C_TEXT })
    titleY -= 28
  }

  titlePage.drawText(`${exchange}  |  ${dateStr}`, {
    x: MARGIN, y: titleY - 4, font: regular, size: 12, color: C_MUTED,
  })
  titlePage.drawText('CONFIDENTIAL - For Professional Investors Only', {
    x: MARGIN, y: titleY - 22, font: regular, size: 9, color: C_MUTED,
  })

  titlePage.drawRectangle({ x: MARGIN, y: titleY - 38, width: CONTENT_W, height: 2, color: C_PRIMARY })

  const boxes = [
    { label: 'Exchange', value: exchange },
    { label: 'Report Type', value: 'Equity Research' },
    { label: 'Coverage', value: 'Institutional' },
  ]
  const boxW = (CONTENT_W - 20) / boxes.length
  const boxY = titleY - 105
  boxes.forEach((box, idx) => {
    const bx = MARGIN + idx * (boxW + 10)
    titlePage.drawRectangle({ x: bx, y: boxY, width: boxW, height: 50, color: rgb(0.973, 0.98, 0.988) })
    titlePage.drawText(box.label, { x: bx + 10, y: boxY + 31, font: regular, size: 8, color: C_MUTED })
    titlePage.drawText(box.value, { x: bx + 10, y: boxY + 13, font: bold, size: 11, color: C_TEXT })
  })

  const discY = boxY - 85
  titlePage.drawRectangle({ x: MARGIN, y: discY, width: CONTENT_W, height: 68, color: rgb(0.996, 0.953, 0.78) })
  titlePage.drawRectangle({ x: MARGIN, y: discY, width: 3, height: 68, color: rgb(0.961, 0.62, 0.043) })
  const discText = 'DISCLAIMER: This report is generated by AI and is for informational purposes only. It does not constitute investment advice. Past performance is not indicative of future results. Always consult a qualified financial advisor before making investment decisions.'
  const discLines = wrapText(discText, regular, 8, CONTENT_W - 20)
  let discDrawY = discY + 52
  for (const dl of discLines) {
    titlePage.drawText(dl, { x: MARGIN + 12, y: discDrawY, font: regular, size: 8, color: rgb(0.573, 0.251, 0.055) })
    discDrawY -= 11
  }

  // Report Pages
  newPage()
  let tableRowIdx = 0

  for (const line of reportText.split('\n')) {
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
      const h1Text = trimmed.replace(/^# /, '')
      curPage.drawText(h1Text.length > 80 ? h1Text.slice(0, 78) + '..' : h1Text, {
        x: MARGIN + 12, y: curY - 12, font: bold, size: 12, color: C_PRIMARY,
      })
      curY -= 34
      tableRowIdx = 0

    } else if (/^## /.test(trimmed)) {
      ensureY(24)
      curY -= 4
      const h2Text = trimmed.replace(/^## /, '')
      curPage.drawText(h2Text.length > 90 ? h2Text.slice(0, 88) + '..' : h2Text, {
        x: MARGIN, y: curY, font: bold, size: 11, color: C_TEXT,
      })
      curY -= 16
      tableRowIdx = 0

    } else if (/^#{3,} /.test(trimmed)) {
      ensureY(18)
      const h3Text = trimmed.replace(/^#+\s/, '')
      curPage.drawText(h3Text.length > 90 ? h3Text.slice(0, 88) + '..' : h3Text, {
        x: MARGIN, y: curY, font: bold, size: 10, color: C_LIGHT,
      })
      curY -= 14

    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = sanitizeForPdf(stripInlineMarkdown(trimmed.replace(/^[*-] /, '')))
      const wrapped = wrapText('*  ' + content, regular, 9.5, CONTENT_W - 14)
      for (const wl of wrapped) {
        ensureY(14)
        curPage.drawText(wl, { x: MARGIN + 10, y: curY, font: regular, size: 9.5, color: C_TEXT })
        curY -= 13
      }

    } else if (trimmed.startsWith('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.every(c => /^[-:]+$/.test(c))) {
        tableRowIdx = 0
        continue
      }
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
        let display = sanitizeForPdf(stripInlineMarkdown(cell))
        while (display.length > 1 && bold.widthOfTextAtSize(display, 8.5) > cellW - 8) {
          display = display.slice(0, -2) + '..'
        }
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
      const cleaned = sanitizeForPdf(stripInlineMarkdown(trimmed))
      const wrapped = wrapText(cleaned, regular, 9.5, CONTENT_W)
      for (const wl of wrapped) {
        ensureY(14)
        curPage.drawText(wl, { x: MARGIN, y: curY, font: regular, size: 9.5, color: C_LIGHT })
        curY -= 13
      }
      curY -= 3
    }
  }

  // Footers
  for (let i = 0; i < pages.length; i++) {
    const pg = pages[i]
    pg.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 30, color: rgb(0.973, 0.98, 0.988) })
    pg.drawLine({
      start: { x: 0, y: 30 }, end: { x: PAGE_W, y: 30 },
      thickness: 0.5, color: rgb(0.886, 0.91, 0.933),
    })
    pg.drawText(
      `EternalMCP Research  |  ${companyName} (${exchange})  |  Page ${i + 1} of ${pages.length}  |  ${dateStr}  |  eternalmcp.com`,
      { x: MARGIN, y: 11, font: regular, size: 7.5, color: C_MUTED },
    )
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// ── Main handler export ───────────────────────────────────────────────────────

export async function handleResearchTool(
  install: { id: string; user_id: string; call_count: number; access_token_enc?: string | null },
  toolName: string,
  args: Record<string, unknown>,
  writeLog: (status: 'success' | 'error', error?: string) => void,
  db: SupabaseClient
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  if (toolName !== 'research_company') {
    return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true }
  }

  const companyName = (args.company_name as string)?.trim()
  const exchange = (args.exchange as string)?.trim().toUpperCase()
  const argApiKey = (args.user_api_key as string | undefined)?.trim()
  let storedApiKey: string | undefined
  if (!argApiKey && install.access_token_enc) {
    try {
      const { decryptToken } = await import('@/lib/mcp-crypto')
      const decrypted = decryptToken(install.access_token_enc)
      if (decrypted?.startsWith('sk-ant-')) storedApiKey = decrypted
    } catch { /* ignore decrypt errors */ }
  }
  const userApiKey = argApiKey || storedApiKey

  if (!companyName || !exchange) {
    return {
      content: [{ type: 'text', text: 'company_name and exchange are required.' }],
      isError: true,
    }
  }

  // Credit check (skip if user provides own API key)
  let currentBalance = 0
  if (!userApiKey) {
    const { data: userRow, error: userErr } = await db
      .from('users')
      .select('credit_balance')
      .eq('id', install.user_id)
      .single()

    if (userErr || !userRow) {
      writeLog('error', 'Failed to fetch user credits')
      return {
        content: [{ type: 'text', text: 'Failed to verify credit balance. Please try again.' }],
        isError: true,
      }
    }

    currentBalance = userRow.credit_balance
    if (currentBalance < 25) {
      writeLog('error', 'Insufficient credits')
      return {
        content: [{
          type: 'text',
          text: `Insufficient credits.\n\nYour balance: Rs${currentBalance}\nRequired: Rs25 per report\n\nProvide your own Anthropic API key in the user_api_key parameter to bypass credits.`,
        }],
        isError: true,
      }
    }
  }

  // Call Claude API
  const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    writeLog('error', 'No API key configured')
    return {
      content: [{ type: 'text', text: 'Research service is not configured. Please contact support.' }],
      isError: true,
    }
  }

  const prompt = RESEARCH_PROMPT
    .replace(/COMPANY_NAME/g, companyName)
    .replace(/EXCHANGE/g, exchange)

  const anthropic = new Anthropic({ apiKey })

  let reportText: string
  try {
    // Stream the response — keeps the HTTP connection alive during long generation.
    // Using haiku (fastest model) at 7000 tokens to stay within Vercel timeout.
    let stop_reason: string | null = null
    const chunks: string[] = []
    const stream = await anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        chunks.push(event.delta.text)
      }
      if (event.type === 'message_delta') {
        stop_reason = event.delta.stop_reason ?? null
      }
    }
    reportText = chunks.join('')
    if (stop_reason === 'max_tokens') {
      reportText += '\n\n---\n\n**Note: Report reached the token limit. Key sections above are complete.**'
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    writeLog('error', `Claude API error: ${msg}`)
    return {
      content: [{ type: 'text', text: `Failed to generate research: ${msg}` }],
      isError: true,
    }
  }

  // Generate PDF
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateResearchPDF(reportText, companyName, exchange)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    writeLog('error', `PDF generation error: ${msg}`)
    return {
      content: [{ type: 'text', text: `Failed to generate PDF: ${msg}` }],
      isError: true,
    }
  }

  // Upload to Supabase Storage
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const dateTag = new Date().toISOString().split('T')[0]
  const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  const filename = `${companySlug}-${dateTag}-${Date.now()}.pdf`
  const storagePath = `${install.user_id}/${filename}`

  const { error: uploadErr } = await serviceClient.storage
    .from('research-pdfs')
    .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadErr) {
    writeLog('error', `Storage upload error: ${uploadErr.message}`)
    return {
      content: [{ type: 'text', text: `Failed to store PDF: ${uploadErr.message}` }],
      isError: true,
    }
  }

  // Create signed URL (valid 7 days)
  const { data: signedData, error: signErr } = await serviceClient.storage
    .from('research-pdfs')
    .createSignedUrl(storagePath, 7 * 24 * 60 * 60)

  if (signErr || !signedData?.signedUrl) {
    writeLog('error', 'Failed to create signed URL')
    return {
      content: [{ type: 'text', text: 'Failed to generate download link.' }],
      isError: true,
    }
  }

  // Deduct credits
  if (!userApiKey) {
    await db
      .from('users')
      .update({ credit_balance: currentBalance - 25 })
      .eq('id', install.user_id)
  }

  writeLog('success')

  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return {
    content: [{
      type: 'text',
      text: [
        `Research report generated for ${companyName} (${exchange})`,
        ``,
        `Download PDF: ${signedData.signedUrl}`,
        `Link expires: ${expiryDate} (7 days)`,
        !userApiKey ? `Credits remaining: Rs${currentBalance - 25}` : `Used your own API key (no credits deducted)`,
        ``,
        `---`,
        ``,
        reportText,
      ].join('\n'),
    }],
  }
}
