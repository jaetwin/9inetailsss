import { getDb } from './db.js'

// Paid orders, ready to read into Tapstitch by hand. A row is written when a
// Stripe session is created (so the pieces, sizes and total are recorded before
// the buyer leaves) and completed when Stripe confirms payment.

export interface OrderItem {
  slug?: string
  name: string
  size?: string
  quantity: number
  amount: number
}

export interface OrderAddress {
  name?: string | null
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

export interface Order {
  id: string
  status: 'pending' | 'paid'
  email: string | null
  customerName: string | null
  total: number
  currency: string
  items: OrderItem[]
  shipping: OrderAddress | null
  createdAt: number
  paidAt: number | null
}

type Row = {
  id: string
  status: string
  email: string | null
  customer_name: string | null
  total: number | string
  currency: string
  items: string
  shipping: string | null
  created_at: number | string
  paid_at: number | string | null
}

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function toOrder(row: Row): Order {
  return {
    id: row.id,
    status: row.status === 'paid' ? 'paid' : 'pending',
    email: row.email,
    customerName: row.customer_name,
    total: Number(row.total),
    currency: row.currency,
    items: parseJson<OrderItem[]>(row.items) ?? [],
    shipping: parseJson<OrderAddress>(row.shipping),
    createdAt: Number(row.created_at),
    paidAt: row.paid_at === null || row.paid_at === undefined ? null : Number(row.paid_at),
  }
}

export async function recordPendingOrder(id: string, items: OrderItem[], total: number): Promise<void> {
  if (!id) return
  const db = await getDb()
  const existing = await db.query<Row>('SELECT id FROM orders WHERE id = ?', [id])
  if (existing[0]) return
  await db.run('INSERT INTO orders (id, status, total, currency, items, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
    id,
    'pending',
    total,
    'usd',
    JSON.stringify(items),
    Date.now(),
  ])
}

interface PaidOrderInput {
  id: string
  paid: boolean
  email?: string | null
  customerName?: string | null
  total: number
  items?: OrderItem[]
  shipping?: OrderAddress | null
}

export async function recordStripeSession(input: PaidOrderInput): Promise<void> {
  if (!input.id) return
  const db = await getDb()
  const rows = await db.query<Row>('SELECT * FROM orders WHERE id = ?', [input.id])
  const existing = rows[0]

  // Keep the items captured at checkout (they carry the exact sizes) and only
  // fall back to Stripe's line items when the row was never created.
  const items = existing ? parseJson<OrderItem[]>(existing.items) ?? [] : input.items ?? []
  const finalItems = items.length ? items : input.items ?? []
  const status = input.paid ? 'paid' : 'pending'
  const now = Date.now()

  if (existing) {
    await db.run(
      'UPDATE orders SET status = ?, email = ?, customer_name = ?, total = ?, items = ?, shipping = ?, paid_at = ? WHERE id = ?',
      [
        status,
        input.email ?? existing.email,
        input.customerName ?? existing.customer_name,
        input.total,
        JSON.stringify(finalItems),
        input.shipping ? JSON.stringify(input.shipping) : existing.shipping,
        status === 'paid' ? existing.paid_at ?? now : null,
        input.id,
      ],
    )
    return
  }

  await db.run(
    `INSERT INTO orders (id, status, email, customer_name, total, currency, items, shipping, created_at, paid_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      status,
      input.email ?? null,
      input.customerName ?? null,
      input.total,
      'usd',
      JSON.stringify(finalItems),
      input.shipping ? JSON.stringify(input.shipping) : null,
      now,
      status === 'paid' ? now : null,
    ],
  )
}

export async function listOrders(): Promise<Order[]> {
  const db = await getDb()
  const rows = await db.query<Row>('SELECT * FROM orders ORDER BY COALESCE(paid_at, created_at) DESC LIMIT 200')
  return rows.map(toOrder)
}
