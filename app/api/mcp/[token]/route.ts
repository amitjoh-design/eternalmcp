// MCP Streamable HTTP endpoint
// POST /api/mcp/[token]
// Implements MCP protocol spec 2024-11-05
// Dispatches to Gmail or Research handler based on mcp_slug

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decryptToken, encryptToken } from '@/lib/mcp-crypto'
import { sendEmail, createDraft, refreshGmailToken } from '@/lib/mcps/gmail/handler'
import { handleResearchTool } from '@/lib/mcps/research/handler'
import { handleStorageTool } from '@/lib/mcps/storage/handler'
import { handlePdfCreatorTool } from '@/lib/mcps/pdf/handler'
import { getMcpDefinition } from '@/lib/mcps/registry'

// Vercel: allow up to 5 minutes for research report generation
export const maxDuration = 300

// Service client bypasses RLS — needed to look up any token
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function mcpOk(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}

function mcpError(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  // ── 1. Validate token format ──────────────────────────────
  if (!token?.startsWith('emcp_')) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // ── 2. Look up installation ───────────────────────────────
  const db = getServiceClient()
  const { data: install, error: dbErr } = await db
    .from('installed_mcps')
    .select('*')
    .eq('mcp_token', token)
    .single()

  if (dbErr || !install) {
    return NextResponse.json({ error: 'Token not found' }, { status: 401 })
  }

  if (install.status !== 'connected') {
    return NextResponse.json(
      { error: 'MCP not connected. Please connect via EternalMCP dashboard.' },
      { status: 403 }
    )
  }

  const mcpSlug: string = install.mcp_slug
  const def = getMcpDefinition(mcpSlug)

  // ── 3. Parse MCP JSON-RPC body ────────────────────────────
  let body: { jsonrpc: string; method: string; params?: Record<string, unknown>; id?: unknown }
  try {
    body = await req.json()
  } catch {
    return mcpError(null, -32700, 'Parse error')
  }

  const { method, params: mcpParams, id } = body

  // ── 4. Handle initialize ──────────────────────────────────
  if (method === 'initialize') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.eternalmcp.com'
    return mcpOk(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: {
        name: def?.name ?? mcpSlug,
        version: def?.version ?? '1.0.0',
        icon: mcpSlug === 'gmail-sender'
          ? `${appUrl}/icons/gmail.svg`
          : `${appUrl}/icons/research.svg`,
        description: def?.description ?? '',
      },
    })
  }

  // ── 5. Handle notifications/initialized ──────────────────
  if (method === 'notifications/initialized') {
    return new NextResponse(null, { status: 204 })
  }

  // ── 6. Handle tools/list ──────────────────────────────────
  if (method === 'tools/list') {
    return mcpOk(id, { tools: def?.tools ?? [] })
  }

  // ── 7. Handle ping ────────────────────────────────────────
  if (method === 'ping') {
    return mcpOk(id, {})
  }

  // ── 8. Handle tools/call ─────────────────────────────────
  if (method === 'tools/call') {
    const toolName = (mcpParams as { name?: string })?.name
    const args = (mcpParams as { arguments?: Record<string, unknown> })?.arguments ?? {}

    // Extract caller metadata for audit log
    const ipRaw = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    const ip = ipRaw.split(',')[0].trim()
    const userAgent = req.headers.get('user-agent') ?? 'unknown'

    // Fire-and-forget audit log writer
    const writeLog = (status: 'success' | 'error', errorMessage?: string) => {
      db.from('mcp_call_logs').insert({
        installed_mcp_id: install.id,
        user_id: install.user_id,
        tool_name: toolName ?? 'unknown',
        to_address: args.to as string | undefined,
        subject: args.subject as string | undefined,
        ip_address: ip,
        user_agent: userAgent,
        status,
        error_message: errorMessage ?? null,
      }).then(() => {})
    }

    // Update call stats (fire-and-forget)
    db.from('installed_mcps')
      .update({ call_count: install.call_count + 1, last_called_at: new Date().toISOString() })
      .eq('id', install.id)
      .then(() => {})

    // ── Dispatch by MCP slug ──────────────────────────────────
    if (mcpSlug === 'company-research') {
      try {
        const result = await handleResearchTool(install, toolName ?? '', args, writeLog, db)
        return mcpOk(id, result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        writeLog('error', msg)
        return mcpOk(id, {
          content: [{ type: 'text', text: `❌ Research error: ${msg}` }],
          isError: true,
        })
      }
    }

    // ── Gmail handler ─────────────────────────────────────────
    if (mcpSlug === 'gmail-sender') {
      // Decrypt and refresh token if needed
      let accessToken: string
      try {
        accessToken = decryptToken(install.access_token_enc)

        if (install.token_expiry && new Date(install.token_expiry) < new Date()) {
          const refreshToken = decryptToken(install.refresh_token_enc)
          const refreshed = await refreshGmailToken(
            refreshToken,
            process.env.GMAIL_CLIENT_ID!,
            process.env.GMAIL_CLIENT_SECRET!
          )
          accessToken = refreshed.accessToken

          await db
            .from('installed_mcps')
            .update({
              access_token_enc: encryptToken(refreshed.accessToken),
              token_expiry: refreshed.expiry.toISOString(),
            })
            .eq('id', install.id)
        }
      } catch (err) {
        const msg = `Gmail token invalid: ${err instanceof Error ? err.message : err}`
        writeLog('error', msg)
        return mcpOk(id, {
          content: [{ type: 'text', text: `Error: ${msg}. Please reconnect via EternalMCP dashboard.` }],
          isError: true,
        })
      }

      try {
        if (toolName === 'send_email') {
          const result = await sendEmail(
            { accessToken, refreshToken: '', expiry: null },
            {
              to: args.to as string,
              subject: args.subject as string,
              body: args.body as string,
              cc: args.cc as string | undefined,
              bcc: args.bcc as string | undefined,
              attachment_url: args.attachment_url as string | undefined,
              attachment_filename: args.attachment_filename as string | undefined,
            }
          )
          writeLog('success')
          const attachNote = args.attachment_url ? `\nAttachment: ${args.attachment_filename || 'file attached'}` : ''
          return mcpOk(id, {
            content: [{ type: 'text', text: `✅ Email sent successfully!${attachNote}\nMessage ID: ${result.messageId}\nThread ID: ${result.threadId}` }],
          })
        }

        if (toolName === 'create_draft') {
          const result = await createDraft(
            { accessToken, refreshToken: '', expiry: null },
            {
              to: args.to as string,
              subject: args.subject as string,
              body: args.body as string,
            }
          )
          writeLog('success')
          return mcpOk(id, {
            content: [{ type: 'text', text: `✅ Draft saved!\nDraft ID: ${result.draftId}` }],
          })
        }

        return mcpError(id as unknown as number, -32601, `Unknown Gmail tool: ${toolName}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        writeLog('error', msg)
        return mcpOk(id, {
          content: [{ type: 'text', text: `❌ Error: ${msg}` }],
          isError: true,
        })
      }
    }

    // ── Storage Manager handler ───────────────────────────────
    if (mcpSlug === 'storage-manager') {
      try {
        const result = await handleStorageTool(install, toolName ?? '', args, writeLog, db)
        return mcpOk(id, result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        writeLog('error', msg)
        return mcpOk(id, {
          content: [{ type: 'text', text: `Storage error: ${msg}` }],
          isError: true,
        })
      }
    }

    // ── PDF Creator handler ───────────────────────────────────
    if (mcpSlug === 'pdf-creator') {
      try {
        const result = await handlePdfCreatorTool(install, toolName ?? '', args, writeLog)
        return mcpOk(id, result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        writeLog('error', msg)
        return mcpOk(id, {
          content: [{ type: 'text', text: `❌ PDF Creator error: ${msg}` }],
          isError: true,
        })
      }
    }

    return mcpError(id as unknown as number, -32601, `Unknown MCP slug: ${mcpSlug}`)
  }

  return mcpError(id as unknown as number, -32601, `Method not found: ${method}`)
}

// OPTIONS for CORS (some MCP clients preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
