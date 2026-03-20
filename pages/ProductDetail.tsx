import { useState, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { ChevronLeft } from 'lucide-react';
import { useProduct } from '@/hooks/useShopify';
import { useCart } from '@/CartContext';
import { formatPrice } from '@/lib/shopify';

// Map product handles to local 3D model paths (add more as needed)
const MODEL_MAP: Record<string, string> = {
  'angel-piece': '/Angel2.glb',
  'jesus-piece': '/Jesus.glb',
  'longsword': '/longsword_3.glb',
};

function Model({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  return <primitive object={scene} />;
}

export function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const { product, loading, error } = useProduct(handle);
  const { addToCart, loading: cartLoading } = useCart();

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [added, setAdded] = useState(false);

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border border-white/20 border-t-white rounded-full animate-spin" />
          <p className="font-cinzel text-xs tracking-[0.3em] text-white/30 animate-pulse">
            LOADING...
          </p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center pt-16 gap-6">
        <p className="font-cinzel text-white/40 tracking-widest">PRODUCT NOT FOUND</p>
        <Link
          to="/shop"
          className="font-cinzel text-xs tracking-widest text-white/30 hover:text-white transition-colors border-b border-white/20 pb-0.5"
        >
          ← BACK TO SHOP
        </Link>
      </main>
    );
  }

  const variants = product.variants.edges.map(e => e.node);
  const images = product.images.edges.map(e => e.node);
  const selected = variants[selectedVariantIdx];
  const modelPath = handle ? MODEL_MAP[handle] : undefined;

  const price = selected
    ? formatPrice(selected.price.amount, selected.price.currencyCode)
    : '—';

  // Group options by name (e.g., Size, Color)
  const optionNames = [...new Set(variants.flatMap(v => v.selectedOptions.map(o => o.name)))];

  async function handleAddToCart() {
    if (!selected) return;
    await addToCart(selected.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <main className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 font-cinzel text-[10px] tracking-[0.3em] text-white/30 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft size={12} />
          SHOP
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* ── Media ─────────────────────────────────────────── */}
          <div className="space-y-4">
            {modelPath ? (
              // 3D viewer
              <div className="aspect-square bg-black/50 rounded-sm border border-white/10">
                <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }}>
                  <ambientLight intensity={0.4} />
                  <directionalLight position={[5, 5, 5]} intensity={1.5} />
                  <Suspense fallback={null}>
                    <Model path={modelPath} />
                  </Suspense>
                  <OrbitControls autoRotate autoRotateSpeed={0.8} enableZoom={false} />
                  <Environment preset="night" />
                </Canvas>
                <p className="text-center font-cinzel text-[9px] tracking-[0.3em] text-white/20 py-2">
                  DRAG TO ROTATE
                </p>
              </div>
            ) : (
              // Photo gallery
              <>
                <div className="aspect-[3/4] overflow-hidden bg-white/5 border border-white/10">
                  {images[selectedImageIdx] ? (
                    <img
                      src={images[selectedImageIdx].url}
                      alt={images[selectedImageIdx].altText ?? product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                      NO IMAGE
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIdx(i)}
                        className={`flex-shrink-0 w-16 h-16 border overflow-hidden transition-all ${
                          i === selectedImageIdx
                            ? 'border-white opacity-100'
                            : 'border-white/20 opacity-50 hover:opacity-80'
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Info ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-cinzel text-[10px] tracking-[0.4em] text-white/30 mb-2">
                9INETAILSS
              </p>
              <h1 className="font-cinzel text-3xl md:text-4xl leading-tight mb-3">
                {product.title}
              </h1>
              <p className="font-mono text-2xl text-white/80">{price}</p>
            </div>

            {/* Option selectors */}
            {optionNames.map(optionName => {
              const optionValues = [
                ...new Set(
                  variants.flatMap(v =>
                    v.selectedOptions
                      .filter(o => o.name === optionName)
                      .map(o => o.value),
                  ),
                ),
              ];
              return (
                <div key={optionName}>
                  <p className="font-cinzel text-[10px] tracking-[0.3em] text-white/40 mb-2">
                    {optionName.toUpperCase()}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {optionValues.map(value => {
                      const variantIdx = variants.findIndex(v =>
                        v.selectedOptions.some(o => o.name === optionName && o.value === value),
                      );
                      const v = variants[variantIdx];
                      const isSelected = variantIdx === selectedVariantIdx;
                      return (
                        <button
                          key={value}
                          onClick={() => setSelectedVariantIdx(variantIdx)}
                          disabled={!v?.availableForSale}
                          className={`px-4 py-2 font-cinzel text-xs tracking-wider border transition-all ${
                            isSelected
                              ? 'border-white bg-white text-black'
                              : 'border-white/25 text-white hover:border-white'
                          } disabled:opacity-25 disabled:cursor-not-allowed disabled:line-through`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={cartLoading || !selected?.availableForSale}
              className="py-4 bg-white text-black font-cinzel tracking-[0.2em] text-sm font-bold hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!selected?.availableForSale
                ? 'SOLD OUT'
                : cartLoading
                  ? 'ADDING...'
                  : added
                    ? 'ADDED ✓'
                    : 'ADD TO CART'}
            </button>

            {/* Description */}
            {product.description && (
              <div className="border-t border-white/10 pt-6">
                <p className="font-cinzel text-[10px] tracking-[0.3em] text-white/30 mb-3">
                  DETAILS
                </p>
                <p className="font-garamond text-lg text-white/60 leading-relaxed italic">
                  {product.description}
                </p>
              </div>
            )}

            {/* Trust line */}
            <p className="font-cinzel text-[9px] tracking-[0.3em] text-white/20 mt-auto">
              SECURE CHECKOUT · POWERED BY SHOPIFY
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
