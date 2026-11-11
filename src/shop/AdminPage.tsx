import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { CATEGORY_KEYS, CATEGORY_LABELS, type Category } from '../data/products'

// Owner-only catalogue admin, styled in the site's own language (void, bone,
// whisper, gold) rather than a bolted-on dashboard.
interface StoredProduct {
  slug: string
  name: string
  price: number
  compareAt?: number
  category: Category
  image: string
  badge?: 'New' | 'Bestseller' | 'Low stock'
  short: string
  description: string
  details: string[]
  materials: string
  options?: { name: string; values: string[] }
  defaultOption?: string
  featured?: boolean
  published?: boolean
}

interface AdminOrder {
  id: string
  status: 'pending' | 'paid'
  email: string | null
  customerName: string | null
  total: number
  currency: string
  items: { slug?: string; name: string; size?: string; quantity: number; amount: number }[]
  shipping: {
    name?: string | null
    line1?: string | null
    line2?: string | null
    city?: string | null
    state?: string | null
    postal_code?: string | null
    country?: string | null
  } | null
  createdAt: number
  paidAt: number | null
}

type Draft = {
  name: string
  slug: string
  price: string
  compareAt: string
  category: Category
  image: string
  badge: '' | NonNullable<StoredProduct['badge']>
  short: string
  description: string
  details: string
  materials: string
  optionName: string
  optionValues: string
  defaultOption: string
  featured: boolean
  published: boolean
}

const emptyDraft = (): Draft => ({
  name: '',
  slug: '',
  price: '',
  compareAt: '',
  category: 'tees',
  image: '',
  badge: '',
  short: '',
  description: '',
  details: '',
  materials: '',
  optionName: 'Size',
  optionValues: 'S, M, L, XL, XXL',
  defaultOption: 'M',
  featured: false,
  published: true,
})

const toDraft = (product: StoredProduct): Draft => ({
  name: product.name,
  slug: product.slug,
  price: String(product.price),
  compareAt: product.compareAt ? String(product.compareAt) : '',
  category: product.category,
  image: product.image,
  badge: product.badge ?? '',
  short: product.short,
  description: product.description,
  details: product.details.join('\n'),
  materials: product.materials,
  optionName: product.options?.name ?? '',
  optionValues: product.options?.values.join(', ') ?? '',
  defaultOption: product.defaultOption ?? '',
  featured: Boolean(product.featured),
  published: product.published !== false,
})

const toPayload = (draft: Draft) => ({
  name: draft.name,
  slug: draft.slug || draft.name,
  price: Number(draft.price),
  compareAt: draft.compareAt ? Number(draft.compareAt) : undefined,
  category: draft.category,
  image: draft.image,
  badge: draft.badge || undefined,
  short: draft.short,
  description: draft.description,
  details: draft.details.split('\n').map((line) => line.trim()).filter(Boolean),
  materials: draft.materials,
  optionName: draft.optionName,
  optionValues: draft.optionValues.split(',').map((value) => value.trim()).filter(Boolean),
  defaultOption: draft.defaultOption,
  featured: draft.featured,
  published: draft.published,
})

const money = (value: number) => `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`
const money2 = (value: number) => `$${value.toFixed(2)}`
const formatDate = (value: number) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

// Tapstitch takes orders by hand, so hand the owner one block they can paste.
function tapstitchText(order: AdminOrder): string {
  const placed = formatDate(order.paidAt ?? order.createdAt)
  const address = order.shipping
    ? [
        order.shipping.name,
        order.shipping.line1,
        order.shipping.line2,
        [order.shipping.city, order.shipping.state, order.shipping.postal_code].filter(Boolean).join(', '),
        order.shipping.country,
      ]
        .filter(Boolean)
        .join('\n')
    : 'Address not captured'

  return [
    '9INETAILSS — PAID ORDER',
    `${placed} · ${order.total.toFixed(2)} USD · ${order.email ?? 'no email'}`,
    '',
    ...order.items.map((item) => `${item.name}${item.size ? ` — ${item.size}` : ''} × ${item.quantity}`),
    '',
    'SHIP TO',
    address,
    '',
    `Stripe reference: ${order.id}`,
  ].join('\n')
}
const input =
  'w-full bg-[var(--void)] border border-[var(--whisper)]/40 px-3 py-3 font-sans text-[12px] tracking-[0.08em] text-[var(--bone)] outline-none transition-colors focus:border-[var(--gold)] placeholder:text-[var(--faded)]/60'
