import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import type { Context, Next } from 'hono'

import { FREE_SHIPPING_AT, SHIPPING_FLAT, SHIPPING_COUNTRIES } from '../src/data/products.js'
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  adminConfigured,
  createSession,
  createUnlockToken,
  isValidSession,
  isValidUnlockToken,
  maintenancePasswordMatches,
  passwordMatches,
  UNLOCK_COOKIE,
} from './auth.js'
import { maintenanceOn, setMaintenance } from './settings.js'
import { createCollection, deleteCollection, listCollections, setCollectionPieces, updateCollection } from './collections.js'
import { readImage, saveImage } from './images.js'
import { listOrders, recordPendingOrder, recordStripeSession, removeOrder, type OrderAddress, type OrderItem } from './orders.js'
import {
  createProduct,
  deleteProduct,
  findProductForSale,
  groupProducts,
  importedDesigns,
  importTapstitchDesigns,
  listProducts,
  setPublished,
  ungroupProducts,
  updateProduct,
  validateProduct,
  type StoredProduct,
} from './catalogue.js'
import { stripeFetch, stripeTaxActive, TAX_CODE_CLOTHING, TAX_CODE_SHIPPING, verifyStripeEvent } from './stripe.js'
import { fetchTapstitchSpecsFor } from './tapstitch.js'
import { readTapstitchExport } from './xlsx.js'

type Env = { Bindings: Record<string, string | undefined> }

type IncomingItem = { slug?: unknown; option?: unknown; color?: unknown; quantity?: unknown }

// A Tapstitch export is ~200 KB; Vercel caps request bodies at 4.5 MB.
const MAX_IMPORT_BYTES = 3 * 1024 * 1024

function decodeUpload(file: unknown): Uint8Array {
  if (typeof file !== 'string' || !file) throw new Error('Choose the .xlsx file Tapstitch exported.')
  const bytes = Buffer.from(file.replace(/^data:[^,]*,/, ''), 'base64')
  if (!bytes.length) throw new Error('That file is empty.')
  if (bytes.length > MAX_IMPORT_BYTES) throw new Error('That file is larger than 3 MB.')
  return new Uint8Array(bytes)
}

