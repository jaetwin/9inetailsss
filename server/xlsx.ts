import { inflateRawSync } from 'node:zlib'

// Reads Tapstitch's "export designs" spreadsheet (.xlsx). An .xlsx file is a
// zip of XML files, so this is a small zip reader plus just enough XML reading
// for this one layout, rather than a spreadsheet library in the API bundle.
//
// Export layout (one row per design and colour):
//   Design Name | Cover (picture) | Design URL | Color Name | Color ID | Product Code | Size
// The cover is a 64×64 picture anchored to the row; it becomes the colour swatch.

export interface TapstitchColor {
  name: string
  id: string
  /** Sizes Tapstitch makes in this colour (they can differ between colours). */
  sizes: string[]
  /** data: URL of the cover picture for this colour, when the row had one. */
  swatch?: string
}

export interface TapstitchDesign {
  designId: string
  url: string
  name: string
  productCode: string
  sizes: string[]
  colors: TapstitchColor[]
}

const MAX_FILES = 2000
const MAX_UNZIPPED_BYTES = 40 * 1024 * 1024
const MAX_DESIGNS = 500

// ── Zip ──────────────────────────────────────────────────────────────────────

function readZip(data: Uint8Array): Map<string, Buffer> {
  const buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  let end = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      end = i
      break
    }
  }
  if (end < 0) throw new Error('That file is not an .xlsx spreadsheet.')

  const count = buf.readUInt16LE(end + 10)
  if (count > MAX_FILES) throw new Error('That spreadsheet is too large to import.')
  let offset = buf.readUInt32LE(end + 16)
  let total = 0
  const files = new Map<string, Buffer>()

  for (let n = 0; n < count; n++) {
    if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== 0x02014b50) throw new Error('That spreadsheet is damaged.')
    const method = buf.readUInt16LE(offset + 10)
    const compressedSize = buf.readUInt32LE(offset + 20)
    const size = buf.readUInt32LE(offset + 24)
    const nameLength = buf.readUInt16LE(offset + 28)
    const extraLength = buf.readUInt16LE(offset + 30)
    const commentLength = buf.readUInt16LE(offset + 32)
    const localOffset = buf.readUInt32LE(offset + 42)
    const name = buf.toString('utf8', offset + 46, offset + 46 + nameLength)
    offset += 46 + nameLength + extraLength + commentLength

    total += size
    if (total > MAX_UNZIPPED_BYTES) throw new Error('That spreadsheet is too large to import.')
    if (localOffset + 30 > buf.length || buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('That spreadsheet is damaged.')
    const start = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28)
    const raw = buf.subarray(start, start + compressedSize)

    if (method === 0) files.set(name, raw)
    else if (method === 8) files.set(name, inflateRawSync(raw, { maxOutputLength: Math.max(size, 1) }))
  }
  return files
}

// ── XML ──────────────────────────────────────────────────────────────────────

const decode = (value: string) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

const attr = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1]

// All <t> runs inside one element, joined (rich text splits a cell into runs).
const textOf = (xml: string) => [...xml.matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((m) => decode(m[1])).join('')

function relationships(files: Map<string, Buffer>, path: string): Map<string, { type: string; target: string }> {
  const xml = files.get(path)?.toString('utf8') ?? ''
  const map = new Map<string, { type: string; target: string }>()
  for (const match of xml.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attr(match[0], 'Id')
    const target = attr(match[0], 'Target')
    if (id && target) map.set(id, { type: attr(match[0], 'Type') ?? '', target })
  }
  return map
}

// Relationship targets are relative to the folder of the part that owns them.
function resolve(fromPart: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1)
  const parts = fromPart.split('/').slice(0, -1)
  for (const segment of target.split('/')) {
    if (segment === '..') parts.pop()
    else if (segment !== '.') parts.push(segment)
  }
  return parts.join('/')
}

const columnIndex = (ref: string) => [...ref].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1

// ── Sheet ────────────────────────────────────────────────────────────────────

interface Sheet {
  rows: Map<number, string[]>
  /** Picture bytes anchored to each 1-based row number. */
  pictures: Map<number, { bytes: Buffer; mime: string }>
}

