import { useProducts } from '@/hooks/useShopify';
import { ProductCard } from '@/components/ProductCard';

export function Shop() {
  const { products, loading, error } = useProducts(24);

  return (
    <main className="min-h-screen bg-black text-white pt-16">
      {/* Header */}
      <div className="border-b border-white/10 py-16 px-6 text-center">
        <p className="font-cinzel text-[10px] tracking-[0.5em] text-white/30 mb-3">
          9INETAILSS
        </p>
        <h1 className="font-fraktur text-5xl md:text-7xl mb-3">The Collection</h1>
        <p className="font-garamond italic text-white/40 text-lg">Wear Your Faith</p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border border-white/20 border-t-white rounded-full animate-spin" />
            <p className="font-cinzel text-xs tracking-[0.3em] text-white/30 animate-pulse">
              LOADING COLLECTION...
            </p>
          </div>
        )}

        {error && (
          <div className="py-32 text-center">
            <p className="font-cinzel text-sm text-red-400/80 tracking-widest mb-2">
              FAILED TO LOAD
            </p>
            <p className="text-white/30 text-xs font-mono">{error}</p>
            <p className="text-white/20 text-xs mt-4">
              Check your .env file has VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN set.
            </p>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="py-32 text-center">
            <p className="font-cinzel text-sm text-white/30 tracking-widest">
              NO PRODUCTS FOUND
            </p>
            <p className="text-white/20 text-xs mt-2">
              Add products in your Shopify Admin dashboard.
            </p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
