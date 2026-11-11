import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import type { OrderAddress } from '../../server/orders'

interface ReceiptItem {
  name: string
  size?: string
  quantity: number
  amount: number
}

interface Receipt {
  paid: boolean
  email: string | null
  total: number
  shipping: OrderAddress | null
  items: ReceiptItem[]
}

const money = (value: number) => `$${value.toFixed(2)}`

// Stripe's success_url lands here. Loading this page is also what marks the
// order paid in the database, so it must run even if the buyer only glances.
export default function OrderConfirmed() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id') ?? ''
  const [state, setState] = useState<{ loading: boolean; error?: string; receipt?: Receipt }>({ loading: true })

  useEffect(() => {
    if (!sessionId) {
      setState({ loading: false, error: 'There is no order reference in this link.' })
      return
    }

    let cancelled = false
    fetch(`/api/orders/session?id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as Receipt & { error?: string }
        if (!response.ok) throw new Error(body.error ?? 'We could not find that order.')
        if (!cancelled) setState({ loading: false, receipt: body })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ loading: false, error: error instanceof Error ? error.message : 'We could not find that order.' })
      })

    return () => {
      cancelled = true
    }
  }, [sessionId])

  return (
    <div className="native-cursor min-h-[100dvh] w-full bg-[var(--void)] text-[var(--bone)]">
      <header className="border-b border-[var(--whisper)]/30">
        <div className="mx-auto flex h-16 max-w-[900px] items-center justify-between px-5">
          <Link to="/" className="font-sans text-[11px] uppercase tracking-[0.3em] text-[var(--faded)] transition-colors hover:text-[var(--bone)]">
            ← Sanctuary
          </Link>
          <span className="font-gothic text-[24px] leading-none">9ineTailss</span>
          <Link to="/shop" className="font-sans text-[11px] uppercase tracking-[0.3em] text-[var(--faded)] transition-colors hover:text-[var(--bone)]">
            Shop
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-5 py-16">
        {state.loading && <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[var(--faded)]">Confirming your order…</p>}

        {!state.loading && state.error && (
          <>
            <h1 className="font-gothic text-[clamp(38px,7vw,68px)] leading-[0.9]">Order not found</h1>
            <p className="mt-4 max-w-[520px] font-serif text-[16px] italic leading-relaxed text-[var(--parchment)]">{state.error}</p>
            <p className="mt-6 font-sans text-[12px] uppercase tracking-[0.2em] text-[var(--faded)]">
              If you were charged, your receipt is in your email — reply to it and we will sort it out.
            </p>
          </>
        )}

        {!state.loading && state.receipt && (
          <>
            <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[var(--gold-bright)]">
              {state.receipt.paid ? 'Payment received' : 'Awaiting payment'}
            </p>
            <h1 className="mt-3 font-gothic text-[clamp(40px,8vw,76px)] leading-[0.9]">Thank you</h1>
            <p className="mt-4 max-w-[540px] font-serif text-[16px] italic leading-relaxed text-[var(--parchment)]">
              Your pieces are made to order. We will email tracking as soon as they ship
              {state.receipt.email ? ` to ${state.receipt.email}` : ''}.
            </p>

            <ul className="mt-10 divide-y divide-[var(--whisper)]/25 border-y border-[var(--whisper)]/25">
              {state.receipt.items.map((item, index) => (
                <li key={index} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                  <span className="font-sans text-[13px] uppercase tracking-[0.08em]">{item.name}</span>
                  <span className="font-sans text-[12px] tracking-[0.08em] text-[var(--faded)]">
                    {item.size ? `${item.size} · ` : ''}× {item.quantity} · {money(item.amount)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-baseline justify-between font-sans text-[15px] tracking-[0.08em]">
              <span className="text-[var(--faded)] uppercase text-[11px] tracking-[0.25em]">Total paid</span>
              <span>{money(state.receipt.total)}</span>
            </div>

            {state.receipt.shipping && (
              <div className="mt-10 border border-[var(--whisper)]/30 bg-[var(--ash)]/30 p-5 font-sans text-[12px] leading-relaxed tracking-[0.05em] text-[var(--parchment)]">
                <span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-[var(--faded)]">Shipping to</span>
                <span className="block text-[var(--bone)]">{state.receipt.shipping.name}</span>
                <span className="block">{[state.receipt.shipping.line1, state.receipt.shipping.line2].filter(Boolean).join(', ')}</span>
                <span className="block">
                  {[state.receipt.shipping.city, state.receipt.shipping.state, state.receipt.shipping.postal_code].filter(Boolean).join(', ')}
                </span>
                <span className="block uppercase tracking-[0.15em] text-[var(--faded)]">{state.receipt.shipping.country}</span>
              </div>
            )}

            <Link
              to="/shop"
              className="mt-10 inline-block bg-[var(--bone)] px-6 py-4 font-sans text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--void)] transition-colors duration-500 hover:bg-[var(--gold)]"
            >
              Back to the shop
            </Link>
          </>
        )}
      </main>
    </div>
  )
}
