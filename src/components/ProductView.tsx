import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';

interface ProductViewProps {
  product: any;
  onClose: () => void;
}

// ─── Size Guide Parser ───────────────────────────────────────────────────────
// Detects "Size guide LENGTH (cm) WIDTH (cm) S 69.9 45.7 ..." pattern
// and returns { mainText, sizeRows } where sizeRows is a parsed table
function parseDescription(description: string) {
  if (!description) return { mainText: '', sizeRows: null };

  const guideIndex = description.indexOf('Size guide');
  if (guideIndex === -1) return { mainText: description, sizeRows: null };

  const mainText = description.slice(0, guideIndex).trim();
  const guideText = description.slice(guideIndex);

  // Extract header columns e.g. LENGTH (cm) WIDTH (cm)
  const headerMatch = guideText.match(/Size guide\s+((?:[A-Z]+\s*(?:\([^)]*\))?\s*)+)/);
  if (!headerMatch) return { mainText, sizeRows: null };

  const headerStr = headerMatch[1].trim();
  // Split header into columns: ["LENGTH (cm)", "WIDTH (cm)"]
  const headers = headerStr.match(/[A-Z]+(?:\s*\([^)]*\))?/g) ?? [];

  // After the header, parse rows like "S 69.9 45.7"
  const afterHeader = guideText.slice(guideText.indexOf(headerStr) + headerStr.length);
  const SIZES = ['3XL', '2XL', 'XL', 'L', 'M', 'S', 'XS', 'XXL', 'XXXL'];
  const rowRegex = new RegExp(`(${SIZES.join('|')})\\s+([\\d.]+(?:\\s+[\\d.]+)*)`, 'g');

  const sizeRows: { size: string; values: string[] }[] = [];
  let match;
  while ((match = rowRegex.exec(afterHeader)) !== null) {
    const size = match[1];
    const values = match[2].trim().split(/\s+/);
    sizeRows.push({ size, values });
  }

  // Sort by size order
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'];
  sizeRows.sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));

  return { mainText, sizeRows: sizeRows.length > 0 ? { headers, rows: sizeRows } : null };
}

