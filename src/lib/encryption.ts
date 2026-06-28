import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY_HEX = process.env.ENCRYPTION_KEY || '6c9f6d4d1685514f7b2c5890c23674681f9a2e6f4b2383c21a4f5b682d3e9112' // fallback 32-byte hex key for safety

export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null
  try {
    const iv = crypto.randomBytes(16)
    const key = Buffer.from(KEY_HEX, 'hex')
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  } catch (err) {
    console.error('[Encryption failed]:', err)
    return text // fallback to plaintext
  }
}

export function decrypt(hash: string | null | undefined): string | null {
  if (!hash) return null
  if (!hash.includes(':')) return hash // legacy plaintext fallback
  try {
    const parts = hash.split(':')
    const iv = Buffer.from(parts.shift()!, 'hex')
    const encryptedText = Buffer.from(parts.join(':'), 'hex')
    const key = Buffer.from(KEY_HEX, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch (err) {
    console.error('[Decryption failed]:', err)
    return hash // fallback to raw string if key mismatches (e.g. for mock tokens)
  }
}
