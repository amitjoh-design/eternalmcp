// MCP Streamable HTTP endpoint
// POST /api/mcp/[token]
// Implements MCP protocol spec 2024-11-05

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decryptToken, encryptToken } from '@/lib/mcp-crypto'
import { sendEmail, createDraft, refreshGmailToken } from '@/lib/mcps/gmail/handler'
import { GMAIL_MCP_DEFINITION } from '@/lib/mcps/gmail/definition'

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
    return NextResponse.json({ error: 'Gmail not connected. Please connect via EternalMCP dashboard.' }, { status: 403 })
  }

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
        name: GMAIL_MCP_DEFINITION.name,
        version: GMAIL_MCP_DEFINITION.version,
        icon: `${appUrl}/icons/gmail.svg`,
        description: GMAIL_MCP_DEFINITION.description,
      },
    })
  }

  // ── 5. Handle notifications/initialized (no response needed) ──
  if (method === 'notifications/initialized') {
    return new NextResponse(null, { status: 204 })
  }

  // ── 6. Handle tools/list ──────────────────────────────────
  if (method === 'tools/list') {
    return mcpOk(id, { tools: GMAIL_MCP_DEFINITION.tools })
  }

  // ── 7. Handle ping ────────────────────────────────────────
  if (method === 'ping') {
    return mcpOk(id, {})
  }

  // ── 8. Handle tools/call ─────────────────────────────────
  if (method === 'tools/call') {
    const toolName = (mcpParams as { name?: string })?.name
    const args = (mcpParams as { arguments?: Record<string, unknown> })?.arguments ?? {}

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

        // Update stored token
        await db
          .from('installed_mcps')
          .update({
            access_token_enc: encryptToken(refreshed.accessToken),
            token_expiry: refreshed.expiry.toISOString(),
          })
          .eq('id', install.id)
      }
    } catch (err) {
      return mcpOk(id, {
        content: [{ type: 'text', text: `Error: Gmail token invalid. Please reconnect via EternalMCP dashboard. (${err instanceof Error ? err.message : err})` }],
        isError: true,
      })
    }

    // Update call stats
    await db
      .from('installed_mcps')
      .update({ call_count: install.call_count + 1, last_called_at: new Date().toISOString() })
      .eq('id', install.id)

    // Execute tool
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
          }
        )
        return mcpOk(id, {
          content: [{ type: 'text', text: `✅ Email sent successfully!\nMessage ID: ${result.messageId}\nThread ID: ${result.threadId}` }],
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
        return mcpOk(id, {
          content: [{ type: 'text', text: `✅ Draft saved!\nDraft ID: ${result.draftId}` }],
        })
      }

      return mcpError(id as unknown as number, -32601, `Unknown tool: ${toolName}`)
    } catch (err) {
      return mcpOk(id, {
        content: [{ type: 'text', text: `❌ Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      })
    }
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
