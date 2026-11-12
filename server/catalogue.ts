import { CATEGORY_KEYS, type Category, type Product, type ProductColor } from '../src/data/products.js'
import { getDb } from './db.js'
import { deleteImageByUrl } from './images.js'
import type { TapstitchDesign } from './xlsx.js'

export type StoredProduct = Product & { published: boolean }

const BADGES = ['New', 'Bestseller', 'Low stock'] as const

type Row = {
  slug: string
  name: string
  price: number | string
  compare_at: number | string | null
  category: string
  image: string
  badge: string | null
  short: string
  description: string
  details: string
  materials: string
  option_name: string | null
  option_values: string | null
  default_option: string | null
  featured: number | string | boolean
  published: number | string | boolean
  position: number | string
  created_at: number | string
  colors?: string | null
  tapstitch_id?: string | null
  tapstitch_code?: string | null
  images?: string | null
}

function parseList(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

const SWATCH_URL = /^(https:\/\/|\/api\/images\/)/

// Shared by the database reader and the admin form validator, so a colour list
// is cleaned the same way whichever side it comes from.
function cleanColors(value: unknown): ProductColor[] {
  if (!Array.isArray(value)) return []
  const colors: ProductColor[] = []
  for (const raw of value.slice(0, 30)) {
    if (!raw || typeof raw !== 'object') continue
    const entry = raw as Record<string, unknown>
    const name = text(entry.name, 60)
    if (!name || colors.some((c) => c.name === name)) continue
    const swatch = text(entry.swatch, 1000)
    const sizes = Array.isArray(entry.sizes) ? entry.sizes.map((s) => text(s, 20)).filter(Boolean).slice(0, 20) : []
    colors.push({
      name,
      id: text(entry.id, 40) || undefined,
      sizes: sizes.length ? sizes : undefined,
      swatch: SWATCH_URL.test(swatch) ? swatch : undefined,
    })
  }
  return colors
}

function parseColors(value: string | null | undefined): ProductColor[] {
  if (!value) return []
  try {
    return cleanColors(JSON.parse(value))
  } catch {
    return []
  }
}

function toProduct(row: Row): StoredProduct {
  const values = parseList(row.option_values)
  const details = parseList(row.details)
  const colors = parseColors(row.colors)
  // Pieces saved before multi-photo support only have `image`.
  const images = parseList(row.images)
  return {
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    compareAt: row.compare_at === null || row.compare_at === undefined ? undefined : Number(row.compare_at),
    category: row.category as Category,
    image: row.image,
    images: images.length ? images : row.image ? [row.image] : [],
    badge: (row.badge as Product['badge']) ?? undefined,
    short: row.short,
    description: row.description,
    details,
    materials: row.materials,
    options: row.option_name && values.length ? { name: row.option_name, values } : undefined,
    defaultOption: row.default_option ?? undefined,
    colors: colors.length ? colors : undefined,
    tapstitch: row.tapstitch_id ? { designId: row.tapstitch_id, productCode: row.tapstitch_code ?? '' } : undefined,
    featured: Boolean(Number(row.featured)),
    published: Boolean(Number(row.published)),
  }
}

export async function listProducts(includeUnpublished = false): Promise<StoredProduct[]> {
  const db = await getDb()
  const where = includeUnpublished ? '' : 'WHERE published = 1'
  const rows = await db.query<Row>(`SELECT * FROM products ${where} ORDER BY position ASC, created_at ASC`)
  return rows.map(toProduct)
}

export async function findProduct(slug: string): Promise<StoredProduct | null> {
  const db = await getDb()
  const rows = await db.query<Row>('SELECT * FROM products WHERE slug = ?', [slug])
  return rows[0] ? toProduct(rows[0]) : null
}

async function findByTapstitchId(designId: string): Promise<StoredProduct | null> {
  const db = await getDb()
  const rows = await db.query<Row>('SELECT * FROM products WHERE tapstitch_id = ?', [designId])
  return rows[0] ? toProduct(rows[0]) : null
}

/** Pieces already imported, keyed by Tapstitch design ID. */
export async function importedDesigns(): Promise<Map<string, { slug: string; name: string; published: boolean }>> {
  const db = await getDb()
  const rows = await db.query<Pick<Row, 'slug' | 'name' | 'published' | 'tapstitch_id'>>(
    'SELECT slug, name, published, tapstitch_id FROM products WHERE tapstitch_id IS NOT NULL',
  )
  return new Map(rows.map((row) => [row.tapstitch_id!, { slug: row.slug, name: row.name, published: Boolean(Number(row.published)) }]))
}

export interface ProductInput {
  slug: string
  name: string
  price: number
  compareAt?: number
  category: Category
  image: string
  images: string[]
  badge?: (typeof BADGES)[number]
  short: string
  description: string
  details: string[]
  materials: string
  optionName?: string
  optionValues: string[]
  defaultOption?: string
  /** Undefined keeps a piece's current colours on update. */
  colors?: ProductColor[]
  featured: boolean
  published: boolean
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

type Validation = { ok: boolean; value?: ProductInput; error?: string }

export function validateProduct(body: unknown): Validation {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Send a product payload.' }
  const input = body as Record<string, unknown>

  const name = text(input.name, 120)
  if (!name) return { ok: false, error: 'Give the product a name.' }

  const published = input.published === undefined ? true : Boolean(input.published)

  // Imported pieces arrive without a price, so a draft may sit at 0 until the
  // owner prices it. Only a piece that is live must have a real price.
  const price = Math.round(Number(input.price) || 0)
  if (!Number.isFinite(price) || price < 0 || price > 100000) return { ok: false, error: 'Price must be a whole number.' }
  if (published && price < 1) return { ok: false, error: 'Set a price before this piece goes live.' }

  const category = text(input.category, 40)
  if (!CATEGORY_KEYS.includes(category as Category)) return { ok: false, error: 'Pick a category.' }

  // Photos are optional: a piece can be listed before they exist, and the
  // storefront renders its own placeholder. Older clients send one `image`.
  const rawImages = Array.isArray(input.images) ? input.images : [input.image]
  const images = [...new Set(rawImages.map((value) => text(value, 1000)).filter(Boolean))].slice(0, 12)
  if (images.some((url) => !/^(https?:\/\/|\/)/.test(url))) {
    return { ok: false, error: 'Images must be full https URLs or paths starting with /.' }
  }
  const image = images[0] ?? ''

  const compareAtRaw = Number(input.compareAt)
  const compareAt = Number.isFinite(compareAtRaw) && compareAtRaw > price ? Math.round(compareAtRaw) : undefined

  const badgeRaw = text(input.badge, 20)
  const badge = BADGES.includes(badgeRaw as (typeof BADGES)[number]) ? (badgeRaw as (typeof BADGES)[number]) : undefined

  const details = Array.isArray(input.details)
    ? input.details.map((item) => text(item, 200)).filter(Boolean).slice(0, 20)
    : []

  const optionValues = Array.isArray(input.optionValues)
    ? input.optionValues.map((item) => text(item, 40)).filter(Boolean).slice(0, 20)
    : []

  const optionName = text(input.optionName, 40)
  const defaultOption = text(input.defaultOption, 40)

  return {
    ok: true,
    value: {
      slug: slugify(text(input.slug, 80) || name),
      name,
      price,
      compareAt,
      category: category as Category,
      image,
      images,
      badge,
      short: text(input.short, 120),
      description: text(input.description, 4000),
      details,
      materials: text(input.materials, 1000),
      optionName: optionName || undefined,
      optionValues,
      defaultOption: defaultOption || undefined,
      colors: Array.isArray(input.colors) ? cleanColors(input.colors) : undefined,
      featured: Boolean(input.featured),
      published,
    },
  }
}

async function nextPosition(): Promise<number> {
  const db = await getDb()
  const rows = await db.query<{ p: number | string | null }>('SELECT COALESCE(MAX(position), -1) AS p FROM products')
  return Number(rows[0]?.p ?? -1) + 1
}

const COLUMN_LIST =
  'slug, name, price, compare_at, category, image, badge, short, description, details, materials, option_name, option_values, default_option, featured, published, colors, tapstitch_id, tapstitch_code, images'

function columns(value: ProductInput, tapstitch: Product['tapstitch'] | undefined) {
  return [
    value.slug,
    value.name,
    value.price,
    value.compareAt ?? null,
    value.category,
    value.image,
    value.badge ?? null,
    value.short,
    value.description,
    JSON.stringify(value.details),
    value.materials,
    value.optionName ?? null,
    value.optionValues.length ? JSON.stringify(value.optionValues) : null,
    value.defaultOption ?? null,
    value.featured ? 1 : 0,
    value.published ? 1 : 0,
    value.colors?.length ? JSON.stringify(value.colors) : null,
    tapstitch?.designId ?? null,
    tapstitch?.productCode ?? null,
    value.images.length ? JSON.stringify(value.images) : null,
  ]
}

async function insertProduct(value: ProductInput, tapstitch?: Product['tapstitch']) {
  const db = await getDb()
  await db.run(
    `INSERT INTO products (${COLUMN_LIST}, position, created_at) VALUES (${Array(22).fill('?').join(', ')})`,
    [...columns(value, tapstitch), await nextPosition(), Date.now()],
  )
}

export async function createProduct(value: ProductInput): Promise<StoredProduct> {
  const existing = await findProduct(value.slug)
  if (existing) throw new Error(`A product already uses the address /product/${value.slug}. Change the name or slug.`)
  await insertProduct(value)
  return (await findProduct(value.slug))!
}

export async function updateProduct(slug: string, value: ProductInput): Promise<StoredProduct> {
  const db = await getDb()
  const existing = await findProduct(slug)
  if (!existing) throw new Error('That product no longer exists.')
  if (value.slug !== slug && (await findProduct(value.slug))) {
    throw new Error(`A product already uses the address /product/${value.slug}.`)
  }

  const colors = value.colors ?? existing.colors ?? []
  const assignments = COLUMN_LIST.split(', ').map((column) => `${column} = ?`).join(', ')
  // The Tapstitch link is never edited by hand; it stays as imported.
  await db.run(`UPDATE products SET ${assignments} WHERE slug = ?`, [...columns({ ...value, colors }, existing.tapstitch), slug])
  // Colours removed in the editor take their swatch pictures with them.
  await deleteSwatches((existing.colors ?? []).filter((old) => !colors.some((kept) => kept.swatch === old.swatch)))
  return (await findProduct(value.slug))!
}

async function deleteSwatches(colors: ProductColor[]) {
  for (const color of colors) if (color.swatch) await deleteImageByUrl(color.swatch)
}

export async function deleteProduct(slug: string): Promise<boolean> {
  const db = await getDb()
  const existing = await findProduct(slug)
  if (!existing) return false
  await db.run('DELETE FROM products WHERE slug = ?', [slug])
  // Swatches are made per piece on import, so nothing else points at them.
  await deleteSwatches(existing.colors ?? [])
  return true
}

/** Puts pieces live or back to draft. A piece without a price cannot go live. */
export async function setPublished(slugs: string[], published: boolean) {
  const db = await getDb()
  const changed: string[] = []
  const blocked: { slug: string; name: string; reason: string }[] = []
  for (const slug of slugs) {
    const product = await findProduct(slug)
    if (!product) continue
    if (published && product.price < 1) {
      blocked.push({ slug, name: product.name, reason: 'no price' })
      continue
    }
    await db.run('UPDATE products SET published = ? WHERE slug = ?', [published ? 1 : 0, slug])
    changed.push(slug)
  }
  return { changed, blocked }
}

// ── Tapstitch import ─────────────────────────────────────────────────────────

function guessCategory(name: string): Category {
  const n = name.toLowerCase()
  if (/hoodie|zip|sweatshirt|crewneck|pullover/.test(n)) return 'hoodies'
  if (/jacket|coat|vest|windbreaker|shacket/.test(n)) return 'outerwear'
  if (/pant|jean|short|jogger|trouser|legging/.test(n)) return 'bottoms'
  if (/hat|cap|beanie|bag|sock|tote/.test(n)) return 'accessories'
  return 'tees'
}

const defaultSize = (sizes: string[]) => (sizes.includes('M') ? 'M' : sizes[0])

async function uniqueSlug(base: string): Promise<string> {
  if (!(await findProduct(base))) return base
  for (let i = 2; ; i++) {
    const candidate = `${base.slice(0, 76)}-${i}`
    if (!(await findProduct(candidate))) return candidate
  }
}

/**
 * New designs become drafts (price 0, not live). A design already in the shop
 * keeps its name, price, photos, description and live/draft state; only its
 * colours, sizes and product code are refreshed from Tapstitch.
 */
export async function importTapstitchDesigns(
  designs: TapstitchDesign[],
  saveSwatch: (dataUrl: string) => Promise<string>,
): Promise<{ created: string[]; updated: string[] }> {
  const db = await getDb()
  const created: string[] = []
  const updated: string[] = []

  for (const design of designs) {
    const existing = await findByTapstitchId(design.designId)
    const previous = existing?.colors ?? []

    const colors: ProductColor[] = []
    for (const color of design.colors) {
      let swatch = previous.find((old) => old.id === color.id)?.swatch
      if (!swatch && color.swatch) swatch = await saveSwatch(color.swatch).catch(() => undefined)
      colors.push({ name: color.name, id: color.id, sizes: color.sizes, swatch })
    }

    if (existing) {
      await deleteSwatches(previous.filter((old) => !colors.some((kept) => kept.swatch === old.swatch)))
      const sizes = design.sizes
      const keepDefault = existing.defaultOption && sizes.includes(existing.defaultOption)
      await db.run(
        'UPDATE products SET colors = ?, option_name = ?, option_values = ?, default_option = ?, tapstitch_code = ? WHERE slug = ?',
        [
          colors.length ? JSON.stringify(colors) : null,
          existing.options?.name ?? 'Size',
          sizes.length ? JSON.stringify(sizes) : null,
          (keepDefault ? existing.defaultOption : defaultSize(sizes)) ?? null,
          design.productCode,
          existing.slug,
        ],
      )
      updated.push(existing.slug)
      continue
    }

    const slug = await uniqueSlug(slugify(design.name) || `tapstitch-${design.designId}`)
    await insertProduct(
      {
        slug,
        name: design.name.slice(0, 120),
        price: 0,
        category: guessCategory(design.name),
        image: '',
        images: [],
        short: '',
        description: '',
        details: [],
        materials: '',
        optionName: design.sizes.length ? 'Size' : undefined,
        optionValues: design.sizes,
        defaultOption: defaultSize(design.sizes),
        colors,
        featured: false,
        published: false,
      },
      { designId: design.designId, productCode: design.productCode },
    )
    created.push(slug)
  }

  return { created, updated }
}
