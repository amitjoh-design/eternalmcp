// Company Research MCP — Tool Handler
// Calls Claude API → generates PDF → uploads to Supabase Storage → returns signed URL

import Anthropic from '@anthropic-ai/sdk'
import PDFDocument from 'pdfkit'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── Institutional Research Prompt ────────────────────────────────────────────
const RESEARCH_PROMPT = `Role: Act as a Senior Equity Research Analyst with 20+ years of experience in institutional investing, fundamental analysis, and valuation (similar to analysts at Goldman Sachs, Morgan Stanley, or top hedge funds).

Your task is to produce a professional equity research report on COMPANY_NAME listed on EXCHANGE.

The report should be data-driven, structured, and written in institutional research style suitable for investment committees and professional investors.
If reliable financial data is unavailable, clearly state "Data Not Available" rather than estimating.

# 1. Sector Analysis & Macro Environment

## Industry Overview
- Sector size and growth trends
- Industry life-cycle stage
- Global vs domestic market dynamics

## Macro Drivers
Explain key macro factors influencing the sector:
- Interest rates
- Inflation
- Commodity prices
- Regulation
- Technological disruption
- Consumer demand trends

## Key Tailwinds
Identify 3–5 major growth drivers.

## Key Headwinds
Identify 3–5 structural risks or challenges.

## Sector SWOT Analysis
**Strengths:** [list]
**Weaknesses:** [list]
**Opportunities:** [list]
**Threats:** [list]

# 2. Company Positioning within the Sector

## Market Position
- Market share
- Competitive advantages (moat): brand power, cost leadership, network effects, switching costs, patents/technology

## Competitive Benchmarking
Compare COMPANY_NAME against top 3 competitors:

| Metric | COMPANY_NAME | Competitor 1 | Competitor 2 | Competitor 3 |
|--------|-------------|-------------|-------------|-------------|
| Revenue Growth | | | | |
| EBITDA Margin | | | | |
| ROE | | | | |
| Market Share | | | | |

## Company SWOT Analysis
**Strengths:** [list]
**Weaknesses:** [list]
**Opportunities:** [list]
**Threats:** [list]

# 3. Recent Developments & Market Sentiment

Summarize the most important developments in the past 6 months:
- Earnings announcements
- Management commentary
- Strategic initiatives
- M&A activity
- Regulatory developments
- Product launches
- Institutional investor positioning

## Market Sentiment
- Analyst upgrades/downgrades
- Institutional ownership trends
- Retail sentiment
- Market narrative around the stock

# 4. Fundamental Analysis

## Revenue & Growth
- Revenue CAGR (3–5 year)
- Segment contribution
- Growth sustainability

## Profitability

| Metric | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|--------|--------|--------|--------|--------|--------|
| Revenue | | | | | |
| EBITDA Margin | | | | | |
| Net Profit | | | | | |
| Net Margin | | | | | |

Interpret trends and explain the drivers.

## Solvency & Balance Sheet Strength
- Debt-to-Equity
- Interest Coverage
- Current Ratio
- Free Cash Flow

## Efficiency & Capital Allocation
- Return on Equity (ROE)
- Return on Capital Employed (ROCE)
- Asset Turnover
- Management capital allocation discipline

# 5. Valuation Analysis

| Metric | Current | 5Y Historical Avg | Industry Median |
|--------|---------|------------------|-----------------|
| P/E | | | |
| P/B | | | |
| EV/EBITDA | | | |

Is the stock Undervalued, Fairly Valued, or Overvalued? Explain with reasoning.

# 6. Investment Thesis

Provide 3–5 key reasons an investor should own this stock.

**Thesis 1:** [Explanation]
**Thesis 2:** [Explanation]
**Thesis 3:** [Explanation]

# 7. Key Catalysts

Identify potential events that could move the stock price:
- Earnings surprises
- Regulatory changes
- Product launches
- Industry cycle shifts
- Macro changes

# 8. Key Risks

Identify top 3–5 risks that could invalidate the investment thesis. Explain each clearly.

# 9. Final Investment Recommendation

**Rating:** BUY / HOLD / SELL
**Confidence Index:** [1–10]
**Investment Horizon:** Short-term / Medium-term / Long-term

**Summary Conclusion:** [Concise final investment view in 2–3 sentences]

---
Data Integrity: Use only verifiable financial data. Write "Data Not Available" if information cannot be confirmed. Avoid speculation.`

