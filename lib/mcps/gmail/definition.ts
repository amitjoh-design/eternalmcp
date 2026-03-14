// Gmail Sender MCP — Definition
// This file defines the MCP metadata, tools schema, and read-only source code shown to users

export const GMAIL_MCP_DEFINITION = {
  slug: 'gmail-sender',
  name: 'Gmail Sender',
  description: 'Send emails, create drafts, and manage outgoing mail directly from your AI assistant.',
  icon: '📧',
  category: 'communication',
  version: '1.0.0',
  author: 'EternalMCP',
  verified: true,
  rating: 4.9,
  installs: 0,
  tags: ['email', 'gmail', 'communication', 'automation'],
  oauth_provider: 'google',
  oauth_scopes: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'email',
    'profile',
  ],
  permissions: [
    { label: 'Send emails from your Gmail', granted: true },
    { label: 'Create draft emails', granted: true },
    { label: 'Read your inbox', granted: false },
    { label: 'Delete emails', granted: false },
    { label: 'Access Gmail password', granted: false },
  ],
  tools: [
    {
      name: 'send_email',
      description: 'Send an email via Gmail. Supports plain text and HTML bodies, and optional file attachments via URL (e.g. a PDF report URL returned by research_company).',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address (e.g. alice@example.com)' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body — plain text or HTML' },
          cc: { type: 'string', description: 'CC email address (optional)' },
          bcc: { type: 'string', description: 'BCC email address (optional)' },
          attachment_url: { type: 'string', description: 'MUST be a publicly accessible URL (https://...) — local file paths are NOT supported because the server fetches this URL remotely. To attach a local file, the user must first upload it to Google Drive, Dropbox, or any public storage and share the direct download link. Example: a PDF signed URL returned by research_company.' },
          attachment_filename: { type: 'string', description: 'Filename for the attachment (e.g. "reliance-research.pdf"). If omitted, derived from the URL.' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
    {
      name: 'create_draft',
      description: 'Save an email as a Gmail draft without sending it.',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  ],
} as const

// Source code shown to users (read-only). Exact copy of handler.ts for transparency.
export const GMAIL_SOURCE_FILES: Record<string, string> = {
  'handler.ts': `// Gmail MCP Tool Handler
// This code runs on EternalMCP servers

// Refresh expired Gmail access token
async function refreshGmailToken(refreshToken, clientId, clientSecret) {
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
  return await res.json()
}

// Build RFC 2822 MIME email and base64url encode
function buildRawEmail({ from, to, subject, body, cc, bcc }) {
  const isHtml = body.trim().startsWith('<')
  const lines = [
    \`From: \${from}\`,
    \`To: \${to}\`,
    cc  ? \`Cc: \${cc}\`  : null,
    bcc ? \`Bcc: \${bcc}\` : null,
    \`Subject: \${subject}\`,
    \`MIME-Version: 1.0\`,
    \`Content-Type: \${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8\`,
    \`\`,
    body,
  ].filter(Boolean).join('\\r\\n')

  return Buffer.from(lines).toString('base64')
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')
}

// send_email tool — calls Gmail API
export async function sendEmail(accessToken, { to, subject, body, cc, bcc }) {
  // Get sender email from Gmail profile
  const { emailAddress } = await fetch(
    'https://www.googleapis.com/gmail/v1/users/me/profile',
    { headers: { Authorization: \`Bearer \${accessToken}\` } }
  ).then(r => r.json())

  const raw = buildRawEmail({ from: emailAddress, to, subject, body, cc, bcc })

  const result = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: \`Bearer \${accessToken}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  ).then(r => r.json())

  return { messageId: result.id, threadId: result.threadId }
}

// create_draft tool — saves as Gmail draft
export async function createDraft(accessToken, { to, subject, body }) {
  const { emailAddress } = await fetch(
    'https://www.googleapis.com/gmail/v1/users/me/profile',
    { headers: { Authorization: \`Bearer \${accessToken}\` } }
  ).then(r => r.json())

  const raw = buildRawEmail({ from: emailAddress, to, subject, body })

  const result = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
    {
      method: 'POST',
      headers: {
        Authorization: \`Bearer \${accessToken}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: { raw } }),
    }
  ).then(r => r.json())

  return { draftId: result.id }
}`,

  'mcp-endpoint.ts': `// MCP HTTP Endpoint — /api/mcp/[token]
// Implements MCP Streamable HTTP transport (spec 2024-11-05)
// Authentication: Bearer token in Authorization header

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // 1. Authenticate via Bearer token
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token?.startsWith('emcp_')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Look up installation from DB by token (service role)
  const installation = await db.installedMcps.findByToken(token)
  if (!installation || installation.status !== 'connected') {
    return NextResponse.json({ error: 'MCP not connected' }, { status: 403 })
  }

  // 3. Refresh OAuth token if expired
  const accessToken = await getValidAccessToken(installation)

  // 4. Handle MCP JSON-RPC message
  const body = await req.json()
  const { method, params, id } = body

  if (method === 'initialize') {
    return mcpResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'gmail-sender', version: '1.0.0' },
    })
  }

  if (method === 'tools/list') {
    return mcpResponse(id, { tools: GMAIL_TOOLS })
  }

  if (method === 'tools/call') {
    const result = await callTool(params.name, params.arguments, accessToken)
    return mcpResponse(id, { content: [{ type: 'text', text: result }] })
  }

  return mcpResponse(id, null, { code: -32601, message: 'Method not found' })
}`,
}
