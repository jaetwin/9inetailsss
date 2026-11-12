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
  images?: string[]
  badge?: 'New' | 'Bestseller' | 'Low stock'
  short: string
  description: string
  details: string[]
  materials: string
  options?: { name: string; values: string[] }
  defaultOption?: string
  colors?: ProductColor[]
  tapstitch?: { designId: string; productCode: string }
  featured?: boolean
  published?: boolean
}

interface ProductColor {
  name: string
  id?: string
  sizes?: string[]
  swatch?: string
}

// One design from a Tapstitch export, as the import preview shows it.
interface PreviewDesign {
  designId: string
  url: string
  name: string
  productCode: string
  sizes: string[]
  colors: (ProductColor & { swatch?: string })[]
  existing: { slug: string; name: string; published: boolean } | null
}

interface OrderItem {
  slug?: string
  name: string
  size?: string
  color?: string
  quantity: number
  amount: number
  tapstitch?: { designId: string; productCode: string; colorId?: string }
}

interface AdminOrder {
  id: string
  status: 'pending' | 'paid'
  email: string | null
  customerName: string | null
  total: number
  currency: string
  items: OrderItem[]
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
  /** All photos in display order; the first is the cover. */
  images: string[]
  badge: '' | NonNullable<StoredProduct['badge']>
  short: string
  description: string
  details: string
  materials: string
  optionName: string
  optionValues: string
  defaultOption: string
  colors: ProductColor[]
  tapstitch?: StoredProduct['tapstitch']
  featured: boolean
  published: boolean
}

const emptyDraft = (): Draft => ({
  name: '',
  slug: '',
  price: '',
  compareAt: '',
  category: 'tees',
  images: [],
  badge: '',
  short: '',
  description: '',
  details: '',
  materials: '',
  optionName: 'Size',
  optionValues: 'S, M, L, XL, XXL',
  defaultOption: 'M',
  colors: [],
  featured: false,
  published: true,
})

const toDraft = (product: StoredProduct): Draft => ({
  name: product.name,
  slug: product.slug,
  // Imported drafts arrive at 0: show an empty box rather than "$0".
  price: product.price ? String(product.price) : '',
  compareAt: product.compareAt ? String(product.compareAt) : '',
  category: product.category,
  images: product.images?.length ? product.images : product.image ? [product.image] : [],
  badge: product.badge ?? '',
  short: product.short,
  description: product.description,
  details: product.details.join('\n'),
  materials: product.materials,
  optionName: product.options?.name ?? '',
  optionValues: product.options?.values.join(', ') ?? '',
  defaultOption: product.defaultOption ?? '',
  colors: product.colors ?? [],
  tapstitch: product.tapstitch,
  featured: Boolean(product.featured),
  published: product.published !== false,
})

const toPayload = (draft: Draft) => ({
  name: draft.name,
  slug: draft.slug || draft.name,
  price: Number(draft.price),
  compareAt: draft.compareAt ? Number(draft.compareAt) : undefined,
  category: draft.category,
  image: draft.images[0] ?? '',
  images: draft.images,
  badge: draft.badge || undefined,
  short: draft.short,
  description: draft.description,
  details: draft.details.split('\n').map((line) => line.trim()).filter(Boolean),
  materials: draft.materials,
  optionName: draft.optionName,
  optionValues: draft.optionValues.split(',').map((value) => value.trim()).filter(Boolean),
  defaultOption: draft.defaultOption,
  colors: draft.colors,
  featured: draft.featured,
  published: draft.published,
})

