import { getDb } from './db'

// Garment images live in the same database as the catalogue. Vercel functions
// have no writable disk and this shop should not need a cloud bucket account,
// so a few hundred KB per garment in Postgres beats another service to set up.
// The browser resizes before uploading (see AdminPage), so these stay small.

const MAX_BYTES = 4 * 1024 * 1024

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'] as const

export interface SavedImage {
  id: string
  url: string
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl)
  if (!match) throw new Error('Upload a PNG, JPEG or WebP image.')

  const mime = match[1]
  if (!ALLOWED.includes(mime as (typeof ALLOWED)[number])) throw new Error('Upload a PNG, JPEG or WebP image.')

  const bytes = new Uint8Array(Buffer.from(match[2].replace(/\s/g, ''), 'base64'))
  if (bytes.length === 0) throw new Error('That image file is empty.')
  if (bytes.length > MAX_BYTES) throw new Error('That image is too large. Try a smaller photo.')

  return { mime, bytes }
}

export async function saveImage(dataUrl: string): Promise<SavedImage> {
  const { mime, bytes } = parseDataUrl(dataUrl)
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24)

  const db = await getDb()
  await db.run('INSERT INTO images (id, mime, bytes, created_at) VALUES (?, ?, ?, ?)', [id, mime, bytes, Date.now()])

  return { id, url: `/api/images/${id}` }
}

export async function readImage(id: string): Promise<{ mime: string; bytes: Uint8Array } | null> {
  if (!/^[a-f0-9]{1,32}$/.test(id)) return null

  const db = await getDb()
  const rows = await db.query<{ mime: string; bytes: Uint8Array | ArrayBuffer | Buffer }>(
    'SELECT mime, bytes FROM images WHERE id = ?',
    [id],
  )
  const row = rows[0]
  if (!row) return null

  const raw = row.bytes
  const bytes =
    raw instanceof Uint8Array
      ? raw
      : raw instanceof ArrayBuffer
        ? new Uint8Array(raw)
        : new Uint8Array(Object.values(raw as Record<string, number>))

  return { mime: row.mime, bytes }
}
