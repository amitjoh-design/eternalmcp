import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const key = process.env.MCP_ENCRYPTION_KEY
  if (!key) throw new Error('MCP_ENCRYPTION_KEY env var is not set')
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== 32) throw new Error('MCP_ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
  return buf
}

// Encrypt a string → returns hex string: iv(32) + authTag(32) + ciphertext
export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return iv.toString('hex') + authTag.toString('hex') + encrypted.toString('hex')
}

// Decrypt hex string → plaintext
export function decryptToken(data: string): string {
  const key = getKey()
  const iv = Buffer.from(data.slice(0, 32), 'hex')
  const authTag = Buffer.from(data.slice(32, 64), 'hex')
  const encrypted = Buffer.from(data.slice(64), 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

// Generate a unique MCP bearer token
export function generateMcpToken(): string {
  return 'emcp_' + randomBytes(20).toString('hex')
}

// Generate a random encryption key (run once, store in env)
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}