const tapstitchDesignUrl = (designId: string) => `https://www.tapstitch.com/account/products-pool/product/${designId}`

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

  // Tapstitch identifies a garment by design, product code and colour ID, so
  // those are spelled out next to each piece when the piece was imported.
  const itemLines = order.items.flatMap((item) => {
    const variant = [item.color, item.size].filter(Boolean).join(' / ')
    const line = `${item.name}${variant ? ` — ${variant}` : ''} × ${item.quantity}`
    if (!item.tapstitch) return [line]
    const ids = [`product ${item.tapstitch.productCode}`, item.tapstitch.colorId && `color ID ${item.tapstitch.colorId}`].filter(Boolean).join(' · ')
    return [line, `  Tapstitch: ${ids}`, `  ${tapstitchDesignUrl(item.tapstitch.designId)}`]
  })

  return [
    '9INETAILSS — PAID ORDER',
    `${placed} · ${order.total.toFixed(2)} USD · ${order.email ?? 'no email'}`,
    '',
    ...itemLines,
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
  const [config, setConfig] = useState<{
    adminConfigured: boolean
    paymentsConfigured: boolean
    taxEnabled?: boolean
    webhookConfigured?: boolean
  } | null>(null)

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

  const [filter, setFilter] = useState<'all' | 'live' | 'drafts'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const [importFile, setImportFile] = useState<{ name: string; data: string } | null>(null)
  const [preview, setPreview] = useState<PreviewDesign[] | null>(null)
  const [chosen, setChosen] = useState<Set<string>>(new Set())
  const [importBusy, setImportBusy] = useState(false)
  const [importError, setImportError] = useState('')

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
    setNotice({ kind: 'ok', message: editing ? 'Piece updated.' : draft.published ? 'Piece published to the collection.' : 'Draft saved.' })
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

  async function bulk(action: 'publish' | 'unpublish' | 'delete', slugs: string[]) {
    if (!slugs.length) return
    const what = slugs.length === 1 ? 'this piece' : `${slugs.length} pieces`
    if (action === 'delete' && !window.confirm(`Remove ${what} from the shop? Imported pieces come back if you import the Tapstitch export again.`)) return
    setBulkBusy(true)
    setNotice(null)
    const response = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, slugs }),
    })
    const body = (await response.json().catch(() => ({}))) as {
      changed?: string[]
      blocked?: { name: string }[]
      removed?: string[]
      error?: string
    }
    setBulkBusy(false)
    if (!response.ok) {
      setNotice({ kind: 'error', message: body.error ?? 'Could not update those pieces.' })
      return
    }
    const count = (n: number) => `${n} piece${n === 1 ? '' : 's'}`
    if (action === 'delete') {
      setNotice({ kind: 'ok', message: `${count(body.removed?.length ?? 0)} removed.` })
    } else if (action === 'unpublish') {
      setNotice({ kind: 'ok', message: `${count(body.changed?.length ?? 0)} moved to drafts.` })
    } else {
      const live = body.changed?.length ?? 0
      const blocked = body.blocked ?? []
      setNotice({
        kind: blocked.length ? 'error' : 'ok',
        message: [live ? `${count(live)} now live.` : '', blocked.length ? `Set a price first: ${blocked.map((b) => b.name).join(', ')}.` : '']
          .filter(Boolean)
          .join(' '),
      })
    }
    setSelected(new Set())
    await loadRows()
  }

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Could not read that file.'))
      reader.readAsDataURL(file)
    })

  // Step 1: read the export and show what is in it. Nothing is saved yet.
  async function openImport(file: File) {
    setImportError('')
    setNotice(null)
    if (!/\.xlsx$/i.test(file.name)) {
      setImportError('Choose the .xlsx file Tapstitch exported.')
      return
    }
    setImportBusy(true)
    try {
      const data = await readAsDataUrl(file)
      const response = await fetch('/api/admin/import/tapstitch/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file: data }),
      })
      const body = (await response.json().catch(() => ({}))) as { designs?: PreviewDesign[]; error?: string }
      if (!response.ok || !body.designs) throw new Error(body.error ?? 'Could not read that file.')
      setImportFile({ name: file.name, data })
      setPreview(body.designs)
      // New designs start ticked; ones already in the shop only refresh when ticked.
      setChosen(new Set(body.designs.filter((design) => !design.existing).map((design) => design.designId)))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not read that file.')
    } finally {
      setImportBusy(false)
    }
  }

  function closeImport() {
    setPreview(null)
    setImportFile(null)
    setChosen(new Set())
    setImportError('')
  }

  // Step 2: save the ticked designs as drafts.
  async function runImport() {
    if (!importFile || !chosen.size) return
    setImportBusy(true)
    setImportError('')
    const response = await fetch('/api/admin/import/tapstitch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ file: importFile.data, designIds: [...chosen] }),
    })
    const body = (await response.json().catch(() => ({}))) as { created?: string[]; updated?: string[]; detailed?: number; error?: string }
    setImportBusy(false)
    if (!response.ok) {
      setImportError(body.error ?? 'Could not import those designs.')
      return
    }
    const created = body.created?.length ?? 0
    const updated = body.updated?.length ?? 0
    closeImport()
    setFilter(created && !updated ? 'drafts' : 'all')
    setNotice({
      kind: 'ok',
      message: [
        created ? `${created} imported as drafts. Add a price and photo, then tick them and choose Go live.` : '',
        updated ? `${updated} refreshed with Tapstitch's latest colours and sizes.` : '',
        body.detailed ? `${body.detailed} got a description and size chart from Tapstitch.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    })
    await loadRows()
  }

  const toggled = (current: Set<string>, id: string) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
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

  const isLive = (product: StoredProduct) => product.published !== false
  const liveCount = rows.filter(isLive).length
  const visible = rows.filter((product) => (filter === 'all' ? true : filter === 'live' ? isLive(product) : !isLive(product)))
  const visibleSelected = visible.filter((product) => selected.has(product.slug)).map((product) => product.slug)
  const allVisibleSelected = visible.length > 0 && visibleSelected.length === visible.length

  const [uploadProgress, setUploadProgress] = useState('')
  const [dragging, setDragging] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  // Uploads one at a time (each is resized first) and appends them in the
  // order chosen, so a batch of 6 photos lands as 6 photos in that order.
  async function uploadFiles(files: File[]) {
    const pictures = files.filter((file) => file.type.startsWith('image/'))
    if (!pictures.length) {
      setUploadError('Drop PNG, JPEG or WebP photos.')
      return
    }
    setUploading(true)
    setUploadError('')
    const failed: string[] = []
    for (const [index, file] of pictures.entries()) {
      setUploadProgress(`Uploading ${index + 1} of ${pictures.length}…`)
      try {
        const dataUrl = await prepareImage(file)
        const response = await fetch('/api/admin/images', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ dataUrl }),
        })
        const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
        if (!response.ok || !body.url) throw new Error(body.error ?? 'Could not save that image.')
        setDraft((current) => ({ ...current, images: [...current.images, body.url!].slice(0, 12) }))
      } catch (error) {
        failed.push(`${file.name}: ${error instanceof Error ? error.message : 'could not upload'}`)
      }
    }
    setUploading(false)
    setUploadProgress('')
    if (failed.length) setUploadError(failed.join(' · '))
  }

  const moveImage = (from: number, to: number) =>
    setDraft((current) => {
      const images = [...current.images]
      const [moved] = images.splice(from, 1)
      images.splice(to, 0, moved)
      return { ...current, images }
    })

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
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={`cursor-pointer border border-[var(--gold)]/60 px-5 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--gold-bright)] transition-colors duration-300 hover:border-[var(--gold)] hover:text-[var(--bone)] ${importBusy ? 'pointer-events-none opacity-50' : ''}`}
          >
            {importBusy && !preview ? 'Reading…' : 'Import from Tapstitch'}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              disabled={importBusy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void openImport(file)
                event.target.value = ''
              }}
            />
          </label>
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
      {config?.paymentsConfigured && config.taxEnabled === false && (
        <p className="mt-6 border border-[var(--gold)]/40 bg-[var(--ash)]/60 px-4 py-3 font-sans text-[11px] leading-relaxed tracking-[0.05em] text-[var(--parchment)]">
          Sales tax is off — checkout charges no tax until Stripe Tax is set up (Stripe Dashboard → Settings → Tax).
        </p>
      )}
      {config?.paymentsConfigured && config.webhookConfigured === false && (
        <p className="mt-6 border border-[var(--gold)]/40 bg-[var(--ash)]/60 px-4 py-3 font-sans text-[11px] leading-relaxed tracking-[0.05em] text-[var(--parchment)]">
          No Stripe webhook yet — an order only shows as paid when the buyer returns to the site. Add STRIPE_WEBHOOK_SECRET.
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
      {importError && !preview && (
        <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.2em] text-[var(--blood-bright)]">{importError}</p>
      )}

      {preview && (
        <section className="mt-8 border border-[var(--gold)]/40 bg-[var(--ash)]/40 p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[var(--gold-bright)]">Tapstitch export · {importFile?.name}</p>
              <h2 className="mt-2 font-bebas text-[30px] uppercase leading-none">
                {preview.length} designs <span className="font-sans text-[15px] text-[var(--faded)]">{chosen.size} ticked</span>
              </h2>
              <p className="mt-2 max-w-[640px] font-serif text-[14px] italic leading-relaxed text-[var(--faded)]">
                Ticked designs come in as drafts, hidden from the shop until you choose Go live. Designs already in the shop
                keep your name, price, photos and description; ticking them only refreshes colours and sizes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setChosen(chosen.size === preview.length ? new Set() : new Set(preview.map((d) => d.designId)))}
                className="border border-[var(--whisper)]/40 px-4 py-3 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--faded)] transition-colors hover:border-[var(--bone)] hover:text-[var(--bone)]"
              >
                {chosen.size === preview.length ? 'Untick all' : 'Tick all'}
              </button>
              <button
                type="button"
                onClick={closeImport}
                disabled={importBusy}
                className="border border-[var(--whisper)]/40 px-4 py-3 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--faded)] transition-colors hover:border-[var(--bone)] hover:text-[var(--bone)] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runImport}
                disabled={importBusy || chosen.size === 0}
                className="bg-[var(--bone)] px-5 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--void)] transition-colors hover:bg-[var(--gold)] disabled:opacity-40"
              >
                {importBusy ? 'Importing…' : `Import ${chosen.size}`}
              </button>
            </div>
          </div>
          {importError && <p className="mt-4 font-sans text-[11px] tracking-[0.1em] text-[var(--blood-bright)]">{importError}</p>}

          <ul className="mt-5 grid gap-2 md:grid-cols-2">
            {preview.map((design) => (
              <li key={design.designId}>
                <label
                  className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors ${
                    chosen.has(design.designId) ? 'border-[var(--bone)]/60 bg-[var(--void)]/60' : 'border-[var(--whisper)]/25'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={chosen.has(design.designId)}
                    onChange={() => setChosen((current) => toggled(current, design.designId))}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bebas text-[19px] uppercase leading-none tracking-[0.04em]">{design.name}</span>
                      {design.existing ? (
                        <span className="border border-[var(--whisper)]/50 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[var(--faded)]">
                          In shop{design.existing.published ? ' · live' : ' · draft'}
                        </span>
                      ) : (
                        <span className="border border-[var(--gold)]/50 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[var(--gold-bright)]">New</span>
                      )}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      {design.colors.map((color) => (
                        <span key={color.id ?? color.name} title={color.name} className="flex items-center gap-1">
                          {color.swatch ? (
                            <img src={color.swatch} alt="" className="h-7 w-7 border border-[var(--whisper)]/30 object-cover" />
                          ) : null}
                        </span>
                      ))}
                    </span>
                    <span className="mt-2 block font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--faded)]">
                      {design.productCode} · {design.colors.map((c) => c.name).join(', ')} · {design.sizes.join(' / ')}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
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
                      <span className="text-[var(--bone)]">
                        {item.name}
                        {item.tapstitch && (
                          <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-[var(--faded)]">
                            {item.tapstitch.productCode}
                            {item.tapstitch.colorId ? ` · color ${item.tapstitch.colorId}` : ''}
                          </span>
                        )}
                      </span>
                      <span className="text-[var(--faded)]">
                        {[item.color, item.size].filter(Boolean).join(' / ')}
                        {item.color || item.size ? ' · ' : ''}× {item.quantity}
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
              <p className="mt-2 font-serif text-[15px] italic text-[var(--faded)]">
                Import your Tapstitch export, or add a piece by hand. Imported pieces wait as drafts until you put them live.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex border border-[var(--whisper)]/35">
                  {(
                    [
                      ['all', `All ${rows.length}`],
                      ['live', `Live ${liveCount}`],
                      ['drafts', `Drafts ${rows.length - liveCount}`],
                    ] as const
                  ).map(([key, title]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setFilter(key)
                        setSelected(new Set())
                      }}
                      className={`px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] transition-colors ${
                        filter === key ? 'bg-[var(--bone)] text-[var(--void)]' : 'text-[var(--faded)] hover:text-[var(--bone)]'
                      }`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--faded)]">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() => setSelected(allVisibleSelected ? new Set() : new Set(visible.map((p) => p.slug)))}
                  />
                  Select all
                </label>
              </div>

              {visibleSelected.length > 0 && (
                <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 border border-[var(--gold)]/50 bg-[var(--void)]/95 px-4 py-3 backdrop-blur-md">
                  <span className="mr-auto font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--gold-bright)]">
                    {visibleSelected.length} selected
                  </span>
                  <button
                    type="button"
                    disabled={bulkBusy}
                    onClick={() => bulk('publish', visibleSelected)}
                    className="bg-[var(--bone)] px-4 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--void)] transition-colors hover:bg-[var(--gold)] disabled:opacity-40"
                  >
                    Go live
                  </button>
                  <button
                    type="button"
                    disabled={bulkBusy}
                    onClick={() => bulk('unpublish', visibleSelected)}
                    className="border border-[var(--whisper)]/40 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--bone)] transition-colors hover:border-[var(--bone)] disabled:opacity-40"
                  >
                    Move to drafts
                  </button>
                  <button
                    type="button"
                    disabled={bulkBusy}
                    onClick={() => bulk('delete', visibleSelected)}
                    className="border border-[var(--whisper)]/40 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--faded)] transition-colors hover:border-[var(--blood)] hover:text-[var(--blood-bright)] disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              )}

              {visible.length === 0 ? (
                <p className="border border-[var(--whisper)]/30 bg-[var(--ash)]/30 px-6 py-8 font-serif text-[15px] italic text-[var(--faded)]">
                  {filter === 'live' ? 'Nothing is live yet. Tick drafts and choose Go live.' : 'No drafts. Imported pieces land here first.'}
                </p>
              ) : (
            <ul className="divide-y divide-[var(--whisper)]/25 border-y border-[var(--whisper)]/25">
              {visible.map((product) => (
                <li key={product.slug} className="flex flex-wrap items-center gap-3 py-4 sm:gap-4">
                  <input
                    type="checkbox"
                    aria-label={`Select ${product.name}`}
                    checked={selected.has(product.slug)}
                    onChange={() => setSelected((current) => toggled(current, product.slug))}
                  />
                  <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden border border-[var(--whisper)]/30 bg-[var(--ash)]">
                    {product.image ? (
                      <img src={product.image} alt="" className="h-full w-full object-cover" />
                    ) : product.colors?.[0]?.swatch ? (
                      <img src={product.colors[0].swatch} alt="" className="h-full w-full object-cover opacity-70" />
                    ) : (
                      <span className="font-sans text-[9px] uppercase tracking-[0.15em] text-[var(--faded)]">No image</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bebas text-[22px] uppercase leading-none tracking-[0.04em]">{product.name}</span>
                      {isLive(product) ? (
                        <span className="border border-[var(--gold)]/50 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[var(--gold-bright)]">Live</span>
                      ) : (
                        <span className="border border-[var(--whisper)]/50 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[var(--faded)]">Draft</span>
                      )}
                      {product.featured && (
                        <span className="border border-[var(--gold)]/50 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[var(--gold-bright)]">Featured</span>
                      )}
                      {product.price < 1 && (
                        <span className="border border-[var(--blood)]/60 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[var(--blood-bright)]">No price</span>
                      )}
                      {!product.image && (
                        <span className="border border-[var(--whisper)]/50 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[var(--faded)]">No photo</span>
                      )}
                    </span>
                    <span className="mt-1 block truncate font-sans text-[11px] uppercase tracking-[0.15em] text-[var(--faded)]">
                      {product.price >= 1 ? money(product.price) : '—'} · {CATEGORY_LABELS[product.category] ?? product.category}
                      {product.colors?.length ? ` · ${product.colors.length} colour${product.colors.length === 1 ? '' : 's'}` : ''}
                      {product.options ? ` · ${product.options.values.join(' / ')}` : ''}
                      {product.tapstitch ? ` · Tapstitch ${product.tapstitch.productCode}` : ''}
                    </span>
                    {product.colors && product.colors.length > 0 && (
                      <span className="mt-2 flex flex-wrap gap-1">
                        {product.colors.map((color) =>
                          color.swatch ? (
                            <img key={color.name} src={color.swatch} alt={color.name} title={color.name} className="h-6 w-6 border border-[var(--whisper)]/30 object-cover" />
                          ) : (
                            <span key={color.name} className="border border-[var(--whisper)]/30 px-1.5 py-0.5 font-sans text-[9px] uppercase tracking-[0.1em] text-[var(--faded)]">
                              {color.name}
                            </span>
                          ),
                        )}
                      </span>
                    )}
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => bulk(isLive(product) ? 'unpublish' : 'publish', [product.slug])}
                      disabled={bulkBusy}
                      className="px-3 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--faded)] transition-colors hover:text-[var(--gold-bright)] disabled:opacity-40"
                    >
                      {isLive(product) ? 'To drafts' : 'Go live'}
                    </button>
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
            </>
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
                    <input inputMode="numeric" className={input} value={draft.price} onChange={(event) => set('price', event.target.value)} placeholder="64" />
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
                  <span className={label}>Photos {draft.images.length ? `(${draft.images.length}/12)` : ''}</span>
                  {/* Drop several photos at once, or click to pick several. */}
                  <label
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault()
                      setDragging(false)
                      if (!uploading) void uploadFiles([...event.dataTransfer.files])
                    }}
                    className={`flex cursor-pointer flex-col items-center justify-center border border-dashed px-4 py-6 text-center transition-colors ${
                      dragging ? 'border-[var(--gold)] bg-[var(--gold)]/10' : 'border-[var(--whisper)]/50 hover:border-[var(--gold)]'
                    } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-[var(--bone)]">
                      {uploading ? uploadProgress : 'Drop photos here or click to choose'}
                    </span>
                    <span className="mt-1 font-serif text-[12px] italic text-[var(--faded)]">Several at once is fine. Resized to 1600px.</span>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploading}
                      onChange={(event) => {
                        const files = [...(event.target.files ?? [])]
                        event.target.value = ''
                        if (files.length) void uploadFiles(files)
                      }}
                    />
                  </label>
                  {uploadError && (
                    <p className="mt-2 font-sans text-[11px] tracking-[0.1em] text-[var(--blood-bright)]">{uploadError}</p>
                  )}
                  {draft.images.length > 0 && (
                    <ul className="mt-3 grid grid-cols-3 gap-2">
                      {draft.images.map((url, index) => (
                        <li key={url} className="relative aspect-square overflow-hidden border border-[var(--whisper)]/30 bg-[var(--abyss)]">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          {index === 0 && (
                            <span className="absolute left-1 top-1 bg-[var(--void)]/80 px-1.5 py-0.5 font-sans text-[8px] uppercase tracking-[0.2em] text-[var(--gold-bright)]">
                              Cover
                            </span>
                          )}
                          <span className="absolute inset-x-0 bottom-0 flex justify-between bg-[var(--void)]/75">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveImage(index, index - 1)}
                              aria-label="Move earlier"
                              className="px-2 py-1 font-sans text-[12px] text-[var(--bone)] disabled:opacity-20"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() => set('images', draft.images.filter((_, i) => i !== index))}
                              aria-label="Remove photo"
                              className="px-2 py-1 font-sans text-[12px] text-[var(--faded)] hover:text-[var(--blood-bright)]"
                            >
                              ×
                            </button>
                            <button
                              type="button"
                              disabled={index === draft.images.length - 1}
                              onClick={() => moveImage(index, index + 1)}
                              aria-label="Move later"
                              className="px-2 py-1 font-sans text-[12px] text-[var(--bone)] disabled:opacity-20"
                            >
                              →
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 flex gap-2">
                    <input
                      className={input}
                      value={imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      placeholder="Or paste an https:// photo link"
                    />
                    <button
                      type="button"
                      disabled={!/^https?:\/\//.test(imageUrl.trim())}
                      onClick={() => {
                        set('images', [...draft.images, imageUrl.trim()].slice(0, 12))
                        setImageUrl('')
                      }}
                      className="border border-[var(--whisper)]/40 px-4 font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--bone)] hover:border-[var(--gold)] disabled:opacity-30"
                    >
                      Add
                    </button>
                  </div>
                </div>
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
                {draft.colors.length > 0 && (
                  <div>
                    <span className={label}>Colours</span>
                    <div className="flex flex-wrap gap-2">
                      {draft.colors.map((color) => (
                        <span key={color.name} className="flex items-center gap-2 border border-[var(--whisper)]/40 py-1 pl-1 pr-2">
                          {color.swatch && <img src={color.swatch} alt="" className="h-7 w-7 object-cover" />}
                          <span className="font-sans text-[10px] uppercase tracking-[0.12em] text-[var(--parchment)]">{color.name}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${color.name}`}
                            onClick={() => set('colors', draft.colors.filter((c) => c.name !== color.name))}
                            className="font-sans text-[12px] text-[var(--faded)] hover:text-[var(--blood-bright)]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <span className="mt-1 block font-serif text-[12px] italic text-[var(--faded)]">
                      Buyers pick one of these. Removing a colour hides it; importing again brings it back.
                    </span>
                  </div>
                )}
                {draft.tapstitch && (
                  <p className="font-sans text-[10px] uppercase leading-relaxed tracking-[0.15em] text-[var(--faded)]">
                    Imported from Tapstitch · {draft.tapstitch.productCode} ·{' '}
                    <a href={tapstitchDesignUrl(draft.tapstitch.designId)} target="_blank" rel="noreferrer" className="text-[var(--gold-bright)] underline-offset-2 hover:underline">
                      Open design
                    </a>
                  </p>
                )}
                <div className="flex flex-col gap-2 border-t border-[var(--whisper)]/30 pt-4">
                  <label className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.15em] text-[var(--parchment)]">
                    <input type="checkbox" checked={draft.published} onChange={(event) => set('published', event.target.checked)} />
                    Live in the shop (needs a price)
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
                  {saving ? 'Saving…' : editing ? 'Save changes' : draft.published ? 'Publish piece' : 'Save draft'}
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
