import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { fetchProducts, type ShopifyProduct } from '../lib/shopify';

interface Room2Props {
  isVisible: boolean;
  onProductClick: (product: any) => void;
}

// Fallback products shown when Shopify is not configured
const FALLBACK_PRODUCTS = [
  { id: 1, name: "CROWN OF THORNS HOODIE", price: "$64", rot: -2 },
  { id: 2, name: "R.E.K.O.E. TEE",         price: "$25", rot: 1.5 },
  { id: 3, name: "DRY BONES THERMAL",       price: "$60", rot: -1 },
];

// Decorative rotations cycle for Shopify products
const ROTS = [-2, 1.5, -1, 2, -1.5, 1];

function shopifyToDisplayProduct(p: ShopifyProduct, idx: number) {
  const variant = p.variants.edges[0]?.node;
  const { amount, currencyCode } = p.priceRange.minVariantPrice;
  const price = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(amount));

  return {
    id: idx + 1,        // numeric id for CartContext compatibility
    name: p.title.toUpperCase(),
    price,
    rot: ROTS[idx % ROTS.length],
    shopifyVariantId: variant?.id,
    shopifyHandle: p.handle,
    image: p.images.edges[0]?.node.url ?? null,
  };
}

export default function Room2({ isVisible, onProductClick }: Room2Props) {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS as any[]);

  useEffect(() => {
    fetchProducts(6).then(shopifyProducts => {
      if (shopifyProducts.length > 0) {
        setProducts(shopifyProducts.map(shopifyToDisplayProduct));
      }
      // If fetch returns empty (not configured), FALLBACK_PRODUCTS remain
    });
  }, []);

  if (!isVisible) return null;

  return (
    <div className="relative w-full min-h-[300vh] flex flex-col pt-[30vh] pointer-events-none">

      <div className="max-w-[800px] text-center px-6 mb-[20vh] mx-auto pointer-events-auto z-10 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Main Title Background Typography */}
          <motion.h2
            className="font-gothic text-[clamp(70px,10vw,150px)] text-[var(--bone)] leading-[0.8] tracking-normal drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] z-20 relative mb-8"
            style={{
              textShadow: "0 0 30px rgba(255, 238, 221, 0.5), 0 0 60px rgba(255, 238, 221, 0.2)"
            }}
          >
            9ineTailss
          </motion.h2>

          <div className="max-w-[700px] mx-auto bg-[var(--void)]/70 backdrop-blur-md border border-[var(--whisper)]/30 p-10 z-20 relative shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
            <div className="font-serif italic text-[22px] text-[var(--bone)] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] leading-[1.8] flex flex-wrap justify-center overflow-hidden">
              <motion.span initial={{ y: "100%", opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="inline-block mr-1">Jesus bore the weight of our sin.</motion.span>
              <motion.span initial={{ y: "100%", opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="inline-block mr-1">God himself dwelling among us.</motion.span>
              <motion.span initial={{ y: "100%", opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} className="inline-block">By his stripes we are healed.</motion.span>
            </div>
          </div>
          <div className="w-[1px] h-[80px] bg-[var(--whisper)] mx-auto mt-12 hidden md:block z-20 relative" />
        </motion.div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto px-[4vw] relative pointer-events-auto z-10">
        <div className="font-sans text-[13px] text-[var(--faded)] tracking-[0.2em] mb-24 text-center uppercase">
          [ COLLECTION 001 // THE CATALOG ]
        </div>

        <div className="flex flex-col gap-[20vh] md:gap-[30vh]">
          {products.map((p, idx) => (
            <motion.div
              key={p.id}
              className={`flex w-full items-center ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              <div
                className="w-[90vw] md:w-[48vw] lg:w-[36vw] group cursor-pointer relative"
                style={{ transform: `rotate(${p.rot}deg)` }}
                onClick={() => { console.log('CLICKED:', p); onProductClick(p); }}
              >
                <div className="absolute inset-0 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[inset_0_0_50px_rgba(255,238,221,0.05)] pointer-events-none z-10 clip-diagonal" />

                <div className="aspect-[4/5] w-full relative overflow-hidden glass-panel clip-diagonal p-1 transition-all duration-500">
                  <div className="w-full h-full relative overflow-hidden clip-diagonal bg-[var(--void)]/40 hover:bg-[var(--void)]/10 transition-colors duration-400 flex flex-col justify-between p-8 md:p-12">

                    <div className="flex justify-between items-start">
                      <div className="font-sans text-[12px] text-[var(--faded)] tracking-[0.1em] uppercase transition-colors duration-300 group-hover:text-[var(--bone)]">ITEM {String(p.id).padStart(3, '0')}</div>
                      <div className="w-8 h-8 rounded-full border border-[var(--whisper)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-[var(--bone)] hover:text-[var(--void)] group-hover:rotate-90">
                        <span className="text-[14px] font-sans">+</span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center text-center">
                      <h3 className="font-bebas text-[clamp(50px,6vw,90px)] text-[var(--bone)] tracking-[0.05em] leading-[0.85] opacity-60 group-hover:opacity-100 transition-opacity duration-300 uppercase">
                        {p.name.split(' ').map((word: string, i: number) => <div key={i}>{word}</div>)}
                      </h3>
                    </div>

                    <div className="flex justify-between items-end border-t border-[var(--whisper)] pt-6 mt-6">
                      <div className="font-sans text-[20px] text-[var(--bone)] tracking-[0.1em]">{p.price}</div>
                      <div className="font-sans text-[12px] text-[var(--faded)] tracking-[0.2em] group-hover:text-[var(--gold)] transition-colors duration-300 uppercase">ENGAGE</div>
                    </div>

                  </div>
                </div>

                <div className="absolute -bottom-8 -right-4 font-sans text-[11px] text-[var(--whisper)] tracking-[0.2em] rotate-90 origin-top-left hidden md:block uppercase">
                  AESTHETIC // WEARABLE
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
