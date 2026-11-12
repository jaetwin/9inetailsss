// Garment facts from Tapstitch's public catalogue, used to pre-fill imported
// pieces. These are the same unauthenticated endpoints tapstitch.com's own
// product pages call:
//   /api/services/site/products/search?q=<product code>  → the product's slug
//   /api/services/site/products/detail/<slug>            → fabric, fit, size chart
// Tapstitch can change them without notice, so every failure here returns null
// and the import carries on without the extra details.

const BASE = 'https://www.tapstitch.com/api/services/site/products'
const TIMEOUT_MS = 8000

export interface SizeChart {
  headers: string[]
  rows: { size: string; values: string[] }[]
}

export interface TapstitchSpecs {
  short: string
  description: string
  details: string[]
  materials: string
  sizeChart?: SizeChart
}

type Desc = { key?: string; value?: string }[]

async function getJson(url: string): Promise<any> {
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) return null
  const body = (await response.json()) as { code?: number; data?: unknown }
  return body?.code === 200 ? body.data : null
}

const pick = (list: Desc | undefined, label: RegExp) =>
  list?.find((entry) => label.test(entry.key ?? ''))?.value?.trim() ?? ''

// Tapstitch writes its blurbs for sellers ("Recommended as a core stock item…
// perfect for custom printing"). Keep only the sentences a buyer would read.
const SELLER_TALK =
  /tapstitch|discover|recommend|stock item|custom|printing|print-on-demand|merchant|seller|retailer|your brand|your design|collections?\b|wholesale|bulk|colou?r options/i

// Some products send these sections as JSON text instead of an object.
const parsed = (value: unknown): any => {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

function buyerDescription(text: string): string {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+/g) ?? []
  return sentences.map((s) => s.trim()).filter((s) => s && !SELLER_TALK.test(s)).slice(0, 3).join(' ')
}

// Inches for US shoppers; the chart's first row holds the size labels.
function toSizeChart(chart: any): SizeChart | undefined {
  const table: { name?: string; value?: string[] }[] | undefined = chart?.inch ?? chart?.cm
  const unit = chart?.inch ? 'in' : 'cm'
  const sizes = table?.find((row) => /^size$/i.test(row.name ?? ''))?.value
  const measures = table?.filter((row) => !/^size$/i.test(row.name ?? '') && Array.isArray(row.value)) ?? []
  if (!sizes?.length || !measures.length) return undefined
  return {
    headers: measures.map((row) => `${row.name} (${unit})`),
    rows: sizes.map((size, i) => ({ size, values: measures.map((row) => row.value?.[i] ?? '') })),
  }
}

export async function fetchTapstitchSpecs(productCode: string): Promise<TapstitchSpecs | null> {
  const code = productCode.trim()
  if (!/^[A-Za-z0-9]{3,12}$/.test(code)) return null
  try {
    const found = await getJson(`${BASE}/search?pageNum=1&pageSize=5&q=${encodeURIComponent(code)}`)
    const items: { slug?: string; bsSn?: string }[] = found?.page?.data ?? []
    const lower = code.toLowerCase()
    const slug = items.find((item) => item.slug?.startsWith(`${lower}-`) || item.bsSn?.toLowerCase().startsWith(`${lower}-`))?.slug
    if (!slug) return null

    const detail = await getJson(`${BASE}/detail/${encodeURIComponent(slug)}`)
    if (!detail) return null

    const material: Desc | undefined = parsed(detail.material)?.colonDesc
    const fabric = pick(material, /^fabric:/i)
    const thickness = pick(material, /thickness/i)
    const care = pick(material, /care/i)
    const fit = (detail.attributes?.sizeFitType?.value as string | undefined)?.trim() ?? ''
    const gsm = detail.attributes?.fabricWeight?.gsm as string | undefined
    const oz = detail.attributes?.fabricWeight?.oz as string | undefined

    const blurb = buyerDescription(detail.meta?.description ?? detail.attributes?.details?.[0]?.content ?? '')
    const fallback = [fit && `${fit} fit`, fabric && `in ${fabric.toLowerCase()}`].filter(Boolean).join(' ')

    return {
      short: [fit && `${fit} fit`, fabric].filter(Boolean).join(' · ').slice(0, 120),
      description: blurb || (fallback ? `${fallback.charAt(0).toUpperCase()}${fallback.slice(1)}.` : ''),
      details: [
        fabric && `Fabric: ${fabric}`,
        gsm && `Weight: ${gsm} gsm${oz ? ` (${oz} oz)` : ''}`,
        fit && `Fit: ${fit}`,
        thickness && `Thickness: ${thickness}`,
        'Made to order',
      ].filter((line): line is string => Boolean(line)),
      materials: [fabric, care].filter(Boolean).join('. ').slice(0, 1000),
      sizeChart: toSizeChart(parsed(detail.sizeChart)),
    }
  } catch {
    return null
  }
}

/** Looks up several codes at once (a few at a time) and returns them by code. */
export async function fetchTapstitchSpecsFor(codes: string[]): Promise<Map<string, TapstitchSpecs>> {
  const unique = [...new Set(codes.filter(Boolean))]
  const results = new Map<string, TapstitchSpecs>()
  for (let i = 0; i < unique.length; i += 6) {
    const batch = unique.slice(i, i + 6)
    const specs = await Promise.all(batch.map((code) => fetchTapstitchSpecs(code)))
    batch.forEach((code, j) => specs[j] && results.set(code, specs[j]!))
  }
  return results
}
