// Start Gmail OAuth flow for connecting Gmail MCP
// GET /api/mcp/connect/gmail?userId=xxx

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

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const db = getServiceClient()

  // Upsert an installed_mcp record (pending) with a unique token
  const mcpToken = generateMcpToken()

  const { error } = await db.from('installed_mcps').upsert(
    {
      user_id: userId,
      mcp_slug: 'gmail-sender',
      mcp_token: mcpToken,
      status: 'pending',
    },
    { onConflict: 'user_id,mcp_slug', ignoreDuplicates: false }
  )

  if (error) {
    // If already exists (unique conflict), fetch existing token
    const { data: existing } = await db
      .from('installed_mcps')
      .select('mcp_token')
      .eq('user_id', userId)
      .eq('mcp_slug', 'gmail-sender')
      .single()

    const tokenToUse = existing?.mcp_token || mcpToken
    return buildGoogleRedirect(userId, tokenToUse)
  }

  return buildGoogleRedirect(userId, mcpToken)
}

function buildGoogleRedirect(userId: string, mcpToken: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.eternalmcp.com'
  const redirectUri = `${appUrl}/api/mcp/connect/gmail/callback`

  const state = Buffer.from(JSON.stringify({ userId, mcpToken })).toString('base64url')

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', process.env.GMAIL_CLIENT_ID!)
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set(
    'scope',
    'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose email profile'
  )
  googleAuthUrl.searchParams.set('access_type', 'offline')
  googleAuthUrl.searchParams.set('prompt', 'consent') // Force re-consent to get refresh_token
  googleAuthUrl.searchParams.set('state', state)

  return NextResponse.redirect(googleAuthUrl.toString())
}
