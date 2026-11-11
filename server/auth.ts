// Owner authentication: one password, one signed cookie. Enough for a
// single-person shop; swap for a real identity provider when you add staff.
const COOKIE = 'n9_admin'
export const ADMIN_COOKIE = COOKIE
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const encoder = new TextEncoder()

function secret(): string {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'development-only-secret'
}

async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

async function sign(payload: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await key(), encoder.encode(payload))
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function equals(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createSession(): Promise<string> {
  const expires = String(Date.now() + ADMIN_COOKIE_MAX_AGE * 1000)
  return `${expires}.${await sign(expires)}`
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const [expires, signature] = token.split('.')
  if (!expires || !signature) return false
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false
  return equals(signature, await sign(expires))
}

export function passwordMatches(input: string | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || !input) return false
  return equals(input, expected)
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD)
}