type StripeAddress = {
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

type StripeShipping = { name?: string | null; address?: StripeAddress | null } | null

type StripeSession = {
  id?: string
  payment_status?: string
  amount_subtotal?: number
  amount_total?: number
  currency?: string
  total_details?: { amount_discount?: number; amount_shipping?: number; amount_tax?: number } | null
  customer_details?: { email?: string | null; name?: string | null } | null
  // Since API version 2025-03-31 the address lives under collected_information;
  // the two older fields are kept for sessions read with an older version.
  collected_information?: { shipping_details?: StripeShipping } | null
  shipping_details?: StripeShipping
  shipping?: StripeShipping
  line_items?: {
    data?: { description?: string | null; quantity?: number | null; amount_subtotal?: number | null; amount_total?: number | null }[]
  }
}

const MAX_QUANTITY = 10

// Where Stripe sends a buyer who backs out of checkout: the page they came from.
const RETURN_PATHS = ['/', '/shop']

// Stripe events that mean a checkout session may have been paid.
const CHECKOUT_EVENTS = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded'])

// Stripe line items carry the size inside the description ("Heavyweight fleece
// — Size: M"). Split it back out for orders imported without a local snapshot.
function sizeFromDescription(description: string | null | undefined): string | undefined {
  if (!description) return undefined
  const match = /:\s*([^:]+)$/.exec(description)
  return match ? match[1].trim() || undefined : undefined
}

function shippingFrom(session: StripeSession): OrderAddress | null {
  const details = session.collected_information?.shipping_details ?? session.shipping_details ?? session.shipping ?? null
  const address = details?.address
  if (!address) return null
  return {
    name: details?.name ?? session.customer_details?.name ?? null,
    line1: address.line1 ?? null,
    line2: address.line2 ?? null,
    city: address.city ?? null,
    state: address.state ?? null,
    postal_code: address.postal_code ?? null,
    country: address.country ?? null,
  }
}

// Item amounts are before tax and discounts; the receipt lists those separately.
function itemsFrom(session: StripeSession): OrderItem[] {
  return (session.line_items?.data ?? []).map((line) => ({
    name: line.description ?? '',
    size: sizeFromDescription(line.description),
    quantity: line.quantity ?? 1,
    amount: (line.amount_subtotal ?? line.amount_total ?? 0) / 100,
  }))
}

const isPaid = (session: StripeSession) =>
  session.payment_status === 'paid' || session.payment_status === 'no_payment_required'

const env = (key: string) => process.env[key]

// Reads a checkout session from Stripe (never from the browser or the webhook
// body, which could be stale) and saves it as an order.
async function captureSession(key: string, id: string) {
  const response = await stripeFetch(key, `checkout/sessions/${id}?expand[]=line_items`)
  if (!response.ok) return null
  const session = (await response.json()) as StripeSession
  const paid = isPaid(session)
  const shipping = shippingFrom(session)
  const items = itemsFrom(session)
  if (session.id) {
    await recordStripeSession({
      id: session.id,
      paid,
      email: session.customer_details?.email ?? null,
      customerName: session.customer_details?.name ?? shipping?.name ?? null,
      total: (session.amount_total ?? 0) / 100,
      items,
      shipping,
    })
  }
  return { session, paid, shipping, items }
}

// The public catalogue is meant to be read by your existing marketing site too,
// so it answers CORS for an explicit allowlist. Same-origin requests (the shop
// itself, /admin) need no entry here.
function allowedOrigins(): string[] {
  const configured = (env('PUBLIC_SITE_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return configured.length ? configured : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173']
}

async function requireAdmin(c: Context, next: Next) {
  if (!(await isValidSession(getCookie(c, ADMIN_COOKIE)))) return c.json({ error: 'Sign in first.' }, 401)
  await next()
}

export const app = new Hono<Env>()

app.use(
  '/api/*',
  cors({
    origin: (origin) => (origin && allowedOrigins().includes(origin) ? origin : undefined),
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['content-type'],
    credentials: true,
    maxAge: 86400,
  }),
)

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/config', async (c) => {
  const key = env('STRIPE_SECRET_KEY')
  return c.json({
    adminConfigured: adminConfigured(),
    paymentsConfigured: Boolean(key),
    taxEnabled: key ? await stripeTaxActive(key) : false,
    webhookConfigured: Boolean(env('STRIPE_WEBHOOK_SECRET')),
  })
})

// ── Catalogue ────────────────────────────────────────────────────────────────

// ── Maintenance ──────────────────────────────────────────────────────────────

// Visitors with the unlock pass, and a signed-in owner, see the site while it
// is closed; everyone else only gets the lock page.
async function canSeeSite(c: Context): Promise<boolean> {
  if (!(await maintenanceOn())) return true
  if (await isValidUnlockToken(getCookie(c, UNLOCK_COOKIE))) return true
  return isValidSession(getCookie(c, ADMIN_COOKIE))
}

app.get('/api/maintenance', async (c) => c.json({ on: await maintenanceOn(), unlocked: await canSeeSite(c) }))

app.post('/api/maintenance/unlock', async (c) => {
  const body = await c.req.json<{ password?: string }>().catch(() => null)
  if (!maintenancePasswordMatches(body?.password)) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return c.json({ error: 'That password is not right.' }, 401)
  }
  setCookie(c, UNLOCK_COOKIE, await createUnlockToken(), {
    httpOnly: true,
    sameSite: 'Lax',
    secure: new URL(c.req.url).protocol === 'https:',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })
  return c.json({ ok: true })
})

app.post('/api/admin/maintenance', requireAdmin, async (c) => {
  const body = await c.req.json<{ on?: unknown }>().catch(() => null)
  if (typeof body?.on !== 'boolean') return c.json({ error: 'Send { on: true } or { on: false }.' }, 400)
  await setMaintenance(body.on)
  return c.json({ on: body.on })
})

