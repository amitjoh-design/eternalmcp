// Gmail MCP Tool Handler
// This code runs on EternalMCP servers — read-only for users

interface GmailTokens {
  accessToken: string
  refreshToken: string
  expiry: Date | null
}

interface RefreshResult {
  accessToken: string
  expiry: Date
}

// Refresh expired Gmail access token using refresh token
export async function refreshGmailToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<RefreshResult> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Token refresh failed')
  return {
    accessToken: data.access_token,
    expiry: new Date(Date.now() + data.expires_in * 1000),
  }
}

// Build RFC 2822 MIME email and base64url encode it
function buildRawEmail(params: {
  from: string
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
  isHtml?: boolean
}): string {
  const isHtml = params.isHtml || params.body.trim().startsWith('<')
  const contentType = isHtml ? 'text/html' : 'text/plain'

  const lines = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    params.cc ? `Cc: ${params.cc}` : null,
    params.bcc ? `Bcc: ${params.bcc}` : null,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${contentType}; charset=utf-8`,
    ``,
    params.body,
  ]
    .filter(Boolean)
    .join('\r\n')

  return Buffer.from(lines)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Send email via Gmail API
export async function sendEmail(
  tokens: GmailTokens,
  params: {
    to: string
    subject: string
    body: string
    cc?: string
    bcc?: string
  }
): Promise<{ messageId: string; threadId: string }> {
  // Get sender's email address
  const profileRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  })
  const profile = await profileRes.json()
  if (!profileRes.ok) throw new Error('Failed to get Gmail profile: ' + profile.error?.message)

  const raw = buildRawEmail({ from: profile.emailAddress, ...params })

  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })
  const sent = await sendRes.json()
  if (!sendRes.ok) throw new Error('Gmail send failed: ' + (sent.error?.message || JSON.stringify(sent)))

  return { messageId: sent.id, threadId: sent.threadId }
}

// Create a Gmail draft
export async function createDraft(
  tokens: GmailTokens,
  params: { to: string; subject: string; body: string }
): Promise<{ draftId: string }> {
  const profileRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  })
  const profile = await profileRes.json()
  if (!profileRes.ok) throw new Error('Failed to get Gmail profile')

  const raw = buildRawEmail({ from: profile.emailAddress, ...params })

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw } }),
  })
  const draft = await res.json()
  if (!res.ok) throw new Error('Failed to create draft: ' + (draft.error?.message || JSON.stringify(draft)))

  return { draftId: draft.id }
}
