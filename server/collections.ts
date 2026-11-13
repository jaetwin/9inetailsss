import { getDb } from './db.js'

// Named sets of pieces ("Collection 001", "Easter Drop") shown as tabs on
// /shop. A piece can be in several; its memberships are stored on the piece
// (products.collections, a JSON list of collection slugs).

export interface Collection {
  slug: string
  name: string
  description: string
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

export async function listCollections(): Promise<Collection[]> {
  const db = await getDb()
  return db.query<Collection>('SELECT slug, name, description FROM collections ORDER BY position ASC, created_at ASC')
}

export async function createCollection(input: { name?: unknown; description?: unknown }): Promise<Collection> {
  const name = text(input.name, 80)
  if (!name) throw new Error('Give the collection a name.')
  const base = slugify(name) || 'collection'
  const db = await getDb()
  let slug = base
  for (let i = 2; (await db.query('SELECT slug FROM collections WHERE slug = ?', [slug])).length; i++) slug = `${base}-${i}`
  const position = Number((await db.query<{ p: number | string | null }>('SELECT COALESCE(MAX(position), -1) AS p FROM collections'))[0]?.p ?? -1) + 1
  const collection = { slug, name, description: text(input.description, 300) }
  await db.run('INSERT INTO collections (slug, name, description, position, created_at) VALUES (?, ?, ?, ?, ?)', [
    collection.slug,
    collection.name,
    collection.description,
    position,
    Date.now(),
  ])
  return collection
}

/** Renames or re-describes a collection. Its slug (and links to it) stay the same. */
export async function updateCollection(slug: string, input: { name?: unknown; description?: unknown }): Promise<boolean> {
  const name = text(input.name, 80)
  if (!name) throw new Error('Give the collection a name.')
  const db = await getDb()
  if (!(await db.query('SELECT slug FROM collections WHERE slug = ?', [slug])).length) return false
  await db.run('UPDATE collections SET name = ?, description = ? WHERE slug = ?', [name, text(input.description, 300), slug])
  return true
}

/** Deletes a collection and takes it off every piece. The pieces stay. */
export async function deleteCollection(slug: string): Promise<boolean> {
  const db = await getDb()
  if (!(await db.query('SELECT slug FROM collections WHERE slug = ?', [slug])).length) return false
  await db.run('DELETE FROM collections WHERE slug = ?', [slug])
  await editMemberships(await piecesIn(slug), (current) => current.filter((s) => s !== slug))
  return true
}

/** Adds pieces to and/or removes pieces from one collection. */
export async function setCollectionPieces(slug: string, add: string[], remove: string[]): Promise<boolean> {
  const db = await getDb()
  if (!(await db.query('SELECT slug FROM collections WHERE slug = ?', [slug])).length) return false
  await editMemberships(add, (current) => (current.includes(slug) ? current : [...current, slug]))
  await editMemberships(remove, (current) => current.filter((s) => s !== slug))
  return true
}

async function piecesIn(collection: string): Promise<string[]> {
  const db = await getDb()
  const rows = await db.query<{ slug: string; collections: string | null }>('SELECT slug, collections FROM products WHERE collections IS NOT NULL')
  return rows.filter((row) => parseSlugs(row.collections).includes(collection)).map((row) => row.slug)
}

async function editMemberships(pieces: string[], change: (current: string[]) => string[]) {
  const db = await getDb()
  for (const piece of new Set(pieces)) {
    const rows = await db.query<{ collections: string | null }>('SELECT collections FROM products WHERE slug = ?', [piece])
    if (!rows[0]) continue
    const next = change(parseSlugs(rows[0].collections))
    await db.run('UPDATE products SET collections = ? WHERE slug = ?', [next.length ? JSON.stringify(next) : null, piece])
  }
}

export function parseSlugs(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string').slice(0, 30) : []
  } catch {
    return []
  }
}
