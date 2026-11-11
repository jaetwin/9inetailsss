import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

import Checkout from '../components/Checkout'
import ProductView from '../components/ProductView'
import { useCart } from '../CartContext'
import { fetchCatalogue, toDisplayProduct } from './api'

// A conventional storefront for people who would rather browse a grid than
// scroll the 3D sanctuary. Same catalogue, same product modal, same cart.
export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { cartItems, setIsCheckoutOpen } = useCart()

  useEffect(() => {
    let cancelled = false
    fetchCatalogue()
      .then((items) => {
        if (cancelled) return
        setProducts(items.map(toDisplayProduct))
        if (items.length === 0) setError('The collection is being restocked.')
      })
      .catch(() => !cancelled && setError('Could not load the collection.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="native-cursor min-h-[100dvh] w-full bg-[var(--void)] text-[var(--bone)]">
      <header className="sticky top-0 z-40 border-b border-[var(--whisper)]/30 bg-[var(--void)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-10">
          <Link to="/" className="font-sans text-[11px] tracking-[0.3em] uppercase text-[var(--faded)] transition-colors hover:text-[var(--bone)]">
            ← Sanctuary
          </Link>
          <span className="font-gothic text-[26px] leading-none">9ineTailss</span>
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="font-sans text-[11px] tracking-[0.3em] uppercase text-[var(--faded)] transition-colors hover:text-[var(--bone)]"
          >
            Cart {cartItems.length > 0 && `(${cartItems.reduce((n, i) => n + i.quantity, 0)})`}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-14 md:px-10 md:py-20">
        <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-[var(--blood)]">Collection 001</p>
        <h1 className="mt-4 font-gothic text-[clamp(44px,7vw,86px)] leading-[0.9]">The Catalog</h1>
        <p className="mt-4 max-w-[520px] font-serif text-[16px] italic leading-relaxed text-[var(--parchment)]">
          Made to order. Printed in small runs, shipped worldwide.
        </p>

        {loading && <p className="mt-16 font-sans text-[11px] tracking-[0.3em] uppercase text-[var(--faded)]">Loading the collection…</p>}
        {!loading && error && <p className="mt-16 font-sans text-[11px] tracking-[0.3em] uppercase text-[var(--faded)]">{error}</p>}

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8">
          {products.map((product, index) => (
            <motion.button
              key={product.slug}
              type="button"
              onClick={() => setSelected(product)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="group text-left"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden border border-[var(--whisper)]/30 bg-[var(--ash)]">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-sans text-[10px] tracking-[0.3em] uppercase text-[var(--faded)]">
                    No image
                  </div>
                )}
                {product.badge && (
                  <span className="absolute left-3 top-3 border border-[var(--whisper)]/40 bg-[var(--void)]/80 px-2 py-1 font-sans text-[9px] tracking-[0.2em] uppercase text-[var(--bone)]">
                    {product.badge}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <h2 className="font-bebas text-[20px] uppercase leading-tight tracking-[0.04em] md:text-[26px]">{product.name}</h2>
                <span className="shrink-0 font-sans text-[13px] tracking-[0.08em] text-[var(--parchment)]">{product.price}</span>
              </div>
              {product.short && <p className="mt-1 font-serif text-[13px] italic text-[var(--faded)]">{product.short}</p>}
            </motion.button>
          ))}
        </div>

        {!loading && products.length === 0 && !error && (
          <p className="mt-16 font-sans text-[11px] tracking-[0.3em] uppercase text-[var(--faded)]">
            Nothing published yet — add a piece in the admin.
          </p>
        )}
      </main>

      {selected && <ProductView product={selected} onClose={() => setSelected(null)} />}
      {/* The header's Cart button only flips context state, so the drawer has to
          be mounted here too — the walkthrough mounts its own copy. */}
      <Checkout />
    </div>
  )
}