// ── PDF Generation ────────────────────────────────────────────────────────────

async function generateResearchPDF(
  reportText: string,
  companyName: string,
  exchange: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 60,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `Equity Research: ${companyName}`,
        Author: 'EternalMCP Research',
        Subject: `Institutional Equity Research — ${companyName} (${exchange})`,
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const PRIMARY = '#6366f1'
    const TEXT = '#1f2937'
    const MUTED = '#6b7280'
    const LIGHT_BG = '#f8fafc'
    const pageW = doc.page.width
    const margin = 60
    const contentW = pageW - margin * 2

    // ── Title Page ──────────────────────────────────────────────────────────
    // Top header bar
    doc.rect(0, 0, pageW, 90).fill(PRIMARY)
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
      .text('EternalMCP', margin, 22)
    doc.fillColor('#c7d2fe').fontSize(10).font('Helvetica')
      .text('Institutional Grade Equity Research Platform', margin, 48)

    // Company title block
    doc.fillColor(TEXT).fontSize(26).font('Helvetica-Bold')
      .text(companyName, margin, 115, { width: contentW })

    const titleH = doc.heightOfString(companyName, { width: contentW })
    const afterTitle = 115 + titleH + 10

    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    doc.fillColor(MUTED).fontSize(12).font('Helvetica')
      .text(`${exchange}  |  ${dateStr}`, margin, afterTitle)

    doc.fillColor(MUTED).fontSize(9)
      .text('CONFIDENTIAL — For Professional Investors Only', margin, afterTitle + 22)

    // Decorative divider
    const divY = afterTitle + 48
    doc.rect(margin, divY, contentW, 2).fill(PRIMARY)

    // Quick info boxes
    const boxY = divY + 20
    const boxes = [
      { label: 'Exchange', value: exchange },
      { label: 'Report Type', value: 'Equity Research' },
      { label: 'Coverage', value: 'Institutional' },
    ]
    const boxW = (contentW - 20) / boxes.length
    boxes.forEach((box, idx) => {
      const bx = margin + idx * (boxW + 10)
      doc.rect(bx, boxY, boxW, 50).fill(LIGHT_BG)
      doc.fillColor(MUTED).fontSize(8).font('Helvetica')
        .text(box.label, bx + 10, boxY + 8, { width: boxW - 20 })
      doc.fillColor(TEXT).fontSize(11).font('Helvetica-Bold')
        .text(box.value, bx + 10, boxY + 22, { width: boxW - 20 })
    })

    // Disclaimer
    const discY = boxY + 70
    doc.rect(margin, discY, contentW, 55).fill('#fef3c7')
    doc.rect(margin, discY, 3, 55).fill('#f59e0b')
    doc.fillColor('#92400e').fontSize(8).font('Helvetica')
      .text(
        'DISCLAIMER: This report is generated by AI and is for informational purposes only. It does not constitute investment advice. Past performance is not indicative of future results. Always consult a qualified financial advisor before making investment decisions.',
        margin + 12, discY + 8,
        { width: contentW - 20, lineGap: 2 }
      )

    // Start new page for the actual report
    doc.addPage()
    addPageHeader(doc, companyName, PRIMARY, pageW, margin)

    // ── Report Content ────────────────────────────────────────────────────────
    const lines = reportText.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed) {
        if (doc.y < doc.page.height - 100) {
          doc.moveDown(0.4)
        }
        continue
      }

      // Page break check
      if (doc.y > doc.page.height - 100) {
        doc.addPage()
        addPageHeader(doc, companyName, PRIMARY, pageW, margin)
      }

      if (/^#{1}\s/.test(trimmed)) {
        // H1 — major section
        doc.moveDown(0.8)
        if (doc.y > doc.page.height - 120) {
          doc.addPage()
          addPageHeader(doc, companyName, PRIMARY, pageW, margin)
        }
        // Section bar
        doc.rect(margin, doc.y, contentW, 28).fill(PRIMARY + '15')
        doc.rect(margin, doc.y, 4, 28).fill(PRIMARY)
        doc.fillColor(PRIMARY).fontSize(12).font('Helvetica-Bold')
          .text(trimmed.replace(/^#+\s/, ''), margin + 12, doc.y + 8, { width: contentW - 20 })
        doc.moveDown(1)
      } else if (/^#{2}\s/.test(trimmed)) {
        // H2
        doc.moveDown(0.5)
        doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
          .text(trimmed.replace(/^#+\s/, ''), margin, doc.y, { width: contentW })
        doc.moveTo(margin, doc.y + 2).lineTo(margin + 80, doc.y + 2)
          .strokeColor(PRIMARY).lineWidth(1).stroke()
        doc.moveDown(0.5)
      } else if (/^#{3,}\s/.test(trimmed)) {
        // H3+
        doc.fillColor('#374151').fontSize(10.5).font('Helvetica-Bold')
          .text(trimmed.replace(/^#+\s/, ''), margin, doc.y, { width: contentW })
        doc.moveDown(0.3)
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Bullet
        const content = trimmed.replace(/^[*-]\s+/, '')
        const cleaned = stripInlineMarkdown(content)
        doc.fillColor(TEXT).fontSize(9.5).font('Helvetica')
          .text(`•  ${cleaned}`, margin + 12, doc.y, { width: contentW - 12 })
        doc.moveDown(0.2)
      } else if (/^\*\*[^*]+\*\*:/.test(trimmed)) {
        // **Label:** value pattern
        const colonIdx = trimmed.indexOf(':**')
        const afterColon = trimmed.indexOf(':** ')
        if (afterColon !== -1) {
          const label = trimmed.replace(/^\*\*/, '').substring(0, trimmed.indexOf('**', 2) - 2)
          const value = trimmed.substring(afterColon + 4)
          doc.fillColor(TEXT).fontSize(9.5).font('Helvetica-Bold')
            .text(`${label.replace(/\*\*/g, '')}: `, margin, doc.y, { continued: true, width: contentW })
          doc.font('Helvetica').fillColor('#374151')
            .text(stripInlineMarkdown(value), { width: contentW })
        } else {
          doc.fillColor(TEXT).fontSize(9.5).font('Helvetica-Bold')
            .text(stripInlineMarkdown(trimmed), margin, doc.y, { width: contentW })
        }
        doc.moveDown(0.2)
      } else if (trimmed.startsWith('|')) {
        // Table row
        renderTableRow(doc, trimmed, margin, contentW, TEXT, PRIMARY)
      } else if (/^\d+\.\s/.test(trimmed)) {
        // Numbered list
        doc.fillColor(TEXT).fontSize(9.5).font('Helvetica')
          .text(stripInlineMarkdown(trimmed), margin + 12, doc.y, { width: contentW - 12 })
        doc.moveDown(0.2)
      } else if (trimmed.startsWith('---')) {
        // Horizontal rule
        doc.moveDown(0.3)
        doc.moveTo(margin, doc.y).lineTo(pageW - margin, doc.y)
          .strokeColor('#e5e7eb').lineWidth(0.5).stroke()
        doc.moveDown(0.3)
      } else {
        // Regular paragraph
        doc.fillColor('#374151').fontSize(9.5).font('Helvetica')
          .text(stripInlineMarkdown(trimmed), margin, doc.y, { width: contentW, lineGap: 1.5 })
        doc.moveDown(0.3)
      }
    }

    // ── Page Footers ──────────────────────────────────────────────────────────
    const range = doc.bufferedPageRange()
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i)
      const footerY = doc.page.height - 32
      doc.rect(0, footerY, pageW, 32).fill('#f1f5f9')
      doc.moveTo(0, footerY).lineTo(pageW, footerY).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
      doc.fillColor(MUTED).fontSize(7.5).font('Helvetica')
        .text(
          `EternalMCP Research  |  ${companyName} (${exchange})  |  Page ${i + 1} of ${range.count}  |  Generated ${dateStr}  |  eternalmcp.com`,
          margin, footerY + 10,
          { width: contentW, align: 'center' }
        )
    }

    doc.end()
  })
}

