// Company Research MCP — Tool Handler
// Calls Claude API and returns the research report as plain text (markdown)

import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'

// ── Institutional Research Prompt ────────────────────────────────────────────
const RESEARCH_PROMPT = `Role: Act as a Senior Equity Research Analyst with 20+ years of experience in institutional investing, fundamental analysis, and valuation (similar to analysts at Goldman Sachs, Morgan Stanley, or top hedge funds).

Your task is to produce a professional equity research report on COMPANY_NAME listed on EXCHANGE.

The report should be data-driven, structured, and written in institutional research style suitable for investment committees and professional investors. If reliable financial data is unavailable, clearly state "Data Not Available" rather than estimating.

# 1. Sector Analysis & Macro Environment

## Industry Overview
- Sector size and growth trends
- Industry life-cycle stage
- Global vs domestic market dynamics

## Macro Drivers
Key macro factors influencing the sector (interest rates, inflation, commodity prices, regulation, technological disruption, consumer demand trends).

## Key Tailwinds
3-5 major growth drivers.

## Key Headwinds
3-5 structural risks or challenges.

## Sector SWOT Analysis

| | Analysis |
|---|---|
| Strengths | |
| Weaknesses | |
| Opportunities | |
| Threats | |

# 2. Company Positioning within the Sector

## Market Position
- Market share
- Competitive advantages (moat): brand power, cost leadership, network effects, switching costs, patents or technology advantage

## Competitive Benchmarking

| Metric | COMPANY_NAME | Competitor 1 | Competitor 2 | Competitor 3 |
|--------|-------------|--------------|--------------|--------------|
| Revenue Growth | | | | |
| EBITDA Margin | | | | |
| ROE | | | | |
| Market Share | | | | |

## Company SWOT Analysis

| | Analysis |
|---|---|
| Strengths | |
| Weaknesses | |
| Opportunities | |
| Threats | |

# 3. Recent Developments & Market Sentiment

## Key Developments (Past 6 Months)
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

# 4. Valuation Analysis

| Valuation Metric | Current | 5Y Historical Avg | Industry Median |
|-----------------|---------|-------------------|-----------------|
| P/E | | | |
| P/B | | | |
| EV/EBITDA | | | |

Valuation verdict: Undervalued / Fairly Valued / Overvalued — with reasoning on growth expectations, risk premium, and sector multiples.

# 5. Key Catalysts

Potential events that could move the stock price:
- Earnings surprises
- Regulatory changes
- Product launches
- Industry cycle shifts
- Macro changes

# 6. Key Risks

Top 3-5 risks that could invalidate the investment thesis, each explained clearly.

# 7. Final Investment Recommendation

Rating: BUY / HOLD / SELL
Confidence Index: [1-10] (10 = extremely high confidence)
Investment Horizon: Short-term / Medium-term / Long-term

Summary Conclusion: Concise final investment view.

---

DISCLAIMER: This report is AI-generated and for informational purposes only. It does not constitute investment advice. Always consult a qualified financial advisor before making investment decisions.`

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
      max_tokens: 5000,
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

  // Deduct credits
  if (!userApiKey) {
    await db
      .from('users')
      .update({ credit_balance: currentBalance - 25 })
      .eq('id', install.user_id)
  }

  writeLog('success')

  return {
    content: [{
      type: 'text',
      text: [
        `# Equity Research Report: ${companyName} (${exchange})`,
        ``,
        !userApiKey ? `*Credits remaining: ₹${currentBalance - 25}*` : `*Used your own API key — no credits deducted*`,
        ``,
        `---`,
        ``,
        reportText,
      ].join('\n'),
    }],
  }
}