// While closed, the catalogue and checkout answer only to unlocked visitors,
// so the site's data and sales stay shut too, not just its pages.
async function requireOpenSite(c: Context, next: Next) {
  if (!(await canSeeSite(c))) return c.json({ error: 'The shop is closed for maintenance.', code: 'maintenance' }, 503)
  await next()
}
app.use('/api/products', requireOpenSite)
app.use('/api/products/*', requireOpenSite)
app.use('/api/checkout', requireOpenSite)
app.use('/api/collections', requireOpenSite)

app.get('/api/products', async (c) => {
  const includeDrafts = c.req.query('all') === '1' && (await isValidSession(getCookie(c, ADMIN_COOKIE)))
  return c.json({ products: await listProducts(includeDrafts) })
})

app.get('/api/products/:slug', async (c) => {
  const product = await findProductForSale(c.req.param('slug') ?? '')
  if (!product) return c.json({ error: 'Not found.' }, 404)
  return c.json({ product })
})

// ── Collections ──────────────────────────────────────────────────────────────

app.get('/api/collections', async (c) => c.json({ collections: await listCollections() }))

app.post('/api/admin/collections', requireAdmin, async (c) => {
  const body = await c.req.json<{ name?: unknown; description?: unknown }>().catch(() => ({}))
  try {
    return c.json({ collection: await createCollection(body ?? {}) }, 201)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Could not create that collection.' }, 400)
  }
})

app.patch('/api/admin/collections/:slug', requireAdmin, async (c) => {
  const body = await c.req.json<{ name?: unknown; description?: unknown }>().catch(() => ({}))
  try {
    const found = await updateCollection(c.req.param('slug') ?? '', body ?? {})
    return found ? c.json({ ok: true }) : c.json({ error: 'That collection no longer exists.' }, 404)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Could not save that collection.' }, 400)
  }
})

app.delete('/api/admin/collections/:slug', requireAdmin, async (c) => {
  const removed = await deleteCollection(c.req.param('slug') ?? '')
  return removed ? c.json({ ok: true }) : c.json({ error: 'That collection no longer exists.' }, 404)
})

app.post('/api/admin/collections/:slug/pieces', requireAdmin, async (c) => {
  const body = await c.req.json<{ add?: unknown; remove?: unknown }>().catch(() => null)
  const list = (value: unknown) => (Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string').slice(0, 500) : [])
  const found = await setCollectionPieces(c.req.param('slug') ?? '', list(body?.add), list(body?.remove))
  return found ? c.json({ ok: true }) : c.json({ error: 'That collection no longer exists.' }, 404)
})

// Shows several pieces as one product (each piece becomes a colour of `lead`).
app.post('/api/admin/products/group', requireAdmin, async (c) => {
  const body = await c.req.json<{ lead?: unknown; members?: unknown }>().catch(() => null)
  const lead = typeof body?.lead === 'string' ? body.lead : ''
  const members = Array.isArray(body?.members) ? body.members.filter((s): s is string => typeof s === 'string').slice(0, 50) : []
  if (!lead || !members.length) return c.json({ error: 'Pick the piece to show and at least one other piece.' }, 400)
  try {
    return c.json(await groupProducts(lead, members))
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Could not group those pieces.' }, 400)
  }
})

app.post('/api/admin/products/ungroup', requireAdmin, async (c) => {
  const body = await c.req.json<{ slugs?: unknown }>().catch(() => null)
  const slugs = Array.isArray(body?.slugs) ? body.slugs.filter((s): s is string => typeof s === 'string').slice(0, 100) : []
  if (!slugs.length) return c.json({ error: 'Select at least one piece.' }, 400)
  await ungroupProducts(slugs)
  return c.json({ ok: true })
})

// ── Admin ────────────────────────────────────────────────────────────────────

app.get('/api/admin/me', async (c) => c.json({ admin: await isValidSession(getCookie(c, ADMIN_COOKIE)) }))

app.post('/api/admin/login', async (c) => {
  if (!adminConfigured()) return c.json({ error: 'Set ADMIN_PASSWORD in the environment before signing in.', code: 'admin_not_configured' }, 503)
  const body = await c.req.json<{ password?: string }>().catch(() => null)
  if (!body?.password) return c.json({ error: 'Enter the admin password.' }, 400)
  if (!passwordMatches(body.password)) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return c.json({ error: 'That password is not right.' }, 401)
  }
  setCookie(c, ADMIN_COOKIE, await createSession(), {
    httpOnly: true,
    sameSite: 'Lax',
    secure: new URL(c.req.url).protocol === 'https:',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })
  return c.json({ ok: true })
})

