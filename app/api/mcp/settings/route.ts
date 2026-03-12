// POST /api/mcp/settings
// Saves user's Anthropic API key for the Company Research MCP
// Body: { token: string, anthropic_api_key: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encryptToken } from '@/lib/mcp-crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  let body: { token?: string; anthropic_api_key?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, anthropic_api_key } = body

  if (!token?.startsWith('emcp_')) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  if (!anthropic_api_key?.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'Invalid Anthropic API key — must start with sk-ant-' }, { status: 400 })
  }

  const db = getServiceClient()

  // Look up installation
  const { data: install, error: lookupErr } = await db
    .from('installed_mcps')
    .select('id, mcp_slug')
    .eq('mcp_token', token)
    .single()

  if (lookupErr || !install) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 })
  }

  if (install.mcp_slug !== 'company-research') {
    return NextResponse.json({ error: 'API key only applies to Company Research MCP' }, { status: 400 })
  }

  // Encrypt and store — we reuse access_token_enc (unused for non-OAuth MCPs)
  const encrypted = encryptToken(anthropic_api_key)

  const { error: updateErr } = await db
    .from('installed_mcps')
    .update({ access_token_enc: encrypted })
    .eq('id', install.id)

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to save key: ' + updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
