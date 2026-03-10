// Gmail OAuth callback — exchanges code for tokens, stores encrypted
// GET /api/mcp/connect/gmail/callback?code=xxx&state=xxx

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encryptToken } from '@/lib/mcp-crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.eternalmcp.com'
  const dashboardUrl = `${appUrl}/dashboard?tab=mcps`

  // User denied access
  if (error) {
    return NextResponse.redirect(`${dashboardUrl}&mcp_error=${encodeURIComponent(error)}`)
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${dashboardUrl}&mcp_error=missing_params`)
  }

  // Decode state
  let userId: string
  let mcpToken: string
  try {
    const state = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'))
    userId = state.userId
    mcpToken = state.mcpToken
  } catch {
    return NextResponse.redirect(`${dashboardUrl}&mcp_error=invalid_state`)
  }

  // Exchange code for tokens
  const redirectUri = `${appUrl}/api/mcp/connect/gmail/callback`
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()
  if (!tokenRes.ok || !tokens.access_token) {
    const msg = tokens.error_description || tokens.error || 'token_exchange_failed'
    return NextResponse.redirect(`${dashboardUrl}&mcp_error=${encodeURIComponent(msg)}`)
  }

  // Get Gmail user's email
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const profile = await profileRes.json()

  // Store encrypted tokens in DB
  const db = getServiceClient()
  const tokenExpiry = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  const { error: dbError } = await db
    .from('installed_mcps')
    .update({
      mcp_token: mcpToken, // Ensure we have the right token
      connected_email: profile.email || null,
      access_token_enc: encryptToken(tokens.access_token),
      refresh_token_enc: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
      token_expiry: tokenExpiry,
      status: 'connected',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('mcp_slug', 'gmail-sender')

  if (dbError) {
    return NextResponse.redirect(`${dashboardUrl}&mcp_error=db_save_failed`)
  }

  return NextResponse.redirect(`${dashboardUrl}&mcp_connected=gmail-sender`)
}
