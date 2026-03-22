import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';

interface ProductViewProps {
  product: any;
  onClose: () => void;
}

export default function ProductView({ product, onClose }: ProductViewProps) {
  const { addToCart, setIsCheckoutOpen } = useCart();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setSelectedImageIdx(0);
    setSelectedSize(null);
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [product]);

  // Extract all images
  const images: { url: string; altText: string }[] =
    product.images?.edges?.map((e: any) => e.node) ??
    (product.image ? [{ url: product.image, altText: product.name }] : []);

  const imageUrl = images[selectedImageIdx]?.url ?? product.image;
  const imageAlt = images[selectedImageIdx]?.altText || product.name || product.title;
  const productName = product.name || product.title;
  const productPrice = product.price;

  // Extract sizes from variants
  const variants = product.variants?.edges?.map((e: any) => e.node) ?? [];
  const sizes: string[] = [];
  variants.forEach((v: any) => {
    const sizeOption = v.selectedOptions?.find((o: any) => o.name === 'Size');
    if (sizeOption && !sizes.includes(sizeOption.value)) {
      sizes.push(sizeOption.value);
    }
  });

  // Find variant matching selected size
  const selectedVariant = selectedSize
    ? variants.find((v: any) =>
        v.selectedOptions?.some((o: any) => o.name === 'Size' && o.value === selectedSize)
      )
    : variants[0];

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

          {/* Left Side: Image + Thumbnails */}
          <div className="w-full md:w-1/2 h-[50vh] md:h-full flex flex-col items-center justify-center gap-4">

            {/* Main Image Frame */}
            <motion.div
              className="w-[75%] aspect-[3/4] glass-panel clip-diagonal border border-[var(--whisper)] flex items-center justify-center relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: product.rot || 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--void)] to-[var(--ash)] opacity-30" />
                  <div className="font-sans text-[12px] tracking-[0.3em] text-[var(--faded)] -rotate-90 uppercase">AESTHETIC DECAY</div>
                </>
              )}
            </motion.div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <motion.div
                className="flex gap-2 mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImageIdx(i)}
                    className={`w-12 h-12 border cursor-pointer overflow-hidden transition-all duration-300 ${
                      i === selectedImageIdx
                        ? 'border-[var(--bone)] opacity-100'
                        : 'border-[var(--whisper)]/30 opacity-40 hover:opacity-70'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.altText}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </div>

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

            <div className="font-serif italic font-light text-[22px] text-[var(--parchment)] leading-[1.8] max-w-[450px] mb-8 flex flex-wrap overflow-hidden">
              <motion.span initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }} className="inline-block">
                Designed to honor the LORD in everything.
              </motion.span>
            </div>

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
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
