// Gmail MCP Tool Handler

interface GmailTokens {
  accessToken: string
  refreshToken: string
  expiry: Date | null
}

interface RefreshResult {
  accessToken: string
  expiry: Date
}

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

// Build plain-text or HTML email (no attachment)
function buildSimpleEmail(params: {
  from: string
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
}): string {
  const isHtml = params.body.trim().startsWith('<')
  const lines = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    params.cc  ? `Cc: ${params.cc}`   : null,
    params.bcc ? `Bcc: ${params.bcc}` : null,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
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

// Build multipart/mixed email with one attachment
function buildEmailWithAttachment(params: {
  from: string
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
  attachmentData: Buffer
  attachmentFilename: string
  attachmentMimeType: string
}): string {
  const isHtml = params.body.trim().startsWith('<')
  const bodyContentType = isHtml ? 'text/html' : 'text/plain'
  const boundary = `----=_Part_${Date.now().toString(36)}`
  const attachmentB64 = params.attachmentData.toString('base64')
    // Split into 76-char lines per RFC 2045
    .match(/.{1,76}/g)!.join('\r\n')

  const mime = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    params.cc  ? `Cc: ${params.cc}`   : null,
    params.bcc ? `Bcc: ${params.bcc}` : null,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: ${bodyContentType}; charset=utf-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    params.body,
    ``,
    `--${boundary}`,
    `Content-Type: ${params.attachmentMimeType}; name="${params.attachmentFilename}"`,
    `Content-Transfer-Encoding: base64`,
    `Content-Disposition: attachment; filename="${params.attachmentFilename}"`,
    ``,
    attachmentB64,
    ``,
    `--${boundary}--`,
  ]
    .filter((l) => l !== null)
    .join('\r\n')

  return Buffer.from(mime)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Detect MIME type from URL path or Content-Type header
function detectMimeType(url: string, contentTypeHeader: string | null): string {
  if (contentTypeHeader && !contentTypeHeader.includes('octet-stream')) {
    return contentTypeHeader.split(';')[0].trim()
  }
  const path = url.split('?')[0].toLowerCase()
  if (path.endsWith('.pdf'))  return 'application/pdf'
  if (path.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (path.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (path.endsWith('.png'))  return 'image/png'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
  if (path.endsWith('.csv'))  return 'text/csv'
  return 'application/octet-stream'
}

// Derive a sensible filename from a URL
function filenameFromUrl(url: string): string {
  const path = url.split('?')[0]
  const last = path.split('/').pop() || 'attachment'
  // If it looks like a UUID or random hash with no extension, default to .pdf
  if (!last.includes('.')) return last + '.pdf'
  return last
}

// Send email via Gmail API (supports optional URL attachment)
export async function sendEmail(
  tokens: GmailTokens,
  params: {
    to: string
    subject: string
    body: string
    cc?: string
    bcc?: string
    attachment_url?: string
    attachment_filename?: string
  }
): Promise<{ messageId: string; threadId: string }> {
  const profileRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  })
  const profile = await profileRes.json()
  if (!profileRes.ok) throw new Error('Failed to get Gmail profile: ' + profile.error?.message)

  let raw: string

  if (params.attachment_url) {
    // Fetch the attachment from the URL
    const attachRes = await fetch(params.attachment_url)
    if (!attachRes.ok) {
      throw new Error(`Failed to fetch attachment from URL: HTTP ${attachRes.status}`)
    }
    const attachBuffer = Buffer.from(await attachRes.arrayBuffer())
    const mimeType = detectMimeType(
      params.attachment_url,
      attachRes.headers.get('content-type')
    )
    const filename = params.attachment_filename || filenameFromUrl(params.attachment_url)

    raw = buildEmailWithAttachment({
      from: profile.emailAddress,
      to: params.to,
      subject: params.subject,
      body: params.body,
      cc: params.cc,
      bcc: params.bcc,
      attachmentData: attachBuffer,
      attachmentFilename: filename,
      attachmentMimeType: mimeType,
    })
  } else {
    raw = buildSimpleEmail({ from: profile.emailAddress, ...params })
  }

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

  const raw = buildSimpleEmail({ from: profile.emailAddress, ...params })

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
