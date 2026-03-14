// PDF Creator MCP — Direct Install (no OAuth)
// GET /api/mcp/connect/pdf-creator?userId=xxx

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateMcpToken } from '@/lib/mcp-crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.eternalmcp.com'

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const db = getServiceClient()

  const { data: existing } = await db
    .from('installed_mcps')
    .select('mcp_token')
    .eq('user_id', userId)
    .eq('mcp_slug', 'pdf-creator')
    .single()

  if (existing) {
    return NextResponse.redirect(`${appUrl}/dashboard?tab=mcps&mcp_connected=pdf-creator`)
  }

  const mcpToken = generateMcpToken()

  const { error } = await db.from('installed_mcps').insert({
    user_id: userId,
    mcp_slug: 'pdf-creator',
    mcp_token: mcpToken,
    status: 'connected',
    call_count: 0,
  })

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard?tab=mcps&mcp_error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${appUrl}/dashboard?tab=mcps&mcp_connected=pdf-creator`)
}
