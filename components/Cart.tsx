import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/CartContext';
import { formatPrice } from '@/lib/shopify';

export function CartDrawer() {
  const { cart, cartOpen, closeCart, removeFromCart, updateQuantity, goToCheckout, loading, lineCount, formattedTotal } =
    useCart();

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-white/10 z-50 flex flex-col transition-transform duration-300 ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-cinzel text-lg text-white flex items-center gap-3 tracking-widest">
            <ShoppingBag size={18} />
            CART
            {lineCount > 0 && (
              <span className="text-white/50 font-normal">({lineCount})</span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Close cart"
          >
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!cart || lineCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-white/30">
              <ShoppingBag size={48} strokeWidth={1} />
              <p className="font-cinzel text-sm tracking-widest">YOUR CART IS EMPTY</p>
            </div>
          ) : (
            cart.lines.map(line => {
              const img = line.merchandise.product.images.edges[0]?.node;
              const lineTotal = formatPrice(
                String(Number(line.merchandise.price.amount) * line.quantity),
                line.merchandise.price.currencyCode,
              );

              return (
                <div key={line.id} className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 flex-shrink-0 rounded border border-white/10 overflow-hidden bg-white/5">
                    {img ? (
                      <img
                        src={img.url}
                        alt={img.altText ?? line.merchandise.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                        —
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-cinzel truncate leading-snug">
                      {line.merchandise.product.title}
                    </p>
                    {line.merchandise.title !== 'Default Title' && (
                      <p className="text-white/40 text-xs mt-0.5">{line.merchandise.title}</p>
                    )}
                    <p className="text-white/60 text-sm font-mono mt-1">{lineTotal}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(line.id, Math.max(1, line.quantity - 1))}
                        disabled={loading || line.quantity <= 1}
                        className="w-6 h-6 border border-white/20 rounded flex items-center justify-center text-white/50 hover:border-white/50 hover:text-white transition-colors disabled:opacity-30"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-white text-sm w-4 text-center font-mono">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(line.id, line.quantity + 1)}
                        disabled={loading}
                        className="w-6 h-6 border border-white/20 rounded flex items-center justify-center text-white/50 hover:border-white/50 hover:text-white transition-colors disabled:opacity-30"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(line.id)}
                    disabled={loading}
                    className="text-white/20 hover:text-red-400 transition-colors self-start mt-1"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {lineCount > 0 && (
          <div className="p-6 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-cinzel text-sm text-white/60 tracking-widest">TOTAL</span>
              <span className="font-mono text-white text-lg">{formattedTotal}</span>
            </div>
            <button
              onClick={goToCheckout}
              disabled={loading}
              className="w-full py-4 bg-white text-black font-cinzel font-bold tracking-[0.15em] text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'LOADING...' : 'CHECKOUT →'}
            </button>
            <p className="text-white/20 text-xs text-center tracking-wider">
              SECURE CHECKOUT · POWERED BY SHOPIFY
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