function addPageHeader(
  doc: PDFKit.PDFDocument,
  companyName: string,
  color: string,
  pageW: number,
  margin: number
) {
  const contentW = pageW - margin * 2
  doc.rect(0, 0, pageW, 32).fill(color)
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
    .text(`EternalMCP Research  |  ${companyName}`, margin, 11, { width: contentW })
  doc.y = 50
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

let tableRowCount = 0
function renderTableRow(
  doc: PDFKit.PDFDocument,
  row: string,
  margin: number,
  contentW: number,
  textColor: string,
  primaryColor: string
) {
  const cells = row.split('|').map((c) => c.trim()).filter((c) => c.length > 0)

  if (cells.every((c) => /^[-:]+$/.test(c))) {
    // Separator row — skip
    tableRowCount = 0
    return
  }

  const isHeader = cells.some((c) => /^[\*_]*[A-Z]/.test(c)) && tableRowCount === 0
  const cellW = Math.floor(contentW / Math.max(cells.length, 1))
  const rowH = 18
  const rowY = doc.y

  if (doc.y + rowH > doc.page.height - 100) {
    doc.addPage()
    doc.y = 80
  }

  // Row background
  const bg = isHeader ? primaryColor + '20' : tableRowCount % 2 === 0 ? '#f8fafc' : '#ffffff'
  doc.rect(margin, rowY, contentW, rowH).fill(bg)

  cells.forEach((cell, idx) => {
    const cx = margin + idx * cellW + 4
    doc.fillColor(isHeader ? primaryColor : textColor)
      .fontSize(8.5)
      .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
      .text(cell, cx, rowY + 4, { width: cellW - 8, lineBreak: false })
  })

  // Border
  doc.rect(margin, rowY, contentW, rowH).strokeColor('#e5e7eb').lineWidth(0.3).stroke()

  doc.y = rowY + rowH + 1
  tableRowCount++
}

// ── Main handler export ───────────────────────────────────────────────────────

export async function handleResearchTool(
  install: { id: string; user_id: string; call_count: number },
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
  const userApiKey = (args.user_api_key as string | undefined)?.trim()

  if (!companyName || !exchange) {
    return {
      content: [{ type: 'text', text: '❌ company_name and exchange are required.' }],
      isError: true,
    }
  }

  // ── Credit check (skip if user provides own API key) ───────────────────────
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
        content: [{ type: 'text', text: '❌ Failed to verify credit balance. Please try again.' }],
        isError: true,
      }
    }

    currentBalance = userRow.credit_balance
    if (currentBalance < 25) {
      writeLog('error', 'Insufficient credits')
      return {
        content: [{
          type: 'text',
          text: `❌ Insufficient credits.\n\nYour balance: ₹${currentBalance}\nRequired: ₹25 per report\n\nTo top up your credits, please contact support or provide your own Anthropic API key in the user_api_key parameter.`,
        }],
        isError: true,
      }
    }
  }

  // ── Call Claude API ────────────────────────────────────────────────────────
  const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    writeLog('error', 'No API key configured')
    return {
      content: [{ type: 'text', text: '❌ Research service is not configured. Please contact support.' }],
      isError: true,
    }
  }

  const prompt = RESEARCH_PROMPT
    .replace(/COMPANY_NAME/g, companyName)
    .replace(/EXCHANGE/g, exchange)

  const anthropic = new Anthropic({ apiKey })

  let reportText: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      messages: [{ role: 'user', content: prompt }],
    })
    reportText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    writeLog('error', `Claude API error: ${msg}`)
    return {
      content: [{ type: 'text', text: `❌ Failed to generate research: ${msg}` }],
      isError: true,
    }
  }

  // ── Generate PDF ──────────────────────────────────────────────────────────
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateResearchPDF(reportText, companyName, exchange)
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

  const dateStr = new Date().toISOString().split('T')[0]
  const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  const filename = `${companySlug}-${dateStr}-${Date.now()}.pdf`
  const storagePath = `${install.user_id}/${filename}`

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

  // ── Create signed URL (valid 7 days) ─────────────────────────────────────
  const { data: signedData, error: signErr } = await serviceClient.storage
    .from('research-pdfs')
    .createSignedUrl(storagePath, 7 * 24 * 60 * 60)

  if (signErr || !signedData?.signedUrl) {
    writeLog('error', 'Failed to create signed URL')
    return {
      content: [{ type: 'text', text: '❌ Failed to generate download link. Report was saved but link creation failed.' }],
      isError: true,
    }
  }

  // ── Deduct credits (only if using platform API key) ───────────────────────
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
        `✅ Research report generated for **${companyName}** (${exchange})`,
        ``,
        `📄 **Download PDF:** ${signedData.signedUrl}`,
        `🕐 Link expires: ${expiryDate} (7 days)`,
        !userApiKey ? `💳 Credits remaining: ₹${currentBalance - 25}` : `🔑 Used your own API key (no credits deducted)`,
        ``,
        `---`,
        ``,
        reportText,
      ].join('\n'),
    }],
  }
}