function firstSheet(files: Map<string, Buffer>): Sheet {
  const workbook = files.get('xl/workbook.xml')?.toString('utf8')
  if (!workbook) throw new Error('That file is not an .xlsx spreadsheet.')
  const sheetTag = /<(?:\w+:)?sheet\b[^>]*>/.exec(workbook)?.[0] ?? ''
  const sheetRel = relationships(files, 'xl/_rels/workbook.xml.rels').get(attr(sheetTag, 'r:id') ?? '')
  const sheetPath = sheetRel ? resolve('xl/workbook.xml', sheetRel.target) : 'xl/worksheets/sheet1.xml'
  const sheetXml = files.get(sheetPath)?.toString('utf8')
  if (!sheetXml) throw new Error('That spreadsheet has no sheet to read.')

  const shared = [...(files.get('xl/sharedStrings.xml')?.toString('utf8') ?? '').matchAll(/<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(
    (m) => textOf(m[1]),
  )

  const rows = new Map<number, string[]>()
  for (const row of sheetXml.matchAll(/<(?:\w+:)?row\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?row>/g)) {
    const number = Number(attr(row[1], 'r'))
    const cells: string[] = []
    for (const cell of row[2].matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
      const ref = /^([A-Z]+)/.exec(attr(cell[1], 'r') ?? '')?.[1]
      if (!ref) continue
      const type = attr(cell[1], 't')
      const body = cell[2] ?? ''
      const value = /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/.exec(body)?.[1]
      let text = ''
      if (type === 's' && value !== undefined) text = shared[Number(value)] ?? ''
      else if (type === 'inlineStr') text = textOf(body)
      else if (value !== undefined) text = decode(value)
      cells[columnIndex(ref)] = text.trim()
    }
    if (Number.isFinite(number)) rows.set(number, cells)
  }

  const pictures = new Map<number, { bytes: Buffer; mime: string }>()
  const sheetRels = `${sheetPath.replace(/[^/]+$/, '')}_rels/${sheetPath.split('/').pop()}.rels`
  for (const rel of relationships(files, sheetRels).values()) {
    if (!rel.type.endsWith('/drawing')) continue
    const drawingPath = resolve(sheetPath, rel.target)
    const drawingXml = files.get(drawingPath)?.toString('utf8') ?? ''
    const drawingRels = relationships(files, `${drawingPath.replace(/[^/]+$/, '')}_rels/${drawingPath.split('/').pop()}.rels`)
    for (const anchor of drawingXml.matchAll(/<(?:\w+:)?(?:twoCellAnchor|oneCellAnchor)\b[\s\S]*?<\/(?:\w+:)?(?:twoCellAnchor|oneCellAnchor)>/g)) {
      const from = /<(?:\w+:)?from>([\s\S]*?)<\/(?:\w+:)?from>/.exec(anchor[0])?.[1] ?? ''
      const row = Number(/<(?:\w+:)?row>(\d+)<\/(?:\w+:)?row>/.exec(from)?.[1])
      const embed = /\sr:embed="([^"]+)"/.exec(anchor[0])?.[1]
      const target = embed ? drawingRels.get(embed)?.target : undefined
      if (!Number.isFinite(row) || !target) continue
      const imagePath = resolve(drawingPath, target)
      const bytes = files.get(imagePath)
      const mime = /\.png$/i.test(imagePath) ? 'image/png' : /\.jpe?g$/i.test(imagePath) ? 'image/jpeg' : /\.webp$/i.test(imagePath) ? 'image/webp' : ''
      // Drawing rows are 0-based; sheet rows are 1-based.
      if (bytes && mime && !pictures.has(row + 1)) pictures.set(row + 1, { bytes, mime })
    }
  }

  return { rows, pictures }
}

// ── Tapstitch ────────────────────────────────────────────────────────────────

const HEADERS = {
  name: 'design name',
  url: 'design url',
  color: 'color name',
  colorId: 'color id',
  code: 'product code',
  size: 'size',
} as const

export function readTapstitchExport(data: Uint8Array): TapstitchDesign[] {
  const { rows, pictures } = firstSheet(readZip(data))
  const numbers = [...rows.keys()].sort((a, b) => a - b)

  const headerRow = numbers.find((n) => rows.get(n)!.some((cell) => cell?.toLowerCase() === HEADERS.name))
  if (headerRow === undefined) {
    throw new Error('This is not a Tapstitch design export: there is no "Design Name" column.')
  }
  const header = rows.get(headerRow)!.map((cell) => cell?.toLowerCase() ?? '')
  const col = Object.fromEntries(Object.entries(HEADERS).map(([key, title]) => [key, header.indexOf(title)])) as Record<keyof typeof HEADERS, number>
  if (col.color < 0 || col.size < 0) throw new Error('This Tapstitch export is missing the "Color Name" or "Size" column.')

  const designs = new Map<string, TapstitchDesign>()
  for (const n of numbers) {
    if (n <= headerRow) continue
    const cells = rows.get(n)!
    const get = (key: keyof typeof HEADERS) => (col[key] >= 0 ? cells[col[key]] ?? '' : '')
    const name = get('name')
    if (!name) continue

    const url = get('url')
    const code = get('code')
    const designId = /\/product\/(\d+)/.exec(url)?.[1] ?? `${code}:${name}`.toLowerCase()
    let design = designs.get(designId)
    if (!design) {
      if (designs.size >= MAX_DESIGNS) break
      design = { designId, url: /^https:\/\/(www\.)?tapstitch\.com\//.test(url) ? url : '', name, productCode: code, sizes: [], colors: [] }
      designs.set(designId, design)
    }

    const sizes = get('size').split(',').map((s) => s.trim()).filter(Boolean)
    for (const size of sizes) {
      if (!design.sizes.includes(size)) design.sizes.push(size)
    }

    const colorName = get('color')
    const colorId = get('colorId') || colorName
    const existing = design.colors.find((c) => c.id === colorId)
    if (existing) {
      for (const size of sizes) if (!existing.sizes.includes(size)) existing.sizes.push(size)
    } else if (colorName) {
      const picture = pictures.get(n)
      design.colors.push({
        name: colorName,
        id: colorId,
        sizes,
        swatch: picture ? `data:${picture.mime};base64,${picture.bytes.toString('base64')}` : undefined,
      })
    }
  }

  return [...designs.values()]
}
