import { createHmac, timingSafeEqual } from 'node:crypto'

// Stripe is called over plain REST (no SDK), so the API version is pinned here.
// Without the pin, every request uses the account's default version, and an
// upgrade in the Dashboard could silently change the shape of the responses.
export const STRIPE_API_VERSION = '2026-10-28.endive'

// Stripe Tax product codes: https://docs.stripe.com/tax/tax-codes
export const TAX_CODE_CLOTHING = 'txcd_30011000' // Clothing & Footwear
export const TAX_CODE_SHIPPING = 'txcd_92010001' // Shipping

export function stripeFetch(key: string, path: string, init: { method?: string; body?: URLSearchParams } = {}) {
  return fetch(`https://api.stripe.com/v1/${path}`, {
    method: init.method ?? 'GET',
    headers: {
      authorization: `Bearer ${key}`,
      'stripe-version': STRIPE_API_VERSION,
      ...(init.body ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: init.body,
  })
}

// Stripe rejects `automatic_tax` until Tax is set up in the Dashboard (head
// office address at minimum). Asking first keeps checkout working before then;
// the answer is cached so a busy shop does not ask on every checkout.
const TAX_STATUS_TTL_MS = 5 * 60 * 1000
let taxStatus: { key: string; active: boolean; checkedAt: number } | null = null

export async function stripeTaxActive(key: string): Promise<boolean> {
  if (taxStatus && taxStatus.key === key && Date.now() - taxStatus.checkedAt < TAX_STATUS_TTL_MS) return taxStatus.active
  try {
    const response = await stripeFetch(key, 'tax/settings')
    const body = (await response.json()) as { status?: string }
    const active = response.ok && body.status === 'active'
    taxStatus = { key, active, checkedAt: Date.now() }
    if (!active) console.warn('Stripe Tax is not active: checkout runs without tax until it is set up in the Dashboard.')
    return active
  } catch {
    // A failed check should not block a sale; it is retried on the next checkout.
    return false
  }
}

export interface StripeEvent {
  id: string
  type: string
  data: { object: { id?: string; object?: string; payment_status?: string } }
}

const SIGNATURE_TOLERANCE_SECONDS = 300

/**
 * Checks the `Stripe-Signature` header against the raw request body
 * (https://docs.stripe.com/webhooks#verify-manually). Returns the event only
 * when the signature matches and is recent; anything else is rejected.
 */
export function verifyStripeEvent(rawBody: string, header: string | undefined, secret: string): StripeEvent | null {
  if (!header) return null
  let timestamp = ''
  const signatures: string[] = []
  for (const part of header.split(',')) {
    const [name, value] = part.split('=', 2)
    if (name === 't') timestamp = value ?? ''
    if (name === 'v1' && value) signatures.push(value)
  }
  const seconds = Number(timestamp)
  if (!timestamp || !Number.isFinite(seconds) || !signatures.length) return null
  if (Math.abs(Date.now() / 1000 - seconds) > SIGNATURE_TOLERANCE_SECONDS) return null

  const expected = Buffer.from(createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex'), 'utf8')
  const matches = signatures.some((signature) => {
    const given = Buffer.from(signature, 'utf8')
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
  if (!matches) return null

  try {
    return JSON.parse(rawBody) as StripeEvent
  } catch {
    return null
  }
}