// Signing out ends every pass this browser holds, so it is locked out of the
// site too while maintenance is on.
app.post('/api/admin/logout', (c) => {
  deleteCookie(c, ADMIN_COOKIE, { path: '/' })
  deleteCookie(c, UNLOCK_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

app.post('/api/products', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = validateProduct(body)
  if (!parsed.ok || !parsed.value) return c.json({ error: parsed.error ?? 'Check the product details.' }, 400)
  try {
    return c.json({ product: await createProduct(parsed.value) }, 201)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Could not save that product.' }, 409)
  }
})

app.patch('/api/products/:slug', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = validateProduct(body)
  if (!parsed.ok || !parsed.value) return c.json({ error: parsed.error ?? 'Check the product details.' }, 400)
  try {
    return c.json({ product: await updateProduct(c.req.param('slug') ?? '', parsed.value) })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Could not save that product.' }, 409)
  }
})

app.delete('/api/products/:slug', requireAdmin, async (c) => {
  const removed = await deleteProduct(c.req.param('slug') ?? '')
  return removed ? c.json({ ok: true }) : c.json({ error: 'That product no longer exists.' }, 404)
})

// Go live / back to draft / remove for several pieces at once.
app.post('/api/admin/products/bulk', requireAdmin, async (c) => {
  const body = await c.req.json<{ action?: unknown; slugs?: unknown }>().catch(() => null)
  const slugs = Array.isArray(body?.slugs) ? body.slugs.filter((s): s is string => typeof s === 'string').slice(0, 500) : []
  if (!slugs.length) return c.json({ error: 'Select at least one piece.' }, 400)

  if (body?.action === 'publish' || body?.action === 'unpublish') {
    return c.json(await setPublished(slugs, body.action === 'publish'))
  }
  if (body?.action === 'delete') {
    const removed: string[] = []
    for (const slug of slugs) if (await deleteProduct(slug)) removed.push(slug)
    return c.json({ removed })
  }
  return c.json({ error: 'Unknown action.' }, 400)
})

// ── Tapstitch import ─────────────────────────────────────────────────────────

// Reads the export and says, per design, whether it is new or already in the
// shop. Nothing is saved until the owner confirms with the route below.
app.post('/api/admin/import/tapstitch/preview', requireAdmin, async (c) => {
  const body = await c.req.json<{ file?: unknown }>().catch(() => null)
  try {
    const designs = readTapstitchExport(decodeUpload(body?.file))
    const existing = await importedDesigns()
    return c.json({ designs: designs.map((design) => ({ ...design, existing: existing.get(design.designId) ?? null })) })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Could not read that file.' }, 400)
  }
})

// The file is sent again with the chosen design IDs and read on the server,
// so what gets saved always comes from the export itself.
app.post('/api/admin/import/tapstitch', requireAdmin, async (c) => {
  const body = await c.req.json<{ file?: unknown; designIds?: unknown }>().catch(() => null)
  const chosen = new Set(Array.isArray(body?.designIds) ? body.designIds.filter((id): id is string => typeof id === 'string') : [])
  if (!chosen.size) return c.json({ error: 'Select at least one design to import.' }, 400)
  try {
    const designs = readTapstitchExport(decodeUpload(body?.file)).filter((design) => chosen.has(design.designId))
    // Best effort: a design Tapstitch's catalogue can't describe still imports.
    const specs = await fetchTapstitchSpecsFor(designs.map((design) => design.productCode))
    const result = await importTapstitchDesigns(designs, async (dataUrl) => (await saveImage(dataUrl)).url, specs)
    return c.json(result)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Could not import that file.' }, 400)
  }
})

// ── Images ───────────────────────────────────────────────────────────────────

app.post('/api/admin/images', requireAdmin, async (c) => {
  const body = await c.req.json<{ dataUrl?: unknown }>().catch(() => null)
  const dataUrl = typeof body?.dataUrl === 'string' ? body.dataUrl : ''
  if (!dataUrl) return c.json({ error: 'Choose an image first.' }, 400)
  try {
    return c.json(await saveImage(dataUrl), 201)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Could not save that image.' }, 400)
  }
})

app.get('/api/images/:id', async (c) => {
  const image = await readImage(c.req.param('id') ?? '')
  if (!image) return c.json({ error: 'Not found.' }, 404)
  // Content is immutable per id, so the CDN and browsers can keep it for good.
  return new Response(image.bytes, {
    status: 200,
    headers: {
      'content-type': image.mime,
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
})

// ── Orders ───────────────────────────────────────────────────────────────────

app.get('/api/admin/orders', requireAdmin, async (c) => c.json({ orders: await listOrders() }))

// For orders cancelled or refunded in Stripe. Refunds still happen in Stripe;
// this only takes the order off the fulfilment list.
app.delete('/api/admin/orders/:id', requireAdmin, async (c) => {
  const removed = await removeOrder(c.req.param('id') ?? '')
  return removed ? c.json({ ok: true }) : c.json({ error: 'That order is already gone.' }, 404)
})

// Checkout capture can miss an order if the buyer closes the tab before Stripe
// redirects them back, so the owner can pull the last 50 paid sessions instead.
app.post('/api/admin/orders/sync', requireAdmin, async (c) => {
  const key = env('STRIPE_SECRET_KEY')
  if (!key) return c.json({ error: 'Add STRIPE_SECRET_KEY before importing orders.', code: 'stripe_not_configured' }, 503)

  const response = await stripeFetch(key, 'checkout/sessions?limit=50&status=complete&expand[]=data.line_items')
  if (!response.ok) return c.json({ error: 'Stripe did not return your orders.' }, 502)

  const body = (await response.json()) as { data?: StripeSession[] }
  let imported = 0
  for (const session of body.data ?? []) {
    if (!session.id || !isPaid(session)) continue
    const shipping = shippingFrom(session)
    await recordStripeSession({
      id: session.id,
      paid: true,
      email: session.customer_details?.email ?? null,
      customerName: session.customer_details?.name ?? shipping?.name ?? null,
      total: (session.amount_total ?? 0) / 100,
      shipping,
      items: itemsFrom(session),
    })
    imported += 1
  }
  return c.json({ ok: true, imported })
})

// ── Checkout ─────────────────────────────────────────────────────────────────

app.post('/api/checkout', async (c) => {
  const key = env('STRIPE_SECRET_KEY')
  if (!key) {
    return c.json({ error: 'Payments are not connected yet. Add STRIPE_SECRET_KEY and try again.', code: 'stripe_not_configured' }, 503)
  }

  const body = await c.req.json<{ items?: IncomingItem[]; returnPath?: unknown }>().catch(() => null)
  if (!body?.items?.length) return c.json({ error: 'Your bag is empty.' }, 400)
  const returnPath = typeof body.returnPath === 'string' && RETURN_PATHS.includes(body.returnPath) ? body.returnPath : '/shop'

  type Line = { product: StoredProduct; quantity: number; option?: string; color?: NonNullable<StoredProduct['colors']>[number] }
  const lines: Line[] = []
  for (const item of body.items) {
    const slug = typeof item.slug === 'string' ? item.slug : ''
    // Grouped pieces are sold through their lead, as one of its colours.
    const product = await findProductForSale(slug)
    if (!product || product.price < 1) {
      return c.json({ error: 'One of the pieces in your bag is no longer available.' }, 400)
    }
    const quantity = Math.trunc(Number(item.quantity))
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return c.json({ error: `Quantities must be between 1 and ${MAX_QUANTITY}.` }, 400)
    }

    // A piece with colours needs one, except when it only comes in one.
    const colors = product.colors ?? []
    const color = colors.find((entry) => entry.name === item.color) ?? (colors.length === 1 ? colors[0] : undefined)
    if (colors.length && !color) return c.json({ error: `Choose a colour for ${product.name}.` }, 400)

    const option = product.options
      ? product.options.values.find((value) => value === item.option) ?? product.defaultOption ?? product.options.values[0]
      : undefined
    // Tapstitch does not make every size in every colour.
    if (color?.sizes?.length && option && !color.sizes.includes(option)) {
      return c.json({ error: `${product.name} in ${color.name} is not made in size ${option}.` }, 400)
    }
    lines.push({ product, quantity, option, color })
  }

  const form = new URLSearchParams()
  let subtotal = 0

  // Prices are tax-exclusive (US style): Stripe Tax adds tax on top at checkout,
  // worked out from the shipping address once Tax is active on the account.
  lines.forEach(({ product, quantity, option, color }, index) => {
    subtotal += product.price * quantity
    const prefix = `line_items[${index}]`
    form.set(`${prefix}[quantity]`, String(quantity))
    form.set(`${prefix}[price_data][currency]`, 'usd')
    form.set(`${prefix}[price_data][unit_amount]`, String(Math.round(product.price * 100)))
    form.set(`${prefix}[price_data][tax_behavior]`, 'exclusive')
    form.set(`${prefix}[price_data][product_data][name]`, product.name)
    // Shown to the buyer on Stripe's page. Stripe rejects an empty description,
    // and imported pieces start without a subtitle.
    const variant = [color && `Color: ${color.name}`, option && product.options && `${product.options.name}: ${option}`].filter(Boolean).join(', ')
    const description = [product.short, variant].filter(Boolean).join(' — ')
    if (description) form.set(`${prefix}[price_data][product_data][description]`, description)
    form.set(`${prefix}[price_data][product_data][tax_code]`, TAX_CODE_CLOTHING)
    form.set(`${prefix}[price_data][product_data][metadata][slug]`, product.slug)
    form.set(`${prefix}[price_data][product_data][metadata][variant]`, option ?? '')
    form.set(`${prefix}[price_data][product_data][metadata][color]`, color?.name ?? '')
  })

  // Shipping is a shipping rate, not a line item, so Stripe Tax can apply each
  // state's own rule for taxing delivery charges.
  const shippingCost = subtotal < FREE_SHIPPING_AT ? SHIPPING_FLAT : 0
  const rate = 'shipping_options[0][shipping_rate_data]'
  form.set(`${rate}[type]`, 'fixed_amount')
  form.set(`${rate}[display_name]`, shippingCost ? `Standard shipping (free over $${FREE_SHIPPING_AT})` : 'Free shipping')
  form.set(`${rate}[fixed_amount][amount]`, String(shippingCost * 100))
  form.set(`${rate}[fixed_amount][currency]`, 'usd')
  form.set(`${rate}[tax_behavior]`, 'exclusive')
  form.set(`${rate}[tax_code]`, TAX_CODE_SHIPPING)

  if (await stripeTaxActive(key)) form.set('automatic_tax[enabled]', 'true')

  // Everything needed to place the order in Tapstitch by hand travels with it.
  const orderItems: OrderItem[] = lines.map(({ product, quantity, option, color }) => ({
    slug: product.slug,
    name: product.name,
    size: option,
    color: color?.name,
    quantity,
    amount: product.price * quantity,
    // In a group, the colour carries the Tapstitch link of the exact piece bought.
    tapstitch: (color?.tapstitch ?? product.tapstitch)
      ? {
          designId: (color?.tapstitch ?? product.tapstitch)!.designId,
          productCode: (color?.tapstitch ?? product.tapstitch)!.productCode,
          colorId: color?.id,
        }
      : undefined,
  }))
  // Before tax; replaced by Stripe's final total once the order is paid.
  const orderTotal = subtotal + shippingCost

  const origin = new URL(c.req.url).origin
  form.set('mode', 'payment')
  form.set('success_url', `${origin}/order/confirmed?session_id={CHECKOUT_SESSION_ID}`)
  form.set('cancel_url', `${origin}${returnPath}`)
  form.set('allow_promotion_codes', 'true')
  form.set('billing_address_collection', 'auto')
  form.set('metadata[brand]', '9inetailss')
  SHIPPING_COUNTRIES.forEach((country, i) => form.set(`shipping_address_collection[allowed_countries][${i}]`, country))

  const response = await stripeFetch(key, 'checkout/sessions', { method: 'POST', body: form })
  const session = (await response.json()) as StripeSession & { url?: string; error?: { message?: string } }

  if (!response.ok || !session.url) {
    console.error('Stripe checkout session failed', response.status, session.error?.message)
    return c.json({ error: 'We could not start checkout. Please try again in a moment.' }, 502)
  }

  // Record the pieces and sizes now: the buyer may never return to the site, and
  // the owner needs the sizes regardless of what Stripe's line text says.
  if (session.id) await recordPendingOrder(session.id, orderItems, orderTotal)

  return c.json({ url: session.url })
})

app.get('/api/orders/session', async (c) => {
  const key = env('STRIPE_SECRET_KEY')
  if (!key) return c.json({ error: 'Payments are not connected yet.', code: 'stripe_not_configured' }, 503)

  const id = c.req.query('id') ?? ''
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return c.json({ error: 'Unknown order.' }, 400)

  // The buyer landing here is one of two ways an order is marked paid; the
  // webhook below is the other, for buyers who close the tab first.
  const captured = await captureSession(key, id)
  if (!captured) return c.json({ error: 'Unknown order.' }, 404)

  const { session, paid, shipping, items } = captured
  const cents = (value: number | undefined) => (value ?? 0) / 100
  return c.json({
    paid,
    email: session.customer_details?.email ?? null,
    subtotal: cents(session.amount_subtotal),
    discount: cents(session.total_details?.amount_discount),
    shippingCost: cents(session.total_details?.amount_shipping),
    tax: cents(session.total_details?.amount_tax),
    total: cents(session.amount_total),
    shipping,
    items,
  })
})

// Stripe calls this when a checkout finishes (Dashboard → Developers → Webhooks,
// events checkout.session.completed and checkout.session.async_payment_succeeded).
// It marks the order paid even if the buyer never comes back to the site.
app.post('/api/stripe/webhook', async (c) => {
  const key = env('STRIPE_SECRET_KEY')
  const secret = env('STRIPE_WEBHOOK_SECRET')
  if (!key || !secret) return c.json({ error: 'Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET first.' }, 503)

  const event = verifyStripeEvent(await c.req.text(), c.req.header('stripe-signature'), secret)
  if (!event) return c.json({ error: 'Invalid signature.' }, 400)

  const object = event.data?.object
  if (CHECKOUT_EVENTS.has(event.type) && object?.object === 'checkout.session' && object.id) {
    // A non-2xx answer makes Stripe retry the event later.
    if (!(await captureSession(key, object.id))) return c.json({ error: 'Could not read that checkout session.' }, 500)
  }
  return c.json({ received: true })
})

app.post('/api/newsletter', async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({}) as { email?: string })
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return c.json({ error: 'Enter a valid email address.' }, 400)
  return c.json({ ok: true })
})

app.notFound((c) => c.json({ error: 'Not found.' }, 404))
