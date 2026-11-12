import { mkdirSync } from 'node:fs'

import { products as seed, type Product } from '../src/data/products.js'

// One tiny data layer with two drivers: SQLite for local development and Neon
// Postgres on Vercel. Queries are written once with `?` placeholders; the
// Postgres driver rewrites them to $1, $2, … so the SQL stays portable.
export type Dialect = 'sqlite' | 'postgres'

export interface Db {
  dialect: Dialect
  query<T>(text: string, params?: unknown[]): Promise<T[]>
  run(text: string, params?: unknown[]): Promise<void>
}

let pending: Promise<Db> | null = null

export function getDb(): Promise<Db> {
  pending ??= open()
  return pending
}

async function open(): Promise<Db> {
  const url = process.env.DATABASE_URL
  const db = url ? await postgres(url) : await sqlite()
  await migrate(db)
  await seedIfEmpty(db)
  return db
}

async function sqlite(): Promise<Db> {
  const { DatabaseSync } = await import('node:sqlite')
  const path = process.env.SQLITE_PATH ?? '.data/9inetailss.db'
  mkdirSync(path.slice(0, Math.max(0, path.lastIndexOf('/'))) || '.data', { recursive: true })
  const db = new DatabaseSync(path)
  type SqlValue = string | number | bigint | null | Uint8Array
  const clean = (params: unknown[] = []): SqlValue[] => params.map((value) => (value === undefined ? null : (value as SqlValue)))
  return {
    dialect: 'sqlite',
    async query<T>(text: string, params: unknown[] = []) {
      return db.prepare(text).all(...clean(params)) as T[]
    },
    async run(text: string, params: unknown[] = []) {
      db.prepare(text).run(...clean(params))
    },
  }
}

async function postgres(url: string): Promise<Db> {
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(url)
  const numbered = (text: string) => {
    let index = 0
    return text.replace(/\?/g, () => `$${++index}`)
  }
  return {
    dialect: 'postgres',
    async query<T>(text: string, params: unknown[] = []) {
      const rows = await sql.query(numbered(text), params.map((value) => (value === undefined ? null : value)))
      return rows as T[]
    },
    async run(text: string, params: unknown[] = []) {
      await sql.query(numbered(text), params.map((value) => (value === undefined ? null : value)))
    },
  }
}

// One statement per entry: node:sqlite prepares a single statement at a time,
// so a multi-statement string would silently only create the first table.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  compare_at INTEGER,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  badge TEXT,
  short TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '[]',
  materials TEXT NOT NULL DEFAULT '',
  option_name TEXT,
  option_values TEXT,
  default_option TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
)`

const IMAGES_SCHEMA = `
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  bytes BYTEA NOT NULL,
  created_at BIGINT NOT NULL
)`

const ORDERS_SCHEMA = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  email TEXT,
  customer_name TEXT,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  items TEXT NOT NULL DEFAULT '[]',
  shipping TEXT,
  created_at BIGINT NOT NULL,
  paid_at BIGINT
)`

async function migrate(db: Db) {
  await db.run(SCHEMA)
  await db.run(IMAGES_SCHEMA)
  await db.run(ORDERS_SCHEMA)
  await widenOrderTotal(db)
  await addProductColumns(db)
}

// Columns added after the first release. Nullable, so older code that reads or
// writes products keeps working against the same database.
const PRODUCT_COLUMNS = {
  colors: 'TEXT', // JSON array of ProductColor
  tapstitch_id: 'TEXT', // Tapstitch design ID, for matching re-imports
  tapstitch_code: 'TEXT', // Tapstitch product code, e.g. UT0348
  images: 'TEXT', // JSON array of photo URLs; the first is also stored in `image`
}

async function addProductColumns(db: Db) {
  if (db.dialect === 'postgres') {
    // IF NOT EXISTS: two cold starts may run this at the same moment.
    for (const [name, type] of Object.entries(PRODUCT_COLUMNS)) {
      await db.run(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ${name} ${type}`)
    }
    return
  }
  const existing = new Set((await db.query<{ name: string }>('PRAGMA table_info(products)')).map((row) => row.name))
  for (const [name, type] of Object.entries(PRODUCT_COLUMNS)) {
    if (!existing.has(name)) await db.run(`ALTER TABLE products ADD COLUMN ${name} ${type}`)
  }
}

// Order totals used to be INTEGER, which Postgres rejects once tax or a promo
// code puts cents in the total. SQLite stores any number in any column, so only
// an existing Postgres table needs changing.
async function widenOrderTotal(db: Db) {
  if (db.dialect !== 'postgres') return
  const rows = await db.query<{ data_type: string }>(
    "SELECT data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total'",
  )
  if (rows[0]?.data_type === 'integer') await db.run('ALTER TABLE orders ALTER COLUMN total TYPE NUMERIC(10,2)')
}

async function seedIfEmpty(db: Db) {
  const rows = await db.query<{ n: number | string }>('SELECT COUNT(*) AS n FROM products')
  if (Number(rows[0]?.n ?? 0) > 0) return

  const now = Date.now()
  for (const [index, product] of seed.entries()) {
    await insertSeed(db, product, index, now)
  }
}

async function insertSeed(db: Db, product: Product, index: number, createdAt: number) {
  await db.run(
    `INSERT INTO products (slug, name, price, compare_at, category, image, badge, short, description, details, materials, option_name, option_values, default_option, featured, published, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.slug,
      product.name,
      product.price,
      product.compareAt ?? null,
      product.category,
      product.image,
      product.badge ?? null,
      product.short,
      product.description,
      JSON.stringify(product.details),
      product.materials,
      product.options?.name ?? null,
      product.options ? JSON.stringify(product.options.values) : null,
      product.defaultOption ?? null,
      product.featured ? 1 : 0,
      1,
      index,
      createdAt,
    ],
  )
}
