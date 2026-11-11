import { CATEGORY_KEYS, type Category, type Product } from '../src/data/products.js'
import { getDb } from './db.js'

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

function toProduct(row: Row): StoredProduct {
  const values = parseList(row.option_values)
  const details = parseList(row.details)
  return {
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    compareAt: row.compare_at === null || row.compare_at === undefined ? undefined : Number(row.compare_at),
    category: row.category as Category,
    image: row.image,
    badge: (row.badge as Product['badge']) ?? undefined,
    short: row.short,
    description: row.description,
    details,
    materials: row.materials,
    options: row.option_name && values.length ? { name: row.option_name, values } : undefined,
    defaultOption: row.default_option ?? undefined,
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

export interface ProductInput {
  slug: string
  name: string
  price: number
  compareAt?: number
  category: Category
  image: string
  badge?: (typeof BADGES)[number]
  short: string
  description: string
  details: string[]
  materials: string
  optionName?: string
  optionValues: string[]
  defaultOption?: string
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

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

export function validateProduct(body: unknown): Validation {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Send a product payload.' }
  const input = body as Record<string, unknown>

  const name = text(input.name, 120)
  if (!name) return { ok: false, error: 'Give the product a name.' }

  const price = Math.round(Number(input.price))
  if (!Number.isFinite(price) || price < 1 || price > 100000) return { ok: false, error: 'Price must be a whole number above 0.' }

  const category = text(input.category, 40)
  if (!CATEGORY_KEYS.includes(category as Category)) return { ok: false, error: 'Pick a category.' }

  // Artwork is optional: a piece can be listed before the photos exist, and the
  // storefront renders its own placeholder for it.
  const image = text(input.image, 1000)
  if (image && !/^(https?:\/\/|\/)/.test(image)) return { ok: false, error: 'Image must be a full https URL or a path starting with /.' }

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
      badge,
      short: text(input.short, 120),
      description: text(input.description, 4000),
      details,
      materials: text(input.materials, 1000),
      optionName: optionName || undefined,
      optionValues,
      defaultOption: defaultOption || undefined,
      featured: Boolean(input.featured),
      published: input.published === undefined ? true : Boolean(input.published),
    },
  }
}

async function nextPosition(): Promise<number> {
  const db = await getDb()
  const rows = await db.query<{ p: number | string | null }>('SELECT COALESCE(MAX(position), -1) AS p FROM products')
  return Number(rows[0]?.p ?? -1) + 1
}

function columns(value: ProductInput) {
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
  ]
}

export async function createProduct(value: ProductInput): Promise<StoredProduct> {
  const db = await getDb()
  const existing = await findProduct(value.slug)
  if (existing) throw new Error(`A product already uses the address /product/${value.slug}. Change the name or slug.`)

  await db.run(
    `INSERT INTO products (slug, name, price, compare_at, category, image, badge, short, description, details, materials, option_name, option_values, default_option, featured, published, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...columns(value), await nextPosition(), Date.now()],
  )
  return (await findProduct(value.slug))!
}

export async function updateProduct(slug: string, value: ProductInput): Promise<StoredProduct> {
  const db = await getDb()
  const existing = await findProduct(slug)
  if (!existing) throw new Error('That product no longer exists.')
  if (value.slug !== slug && (await findProduct(value.slug))) {
    throw new Error(`A product already uses the address /product/${value.slug}.`)
  }

  await db.run(
    `UPDATE products SET slug = ?, name = ?, price = ?, compare_at = ?, category = ?, image = ?, badge = ?, short = ?, description = ?, details = ?, materials = ?, option_name = ?, option_values = ?, default_option = ?, featured = ?, published = ? WHERE slug = ?`,
    [...columns(value), slug],
  )
  return (await findProduct(value.slug))!
}

export async function deleteProduct(slug: string): Promise<boolean> {
  const db = await getDb()
  const existing = await findProduct(slug)
  if (!existing) return false
  await db.run('DELETE FROM products WHERE slug = ?', [slug])
  return true
}