const label = 'mb-2 block font-sans text-[10px] uppercase tracking-[0.25em] text-[var(--faded)]'

// Resize in the browser before uploading: a phone photo is 3–8 MB, which is too
// big for a serverless request body and pointless for a card that renders a few
// hundred pixels wide. 1600px on the long edge stays crisp on retina.
async function prepareImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > 20 * 1024 * 1024) throw new Error('That image is larger than 20 MB.')

  const bitmap = await createImageBitmap(file)
  const max = 1600
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot prepare images.')

  const probe = document.createElement('canvas')
  probe.width = probe.height = 1
  const supportsWebp = probe.toDataURL('image/webp').startsWith('data:image/webp')

  // JPEG has no transparency, so flatten onto white rather than black.
  if (!supportsWebp) {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
  }
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  return supportsWebp ? canvas.toDataURL('image/webp', 0.86) : canvas.toDataURL('image/jpeg', 0.86)
}

function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{title}</span>
      {children}
      {hint && <span className="mt-1 block font-serif text-[12px] italic text-[var(--faded)]">{hint}</span>}
    </label>
  )
}

export default function AdminPage() {
  const [status, setStatus] = useState<'checking' | 'out' | 'in'>('checking')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [config, setConfig] = useState<{ adminConfigured: boolean; paymentsConfigured: boolean } | null>(null)

  const [rows, setRows] = useState<StoredProduct[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [editing, setEditing] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [orderNotice, setOrderNotice] = useState('')
  const [syncing, setSyncing] = useState(false)

  const loadRows = useCallback(async () => {
    const response = await fetch('/api/products?all=1')
    if (response.status === 401) {
      setStatus('out')
      return
    }
    const body = (await response.json().catch(() => ({}))) as { products?: StoredProduct[] }
    setRows(Array.isArray(body.products) ? body.products : [])
  }, [])

  const loadOrders = useCallback(async () => {
    const response = await fetch('/api/admin/orders')
    if (!response.ok) return
    const body = (await response.json().catch(() => ({}))) as { orders?: AdminOrder[] }
    setOrders(Array.isArray(body.orders) ? body.orders : [])
  }, [])

  useEffect(() => {
    void (async () => {
      const [me, cfg] = await Promise.all([
        fetch('/api/admin/me').then((r) => r.json()).catch(() => ({ admin: false })),
        fetch('/api/config').then((r) => r.json()).catch(() => null),
      ])
      setConfig(cfg)
      if ((me as { admin?: boolean }).admin) {
        setStatus('in')
        await loadRows()
        await loadOrders()
      } else {
        setStatus('out')
      }
    })()
  }, [loadRows, loadOrders])

  async function signIn(event: FormEvent) {
    event.preventDefault()
    setAuthError('')
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) {
      setAuthError(body.error ?? 'Could not sign in.')
      return
    }
    setPassword('')
    setStatus('in')
    await loadRows()
    await loadOrders()
  }

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setStatus('out')
    setRows([])
    setEditorOpen(false)
  }

  function startNew() {
    setDraft(emptyDraft())
    setEditing(null)
    setEditorOpen(true)
    setNotice(null)
  }

  function startEdit(product: StoredProduct) {
    setDraft(toDraft(product))
    setEditing(product.slug)
    setEditorOpen(true)
    setNotice(null)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    const response = await fetch(editing ? `/api/products/${encodeURIComponent(editing)}` : '/api/products', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(toPayload(draft)),
    })
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    setSaving(false)
    if (!response.ok) {
      setNotice({ kind: 'error', message: body.error ?? 'Could not save that piece.' })
      return
    }
    setNotice({ kind: 'ok', message: editing ? 'Piece updated.' : 'Piece published to the collection.' })
    setEditorOpen(false)
    setEditing(null)
    await loadRows()
  }

  async function remove(product: StoredProduct) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return
    const response = await fetch(`/api/products/${encodeURIComponent(product.slug)}`, { method: 'DELETE' })
    if (!response.ok) {
      setNotice({ kind: 'error', message: 'Could not delete that piece.' })
      return
    }
    setNotice({ kind: 'ok', message: 'Piece deleted.' })
    await loadRows()
  }

  async function syncOrders() {
    setSyncing(true)
    setOrderNotice('')
    const response = await fetch('/api/admin/orders/sync', { method: 'POST' })
    const body = (await response.json().catch(() => ({}))) as { imported?: number; error?: string }
    setSyncing(false)
    if (!response.ok) {
      setOrderNotice(body.error ?? 'Could not reach Stripe.')
      return
    }
    await loadOrders()
    setOrderNotice(body.imported ? `Imported ${body.imported} paid order${body.imported === 1 ? '' : 's'}.` : 'No paid orders in Stripe yet.')
  }

  async function copyOrder(order: AdminOrder) {
    try {
      await navigator.clipboard.writeText(tapstitchText(order))
      setOrderNotice('Copied — paste it into Tapstitch.')
    } catch {
      setOrderNotice('Could not copy automatically. Select the order details instead.')
    }
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }))

  const paidOrders = orders.filter((order) => order.status === 'paid')

  async function upload(file: File) {
    setUploading(true)
    setUploadError('')
    try {
      const dataUrl = await prepareImage(file)
      const response = await fetch('/api/admin/images', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      })
      const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!response.ok || !body.url) throw new Error(body.error ?? 'Could not save that image.')
      set('image', body.url)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not save that image.')
    } finally {
      setUploading(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="native-cursor min-h-[100dvh] w-full bg-[var(--void)] text-[var(--bone)]">
      <header className="sticky top-0 z-30 border-b border-[var(--whisper)]/30 bg-[var(--void)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-5 md:px-10">
          <Link to="/" className="whitespace-nowrap font-sans text-[10px] uppercase tracking-[0.25em] text-[var(--faded)] transition-colors hover:text-[var(--bone)] sm:text-[11px] sm:tracking-[0.3em]">
            ← Sanctuary
          </Link>
          <span className="hidden whitespace-nowrap font-sans text-[11px] uppercase tracking-[0.35em] text-[var(--parchment)] sm:inline">9ineTailss / Admin</span>
          <Link to="/shop" className="font-sans text-[11px] uppercase tracking-[0.3em] text-[var(--faded)] transition-colors hover:text-[var(--bone)]">
            View shop
          </Link>
        </div>
      </header>
      {children}
    </div>
  )

  if (status === 'checking') {
    return shell(
      <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10">
        <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[var(--faded)]">Checking your session…</p>
      </div>,
    )
  }

  if (status === 'out') {
    return shell(
      <div className="mx-auto max-w-[440px] px-5 py-24">
        <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[var(--blood)]">Restricted</p>
        <h1 className="mt-3 font-gothic text-[52px] leading-none">Sign in</h1>
        <p className="mt-3 font-serif text-[15px] italic leading-relaxed text-[var(--parchment)]">Manage the collection. Nothing here is visible to customers.</p>

        {config && !config.adminConfigured && (
          <p className="mt-6 border border-[var(--gold)]/40 bg-[var(--ash)]/60 px-4 py-3 font-sans text-[11px] leading-relaxed tracking-[0.05em] text-[var(--parchment)]">
            No ADMIN_PASSWORD is set. Add it in Vercel → Settings → Environment Variables, redeploy, then sign in.
          </p>
        )}

        <form onSubmit={signIn} className="mt-8 flex flex-col gap-4">
          <Field title="Password">
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={input}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </Field>
          {authError && <p className="font-sans text-[11px] tracking-[0.1em] text-[var(--blood-bright)]">{authError}</p>}
          <button
            type="submit"
            className="mt-2 bg-[var(--bone)] px-6 py-4 font-sans text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--void)] transition-colors duration-500 hover:bg-[var(--gold)]"
          >
            Enter
          </button>
        </form>
      </div>,
    )
  }

  return shell(
    <main className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[var(--faded)]">The collection</p>
          <h1 className="mt-2 font-gothic text-[clamp(38px,6vw,72px)] leading-none">
            Pieces <span className="font-sans text-[20px] text-[var(--faded)]">{rows.length}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={startNew}
            className="bg-[var(--bone)] px-5 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--void)] transition-colors duration-300 hover:bg-[var(--gold)]"
          >
            + New piece
          </button>
          <button
            onClick={signOut}
            className="border border-[var(--whisper)]/40 px-5 py-3 font-sans text-[11px] uppercase tracking-[0.25em] text-[var(--faded)] transition-colors duration-300 hover:border-[var(--bone)] hover:text-[var(--bone)]"
          >
            Sign out
          </button>
        </div>
      </div>

      {config && !config.paymentsConfigured && (
        <p className="mt-6 border border-[var(--gold)]/40 bg-[var(--ash)]/60 px-4 py-3 font-sans text-[11px] leading-relaxed tracking-[0.05em] text-[var(--parchment)]">
          Checkout is not connected — add STRIPE_SECRET_KEY to take payments.
        </p>
      )}
      {notice && (
        <p
          className={`mt-4 font-sans text-[11px] uppercase tracking-[0.2em] ${
            notice.kind === 'error' ? 'text-[var(--blood-bright)]' : 'text-[var(--gold-bright)]'
          }`}
        >
          {notice.message}
        </p>
      )}

      <section className="mt-10 border-t border-[var(--whisper)]/25 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[var(--faded)]">Fulfilment</p>
            <h2 className="mt-2 font-bebas text-[30px] uppercase leading-none">
              Paid orders <span className="font-sans text-[15px] text-[var(--faded)]">{paidOrders.length}</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {orderNotice && (
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--gold-bright)]">{orderNotice}</span>
            )}
            <button
              type="button"
              onClick={syncOrders}
              disabled={syncing}
              className="border border-[var(--whisper)]/40 px-4 py-3 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--faded)] transition-colors hover:border-[var(--bone)] hover:text-[var(--bone)] disabled:opacity-40"
            >
              {syncing ? 'Checking Stripe…' : 'Import from Stripe'}
            </button>
          </div>
        </div>

        {paidOrders.length === 0 ? (
          <p className="mt-6 border border-[var(--whisper)]/30 bg-[var(--ash)]/30 px-6 py-8 font-serif text-[15px] italic leading-relaxed text-[var(--faded)]">
            No paid orders yet. Each completed checkout lands here with sizes and the shipping address, ready to read into Tapstitch.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {paidOrders.map((order) => (
              <li key={order.id} className="border border-[var(--whisper)]/30 bg-[var(--ash)]/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-[var(--gold-bright)]">
                      Paid · {formatDate(order.paidAt ?? order.createdAt)}
                    </p>
                    <p className="mt-1 font-sans text-[12px] tracking-[0.08em] text-[var(--parchment)]">
                      {order.email ?? 'no email captured'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-sans text-[18px] tracking-[0.06em]">{money2(order.total)}</span>
                    <button
                      type="button"
                      onClick={() => copyOrder(order)}
                      className="border border-[var(--whisper)]/40 px-3 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--bone)] transition-colors hover:border-[var(--gold)]"
                    >
                      Copy for Tapstitch
                    </button>
                  </div>
                </div>

                <ul className="mt-4 flex flex-col gap-1">
                  {order.items.map((item, index) => (
                    <li
                      key={index}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--whisper)]/15 pb-1 font-sans text-[12px] tracking-[0.06em]"
                    >
                      <span className="text-[var(--bone)]">{item.name}</span>
                      <span className="text-[var(--faded)]">
                        {item.size ? `${item.size} · ` : ''}× {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 font-sans text-[12px] leading-relaxed tracking-[0.05em] text-[var(--parchment)]">
                  {order.shipping ? (
                    <>
                      <span className="block text-[var(--bone)]">{order.shipping.name || order.customerName || '—'}</span>
                      <span className="block">{[order.shipping.line1, order.shipping.line2].filter(Boolean).join(', ')}</span>
                      <span className="block">
                        {[order.shipping.city, order.shipping.state, order.shipping.postal_code].filter(Boolean).join(', ')}
                      </span>
                      <span className="block uppercase tracking-[0.15em] text-[var(--faded)]">{order.shipping.country ?? ''}</span>
                    </>
                  ) : (
                    <span className="font-serif italic text-[var(--faded)]">
                      Address not captured yet — open the order in Stripe.
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-14">
        <div>
          {rows.length === 0 ? (
            <div className="border border-[var(--whisper)]/30 bg-[var(--ash)]/40 px-8 py-16 text-center">
              <p className="font-gothic text-[32px]">Nothing listed yet</p>
              <p className="mt-2 font-serif text-[15px] italic text-[var(--faded)]">Add your first piece and it appears on the sanctuary cards immediately.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--whisper)]/25 border-y border-[var(--whisper)]/25">
              {rows.map((product) => (
                <li key={product.slug} className="flex flex-wrap items-center gap-3 py-4 sm:gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden border border-[var(--whisper)]/30 bg-[var(--ash)]">
                    {product.image ? (
                      <img src={product.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-sans text-[9px] uppercase tracking-[0.15em] text-[var(--faded)]">No image</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bebas text-[22px] uppercase leading-none tracking-[0.04em]">{product.name}</span>
                      {product.published === false && (
                        <span className="border border-[var(--whisper)]/50 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[var(--faded)]">Draft</span>
                      )}
                      {product.featured && (
                        <span className="border border-[var(--gold)]/50 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[var(--gold-bright)]">Featured</span>
                      )}
                    </span>
                    <span className="mt-1 block truncate font-sans text-[11px] uppercase tracking-[0.15em] text-[var(--faded)]">
                      {money(product.price)} · {CATEGORY_LABELS[product.category] ?? product.category}
                      {product.options ? ` · ${product.options.values.join(' / ')}` : ''}
                    </span>
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => startEdit(product)}
                      className="px-3 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--faded)] transition-colors hover:text-[var(--bone)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(product)}
                      className="px-3 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--faded)] transition-colors hover:text-[var(--blood-bright)]"
                    >
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {editorOpen ? (
            <form onSubmit={save} className="border border-[var(--whisper)]/35 bg-[var(--ash)]/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bebas text-[24px] uppercase tracking-[0.05em]">{editing ? 'Edit piece' : 'New piece'}</h2>
                <button type="button" onClick={() => setEditorOpen(false)} className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--faded)] hover:text-[var(--bone)]">
                  Close
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <Field title="Name">
                  <input required className={input} value={draft.name} onChange={(event) => set('name', event.target.value)} placeholder="Crown of Thorns hoodie" />
                </Field>
                <Field title="Slug" hint="The product address. Auto from the name when empty.">
                  <input className={input} value={draft.slug} onChange={(event) => set('slug', event.target.value)} placeholder="crown-of-thorns-hoodie" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field title="Price (USD)">
                    <input required inputMode="numeric" className={input} value={draft.price} onChange={(event) => set('price', event.target.value)} placeholder="64" />
                  </Field>
                  <Field title="Compare at">
                    <input inputMode="numeric" className={input} value={draft.compareAt} onChange={(event) => set('compareAt', event.target.value)} placeholder="—" />
                  </Field>
                </div>
                <Field title="Category">
                  <select className={input} value={draft.category} onChange={(event) => set('category', event.target.value as Category)}>
                    {CATEGORY_KEYS.map((key) => (
                      <option key={key} value={key} className="bg-[var(--void)]">
                        {CATEGORY_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </Field>
                <div>
                  <span className={label}>Garment image</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      className={`cursor-pointer border border-[var(--whisper)]/40 px-4 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-[var(--bone)] transition-colors hover:border-[var(--gold)] ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      {uploading ? 'Uploading…' : draft.image ? 'Replace image' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={uploading}
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) void upload(file)
                          event.target.value = ''
                        }}
                      />
                    </label>
                    {draft.image && !uploading && (
                      <button
                        type="button"
                        onClick={() => set('image', '')}
                        className="border border-[var(--whisper)]/40 px-4 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-[var(--faded)] transition-colors hover:border-[var(--blood)] hover:text-[var(--blood-bright)]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {uploadError && (
                    <p className="mt-2 font-sans text-[11px] tracking-[0.1em] text-[var(--blood-bright)]">{uploadError}</p>
                  )}
                  <input
                    className={`${input} mt-2`}
                    value={draft.image}
                    onChange={(event) => set('image', event.target.value)}
                    placeholder="/api/images/… or https://…"
                  />
                  <span className="mt-1 block font-serif text-[12px] italic text-[var(--faded)]">
                    Uploaded photos are resized to 1600px and stored with the catalogue. A Tapstitch URL works too.
                  </span>
                </div>
                {draft.image && (
                  <span className="grid h-40 place-items-center overflow-hidden border border-[var(--whisper)]/30 bg-[var(--abyss)]">
                    <img src={draft.image} alt="" className="h-full w-full object-cover" />
                  </span>
                )}
                <Field title="Badge">
                  <select className={input} value={draft.badge} onChange={(event) => set('badge', event.target.value as Draft['badge'])}>
                    <option value="" className="bg-[var(--void)]">None</option>
                    <option value="New" className="bg-[var(--void)]">New</option>
                    <option value="Bestseller" className="bg-[var(--void)]">Bestseller</option>
                    <option value="Low stock" className="bg-[var(--void)]">Low stock</option>
                  </select>
                </Field>
                <Field title="Card subtitle">
                  <input className={input} value={draft.short} onChange={(event) => set('short', event.target.value)} placeholder="Heavyweight fleece" />
                </Field>
                <Field title="Description">
                  <textarea rows={4} className={`${input} resize-y`} value={draft.description} onChange={(event) => set('description', event.target.value)} />
                </Field>
                <Field title="Details" hint="One per line.">
                  <textarea rows={3} className={`${input} resize-y`} value={draft.details} onChange={(event) => set('details', event.target.value)} />
                </Field>
                <Field title="Fabric and care">
                  <textarea rows={2} className={`${input} resize-y`} value={draft.materials} onChange={(event) => set('materials', event.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field title="Option name">
                    <input className={input} value={draft.optionName} onChange={(event) => set('optionName', event.target.value)} placeholder="Size" />
                  </Field>
                  <Field title="Default">
                    <input className={input} value={draft.defaultOption} onChange={(event) => set('defaultOption', event.target.value)} placeholder="M" />
                  </Field>
                </div>
                <Field title="Option values" hint="Comma separated. Empty means no options.">
                  <input className={input} value={draft.optionValues} onChange={(event) => set('optionValues', event.target.value)} placeholder="S, M, L, XL" />
                </Field>
                <div className="flex flex-col gap-2 border-t border-[var(--whisper)]/30 pt-4">
                  <label className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.15em] text-[var(--parchment)]">
                    <input type="checkbox" checked={draft.published} onChange={(event) => set('published', event.target.checked)} />
                    Published in the collection
                  </label>
                  <label className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.15em] text-[var(--parchment)]">
                    <input type="checkbox" checked={draft.featured} onChange={(event) => set('featured', event.target.checked)} />
                    Featured piece
                  </label>
                </div>
                {notice?.kind === 'error' && <p className="font-sans text-[11px] tracking-[0.1em] text-[var(--blood-bright)]">{notice.message}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[var(--bone)] px-6 py-4 font-sans text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--void)] transition-colors duration-500 hover:bg-[var(--gold)] disabled:opacity-40"
                >
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish piece'}
                </button>
              </div>
            </form>
          ) : (
            <div className="border border-[var(--whisper)]/30 bg-[var(--ash)]/30 p-6 font-serif text-[15px] italic leading-relaxed text-[var(--faded)]">
              Select <span className="text-[var(--bone)]">New piece</span> to add a garment, or edit an existing one. Changes go live immediately — no deploy.
            </div>
          )}
        </aside>
      </div>
    </main>,
  )
}
