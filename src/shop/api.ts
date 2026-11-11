// The shop backend is the source of truth: /admin writes to it, /api/products
// reads it. Everything the 3D site already does (cards, ProductView, cart) is
// built around a Shopify-shaped product, so we map the catalogue into that shape
// here instead of rewriting those components.

export interface ApiProduct {
  slug: string
  name: string
  price: number
  compareAt?: number
  category: string
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

// Domain of the shop API when the storefront is deployed separately; empty for
// same-origin (the normal case once this is merged into the site).
const API_BASE = (import.meta.env.VITE_SHOP_API_URL ?? '').replace(/\/$/, '')

const ROTS = [-2, 1.5, -1, 2, -1.5, 1]

export async function fetchCatalogue(): Promise<ApiProduct[]> {
  try {
    const response = await fetch(`${API_BASE}/api/products`)
    if (!response.ok) return []
    const body = (await response.json()) as { products?: ApiProduct[] }
    return Array.isArray(body.products) ? body.products : []
  } catch {
    return []
  }
}

const money = (value: number) => `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`

/** Product in the shape Room2/ProductView/cart already understand. */
export function toDisplayProduct(product: ApiProduct, index: number) {
  const sizes = product.options?.values ?? []
  const variants = (sizes.length ? sizes : ['One']).map((size) => ({
    id: `${product.slug}::${size}`,
    title: size,
    availableForSale: true,
    price: { amount: String(product.price), currencyCode: 'USD' },
    selectedOptions: sizes.length ? [{ name: product.options!.name, value: size }] : [],
  }))

  return {
    id: product.slug,
    displayIndex: index + 1,
    name: product.name.toUpperCase(),
    price: money(product.price),
    compareAt: product.compareAt,
    rot: ROTS[index % ROTS.length],
    slug: product.slug,
    category: product.category,
    badge: product.badge ?? null,
    short: product.short,
    description: product.description,
    descriptionHtml: product.materials ? `${product.description}\n\n${product.materials}` : product.description,
    image: product.image,
    // An empty URL would render as a broken <img> with visible alt text; a piece
    // without artwork should simply have no images.
    images: { edges: product.image ? [{ node: { url: product.image, altText: product.name } }] : [] },
    variants: { edges: variants.map((node) => ({ node })) },
    defaultOption: product.defaultOption,
  }
}

export interface CheckoutLine {
  slug: string
  option?: string
  quantity: number
}

/**
 * Creates a Stripe Checkout session and returns its URL. `returnPath` is the
 * page Stripe sends the buyer back to if they cancel ('/' or '/shop').
 */
export async function createCheckoutSession(items: CheckoutLine[], returnPath?: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/api/checkout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items, returnPath }),
    })
    const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
    if (!response.ok || !body.url) {
      console.error('Checkout unavailable:', body.error ?? response.status)
      return null
    }
    return body.url
  } catch (error) {
    console.error('Checkout request failed:', error)
    return null
  }
}
