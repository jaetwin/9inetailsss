import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import type { Context, Next } from 'hono'

import { FREE_SHIPPING_AT, SHIPPING_FLAT, SHIPPING_COUNTRIES } from '../src/data/products'
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, adminConfigured, createSession, isValidSession, passwordMatches } from './auth'
import { readImage, saveImage } from './images'
import { listOrders, recordPendingOrder, recordStripeSession, type OrderAddress, type OrderItem } from './orders'
import { createProduct, deleteProduct, findProduct, listProducts, updateProduct, validateProduct, type StoredProduct } from './catalogue'

type Env = { Bindings: Record<string, string | undefined> }

type IncomingItem = { slug?: unknown; option?: unknown; quantity?: unknown }

type StripeAddress = {
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

type StripeSession = {
  id?: string
  payment_status?: string
  amount_total?: number
  currency?: string
  customer_details?: { email?: string | null; name?: string | null } | null
  shipping_details?: { name?: string | null; address?: StripeAddress | null } | null
  shipping?: { name?: string | null; address?: StripeAddress | null } | null
  line_items?: { data?: { description?: string | null; quantity?: number | null; amount_total?: number | null }[] }
}

const MAX_QUANTITY = 10

// Stripe line items carry the size inside the description ("Heavyweight fleece
// — Size: M"). Split it back out for orders imported without a local snapshot.
function sizeFromDescription(description: string | null | undefined): string | undefined {
  if (!description) return undefined
  const match = /:\s*([^:]+)$/.exec(description)
  return match ? match[1].trim() || undefined : undefined
}

function shippingFrom(session: StripeSession): OrderAddress | null {
  const details = session.shipping_details ?? session.shipping ?? null
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

const env = (key: string) => process.env[key]

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

const stripeHeaders = (key: string) => ({
  authorization: `Bearer ${key}`,
  'content-type': 'application/x-www-form-urlencoded',
})

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

app.get('/api/config', (c) =>
  c.json({
    adminConfigured: adminConfigured(),
    paymentsConfigured: Boolean(env('STRIPE_SECRET_KEY')),
  }),
)

// ── Catalogue ────────────────────────────────────────────────────────────────

app.get('/api/products', async (c) => {
  const includeDrafts = c.req.query('all') === '1' && (await isValidSession(getCookie(c, ADMIN_COOKIE)))
  return c.json({ products: await listProducts(includeDrafts) })
})

app.get('/api/products/:slug', async (c) => {
  const product = await findProduct(c.req.param('slug') ?? '')
  if (!product || !product.published) return c.json({ error: 'Not found.' }, 404)
  return c.json({ product })
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

app.post('/api/admin/logout', (c) => {
  deleteCookie(c, ADMIN_COOKIE, { path: '/' })
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

// Checkout capture can miss an order if the buyer closes the tab before Stripe
// redirects them back, so the owner can pull the last 50 paid sessions instead.
app.post('/api/admin/orders/sync', requireAdmin, async (c) => {
  const key = env('STRIPE_SECRET_KEY')
  if (!key) return c.json({ error: 'Add STRIPE_SECRET_KEY before importing orders.', code: 'stripe_not_configured' }, 503)

  const response = await fetch(
    'https://api.stripe.com/v1/checkout/sessions?limit=50&status=complete&expand[]=data.line_items',
    { headers: { authorization: `Bearer ${key}` } },
  )
  if (!response.ok) return c.json({ error: 'Stripe did not return your orders.' }, 502)

  const body = (await response.json()) as { data?: StripeSession[] }
  let imported = 0
  for (const session of body.data ?? []) {
    if (!session.id || session.payment_status !== 'paid') continue
    const shipping = shippingFrom(session)
    await recordStripeSession({
      id: session.id,
      paid: true,
      email: session.customer_details?.email ?? null,
      customerName: session.customer_details?.name ?? shipping?.name ?? null,
      total: (session.amount_total ?? 0) / 100,
      shipping,
      items: (session.line_items?.data ?? []).map((line) => ({
        name: line.description ?? '',
        size: sizeFromDescription(line.description),
        quantity: line.quantity ?? 1,
        amount: (line.amount_total ?? 0) / 100,
      })),
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

  const body = await c.req.json<{ items?: IncomingItem[] }>().catch(() => null)
  if (!body?.items?.length) return c.json({ error: 'Your bag is empty.' }, 400)

  const lines: { product: StoredProduct; quantity: number; option?: string }[] = []
  for (const item of body.items) {
    const slug = typeof item.slug === 'string' ? item.slug : ''
    const product = await findProduct(slug)
    if (!product || !product.published) return c.json({ error: 'One of the pieces in your bag is no longer available.' }, 400)
    const quantity = Math.trunc(Number(item.quantity))
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return c.json({ error: `Quantities must be between 1 and ${MAX_QUANTITY}.` }, 400)
    }
    const option = product.options
      ? product.options.values.find((value) => value === item.option) ?? product.defaultOption ?? product.options.values[0]
      : undefined
    lines.push({ product, quantity, option })
  }

  const form = new URLSearchParams()
  let subtotal = 0
  let index = 0

  for (const { product, quantity, option } of lines) {
    subtotal += product.price * quantity
    const prefix = `line_items[${index}]`
    form.set(`${prefix}[quantity]`, String(quantity))
    form.set(`${prefix}[price_data][currency]`, 'usd')
    form.set(`${prefix}[price_data][unit_amount]`, String(Math.round(product.price * 100)))
    form.set(`${prefix}[price_data][product_data][name]`, product.name)
    form.set(
      `${prefix}[price_data][product_data][description]`,
      option && product.options ? `${product.short} — ${product.options.name}: ${option}` : product.short,
    )
    form.set(`${prefix}[price_data][product_data][metadata][slug]`, product.slug)
    form.set(`${prefix}[price_data][product_data][metadata][variant]`, option ?? '')
    index += 1
  }

  if (subtotal < FREE_SHIPPING_AT) {
    const prefix = `line_items[${index}]`
    form.set(`${prefix}[quantity]`, '1')
    form.set(`${prefix}[price_data][currency]`, 'usd')
    form.set(`${prefix}[price_data][unit_amount]`, String(SHIPPING_FLAT * 100))
    form.set(`${prefix}[price_data][product_data][name]`, 'Shipping')
    form.set(`${prefix}[price_data][product_data][description]`, `Flat rate, free over $${FREE_SHIPPING_AT}`)
    index += 1
  }

  const orderItems: OrderItem[] = lines.map(({ product, quantity, option }) => ({
    slug: product.slug,
    name: product.name,
    size: option,
    quantity,
    amount: product.price * quantity,
  }))
  const orderTotal = subtotal + (subtotal < FREE_SHIPPING_AT ? SHIPPING_FLAT : 0)

  const origin = new URL(c.req.url).origin
  form.set('mode', 'payment')
  form.set('success_url', `${origin}/order/confirmed?session_id={CHECKOUT_SESSION_ID}`)
  form.set('cancel_url', `${origin}/checkout`)
  form.set('allow_promotion_codes', 'true')
  form.set('billing_address_collection', 'auto')
  form.set('metadata[brand]', '9inetailss')
  SHIPPING_COUNTRIES.forEach((country, i) => form.set(`shipping_address_collection[allowed_countries][${i}]`, country))

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: stripeHeaders(key),
    body: form,
  })
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

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}?expand[]=line_items`, {
    headers: { authorization: `Bearer ${key}` },
  })
  if (!response.ok) return c.json({ error: 'Unknown order.' }, 404)

  const session = (await response.json()) as StripeSession
  const paid = session.payment_status === 'paid'
  const shipping = shippingFrom(session)
  const stripeItems: OrderItem[] = (session.line_items?.data ?? []).map((line) => ({
    name: line.description ?? '',
    size: sizeFromDescription(line.description),
    quantity: line.quantity ?? 1,
    amount: (line.amount_total ?? 0) / 100,
  }))

  // This is the reliable moment to capture a paid order: Stripe has redirected
  // the buyer here, and the session carries the shipping address it collected.
  if (session.id) {
    await recordStripeSession({
      id: session.id,
      paid,
      email: session.customer_details?.email ?? null,
      customerName: session.customer_details?.name ?? shipping?.name ?? null,
      total: (session.amount_total ?? 0) / 100,
      items: stripeItems,
      shipping,
    })
  }

  return c.json({ paid, email: session.customer_details?.email ?? null, total: (session.amount_total ?? 0) / 100, shipping, items: stripeItems })
})

app.post('/api/newsletter', async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({}) as { email?: string })
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return c.json({ error: 'Enter a valid email address.' }, 400)
  return c.json({ ok: true })
})

app.notFound((c) => c.json({ error: 'Not found.' }, 404))