export default function ProductView({ product, onClose }: ProductViewProps) {
  const { addToCart, setIsCheckoutOpen } = useCart();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setSelectedImageIdx(0);
    setSelectedSize(null);
    setShowSizeGuide(false);
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [product]);

  const images: { url: string; altText: string }[] =
    product.images?.edges?.map((e: any) => e.node) ??
    (product.image ? [{ url: product.image, altText: product.name }] : []);

  const imageUrl = images[selectedImageIdx]?.url ?? product.image;
  const imageAlt = images[selectedImageIdx]?.altText || product.name || product.title;
  const productName = product.name || product.title;
  const productPrice = product.price;

  const variants = product.variants?.edges?.map((e: any) => e.node) ?? [];
  const sizes: string[] = [];
  variants.forEach((v: any) => {
    const sizeOption = v.selectedOptions?.find((o: any) => o.name === 'Size');
    if (sizeOption && !sizes.includes(sizeOption.value)) {
      sizes.push(sizeOption.value);
    }
  });

  const selectedVariant = selectedSize
    ? variants.find((v: any) =>
        v.selectedOptions?.some((o: any) => o.name === 'Size' && o.value === selectedSize)
      )
    : variants[0];

  const { mainText, sizeRows } = parseDescription(product.description ?? '');

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10005] flex flex-col items-center justify-center p-8 overflow-hidden pointer-events-auto"
        initial={{ opacity: 0, filter: 'blur(20px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(20px)' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Background */}
        <div
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--void)] via-[var(--void)]/90 to-[var(--void)]/80 backdrop-blur-xl" />

        {/* Close Button */}
        <div
          className="absolute top-10 left-10 z-[10010] cursor-pointer group p-4 border border-[var(--whisper)]/20 hover:bg-[var(--bone)] transition-colors duration-300"
          onClick={onClose}
        >
          <div className="font-sans text-[14px] text-[var(--bone)] tracking-[0.2em] group-hover:text-[var(--void)] transition-colors uppercase">
            RETURN TO SCENE
          </div>
        </div>

        {/* Ambient background text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
          <motion.h1 className="font-bebas text-[clamp(150px,40vw,600px)] text-stroke whitespace-nowrap -rotate-12">
            {String(product.id).padStart(3, '0')}
          </motion.h1>
        </div>

        <div className="relative z-10 w-full max-w-[1200px] flex flex-col md:flex-row gap-12 items-center h-full py-20">

          {/* Left Side: Thumbnails + Main Image */}
          <div className="w-full md:w-1/2 h-[50vh] md:h-full flex flex-row items-center justify-center gap-3">

            {images.length > 1 && (
              <motion.div
                className="flex flex-col gap-2 flex-shrink-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImageIdx(i)}
                    className={`w-10 h-10 border cursor-pointer overflow-hidden transition-all duration-300 flex-shrink-0 bg-[#1c1c1c] ${
                      i === selectedImageIdx
                        ? 'border-[var(--bone)] opacity-100'
                        : 'border-[var(--whisper)]/30 opacity-40 hover:opacity-70'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.altText}
                      className="w-full h-full object-contain"
                      style={{ background: '#1c1c1c' }}
                    />
                  </div>
                ))}
              </motion.div>
            )}

            <div
              className="flex-1 aspect-[3/4] glass-panel clip-diagonal border border-[var(--whisper)] flex items-center justify-center relative overflow-hidden"
              style={{ background: '#111111', transform: `rotate(${product.rot || 0}deg)` }}
            >
              {imageUrl ? (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={imageUrl}
                    src={imageUrl}
                    alt={imageAlt}
                    className="absolute inset-0 w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  />
                </AnimatePresence>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--void)] to-[var(--ash)] opacity-30" />
                  <div className="font-sans text-[12px] tracking-[0.3em] text-[var(--faded)] -rotate-90 uppercase">AESTHETIC DECAY</div>
                </>
              )}
            </div>

          </div>{/* End Left Side */}

          {/* Right Side: Product Details */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-start text-left">

            <motion.div
              className="font-sans text-[13px] text-[var(--blood)] tracking-[0.3em] mb-4 uppercase"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            >
              ITEM // {String(product.id).padStart(3, '0')}
            </motion.div>

            <motion.h2
              className="font-bebas text-[clamp(50px,6vw,100px)] text-[var(--bone)] leading-[0.85] tracking-[0.02em] uppercase mb-8"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            >
              {productName}
            </motion.h2>

            <motion.div
              className="w-12 h-[1px] bg-[var(--whisper)] mb-8"
              initial={{ width: 0 }} animate={{ width: 48 }} transition={{ delay: 0.4 }}
            />

            {/* Description */}
            {mainText && (
              <div className="font-serif italic font-light text-[14px] text-[var(--parchment)] leading-[1.8] max-w-[450px] mb-6 overflow-y-auto max-h-[100px] pr-2">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="inline-block"
                >
                  {mainText}
                </motion.span>
              </div>
            )}

            {/* Size Guide Toggle + Table */}
            {sizeRows && (
              <motion.div
                className="w-full mb-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              >
                <button
                  onClick={() => setShowSizeGuide(v => !v)}
                  className="font-sans text-[11px] text-[var(--faded)] tracking-[0.2em] uppercase mb-3 hover:text-[var(--bone)] transition-colors duration-200 flex items-center gap-2"
                >
                  SIZE GUIDE
                  <span className="text-[10px]">{showSizeGuide ? '▲' : '▼'}</span>
                </button>

                <AnimatePresence>
                  {showSizeGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <table className="w-full text-left border-collapse mb-4">
                        <thead>
                          <tr className="border-b border-[var(--whisper)]/30">
                            <th className="font-sans text-[10px] tracking-[0.2em] text-[var(--faded)] uppercase py-2 pr-4">SIZE</th>
                            {sizeRows.headers.map((h, i) => (
                              <th key={i} className="font-sans text-[10px] tracking-[0.2em] text-[var(--faded)] uppercase py-2 pr-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sizeRows.rows.map((row, i) => (
                            <tr
                              key={i}
                              className={`border-b border-[var(--whisper)]/10 transition-colors duration-150 ${
                                selectedSize === row.size ? 'bg-[var(--bone)]/5' : 'hover:bg-[var(--whisper)]/5'
                              }`}
                            >
                              <td className={`font-sans text-[12px] tracking-[0.15em] py-2 pr-4 ${selectedSize === row.size ? 'text-[var(--bone)]' : 'text-[var(--faded)]'}`}>
                                {row.size}
                              </td>
                              {row.values.map((val, j) => (
                                <td key={j} className="font-sans text-[12px] text-[var(--parchment)] py-2 pr-4">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
              <motion.div
                className="mb-8 w-full"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              >
                <div className="font-sans text-[11px] text-[var(--faded)] tracking-[0.2em] uppercase mb-3">
                  SELECT SIZE {selectedSize && `— ${selectedSize}`}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 font-sans text-[12px] tracking-[0.15em] uppercase border transition-all duration-200 ${
                        selectedSize === size
                          ? 'bg-[var(--bone)] text-[var(--void)] border-[var(--bone)]'
                          : 'bg-transparent text-[var(--bone)] border-[var(--whisper)]/40 hover:border-[var(--bone)]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              className="flex items-center gap-8 w-full border-t border-[var(--whisper)] pt-8"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            >
              <div className="font-sans text-[26px] text-[var(--bone)] tracking-[0.1em]">{productPrice}</div>
              <button
                onClick={() => {
                  if (selectedVariant) {
                    addToCart({ ...product, shopifyVariantId: selectedVariant.id });
                  } else {
                    addToCart(product);
                  }
                  onClose();
                  setIsCheckoutOpen(true);
                }}
                className={`flex-1 font-sans text-[14px] font-bold tracking-[0.3em] py-4 uppercase transition-colors duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] ${
                  sizes.length > 0 && !selectedSize
                    ? 'bg-[var(--whisper)]/20 text-[var(--faded)] cursor-not-allowed'
                    : 'bg-[var(--bone)] text-[var(--void)] hover:bg-[var(--gold)]'
                }`}
                disabled={sizes.length > 0 && !selectedSize}
              >
                {sizes.length > 0 && !selectedSize ? 'SELECT A SIZE' : 'ACQUIRE'}
              </button>
            </motion.div>

          </div>{/* End Right Side */}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
