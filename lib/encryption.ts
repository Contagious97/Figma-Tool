import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_HEX = process.env.ENCRYPTION_KEY!
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// Validate encryption key exists and has correct length
if (!KEY_HEX) {
  throw new Error('ENCRYPTION_KEY environment variable is required')
}

if (KEY_HEX.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
}

const KEY = Buffer.from(KEY_HEX, 'hex')

/**
 * Encrypts a Figma token using AES-256-GCM
 * @param token - The plaintext Figma token to encrypt
 * @returns Encrypted token in format: iv:authTag:encryptedData (all hex)
 */
export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:encryptedData (all hex-encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts an encrypted Figma token
 * @param encryptedToken - Encrypted token in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext token
 * @throws Error if token format is invalid or decryption fails
 */
export function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }

  const [ivHex, authTagHex, encrypted] = parts

  try {
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error('Failed to decrypt token - token may be corrupted')
  }
}

/**
 * Generates a new encryption key (for setup)
 * Run this once to generate ENCRYPTION_KEY for .env file
 * @returns 64-character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validates that a string is a properly formatted Figma token
 * @param token - The token to validate
 * @returns True if token appears to be a valid Figma PAT
 */
export function isValidFigmaTokenFormat(token: string): boolean {
  // Figma Personal Access Tokens start with "figd_" and are typically 40-50 chars
  return token.startsWith('figd_') && token.length >= 20
}
