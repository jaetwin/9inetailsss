import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';

// ─── Magnetic Micro-Interaction ──────────────────────────────────────────────
function MagneticWrapper({ children, strength = 0.3 }: { children: React.ReactNode, strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * strength, y: middleY * strength });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

interface ProductViewProps {
  product: any;
  onClose: () => void;
}

// ─── Size Guide Parser ───────────────────────────────────────────────────────
function parseDescription(description: string) {
  if (!description) return { mainText: '', sizeRows: null, htmlSizeTable: null };

  const tableMatch = description.match(/<table[\s\S]*?<\/table>/i);
  if (tableMatch) {
    const tableIndex = description.indexOf(tableMatch[0]);
    let cutStart = tableIndex;
    const before = description.slice(0, tableIndex);
    const sizeGuideLabel = before.match(/Size guide\s*$/);
    if (sizeGuideLabel) cutStart = before.length - sizeGuideLabel[0].length;

    const mainText = description.slice(0, cutStart).trim();

    const parser = new DOMParser();
    const doc = parser.parseFromString(tableMatch[0], 'text/html');
    const rows = Array.from(doc.querySelectorAll('tr'));

    let headers: string[] = [];
    const tableRows: { size: string; values: string[] }[] = [];

    rows.forEach((row, rowIdx) => {
      const cells = Array.from(row.querySelectorAll('td, th')).map(c => c.textContent?.trim() ?? '');
      if (cells.length === 0) return;
      if (rowIdx === 0) {
        headers = cells.slice(1).filter(Boolean);
        return;
      }
      const sizeLabel = cells[0];
      if (!sizeLabel) return;
      tableRows.push({ size: sizeLabel, values: cells.slice(1) });
    });

    return {
      mainText,
      sizeRows: null,
      htmlSizeTable: tableRows.length > 0 ? { headers, rows: tableRows } : null,
    };
  }

  const guideIndex = description.indexOf('Size guide');
  if (guideIndex === -1) return { mainText: description, sizeRows: null, htmlSizeTable: null };

  const mainText = description.slice(0, guideIndex).trim();
  const guideText = description.slice(guideIndex);

  const headerMatch = guideText.match(/Size guide\s+((?:[A-Z]+\s*(?:\([^)]*\))?\s*)+)/);
  if (!headerMatch) return { mainText, sizeRows: null, htmlSizeTable: null };

  const headerStr = headerMatch[1].trim();
  const headers = headerStr.match(/[A-Z]+(?:\s*\([^)]*\))?/g) ?? [];

  const afterHeader = guideText.slice(guideText.indexOf(headerStr) + headerStr.length);
  const SIZES = ['3XL', '2XL', 'XL', 'L', 'M', 'S', 'XS', 'XXL', 'XXXL'];
  const rowRegex = new RegExp(`(${SIZES.join('|')})\\s+([\\d.]+(?:\\s+[\\d.]+)*)`, 'g');

  const sizeRows: { size: string; values: string[] }[] = [];
  let match;
  while ((match = rowRegex.exec(afterHeader)) !== null) {
    sizeRows.push({ size: match[1], values: match[2].trim().split(/\s+/) });
  }

  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'];
  sizeRows.sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));

  return {
    mainText,
    sizeRows: sizeRows.length > 0 ? { headers, rows: sizeRows } : null,
    htmlSizeTable: null,
  };
}

// ─── Color name to CSS color ─────────────────────────────────────────────────
function colorToCSS(colorName: string): string {
  const map: Record<string, string> = {
    black: '#1a1a1a',
    white: '#f0ece4',
    grey: '#888888',
    gray: '#888888',
    red: '#8b1a1a',
    navy: '#1a2340',
    cream: '#f5f0e8',
    tan: '#c4a882',
    brown: '#5c3d2e',
    green: '#2d4a2d',
    blue: '#1a3a5c',
  };
  return map[colorName.toLowerCase()] ?? '#888888';
}

// ─── SMS Prompt Modal ─────────────────────────────────────────────────────────
function SmsPrompt({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);

  const handleSms = () => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isIOS) {
      window.open('sms:+18446621746&body=JOIN', '_blank');
    } else if (isAndroid) {
      window.open('sms:+18446621746?body=JOIN', '_blank');
    } else {
      if (window.postscript) {
        window.postscript.popups.open(833871, {
          activePopupBehavior: 'ALWAYS_DISMISS',
          respectPopupStatus: false,
        });
      }
    }
    setSent(true);
    setTimeout(onClose, 2000);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[10020] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-[380px] border border-[var(--whisper)]/30 bg-[var(--void)] p-10 flex flex-col items-center gap-6 text-center"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-8 h-[1px] bg-[var(--whisper)] opacity-40" />

        <div className="flex flex-col gap-2">
          <p className="font-sans text-[10px] tracking-[0.5em] text-[var(--faded)] uppercase">
            Before you go
          </p>
          <h3 className="font-serif italic text-[20px] text-[var(--bone)] leading-snug">
            Stay in the sanctuary.
          </h3>
          <p className="font-sans text-[11px] tracking-[0.1em] text-[var(--faded)] leading-relaxed mt-1">
            Get notified about drops, restocks, and early access via SMS.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="btns" className="w-full flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                onClick={handleSms}
                className="w-full bg-[var(--bone)] text-[var(--void)] font-sans text-[11px] tracking-[0.4em] uppercase py-4 hover:bg-[var(--gold)] transition-colors duration-500 cursor-pointer"
              >
                Notify Me via SMS
              </button>
              <button
                onClick={onClose}
                className="w-full bg-transparent border border-[var(--whisper)]/20 text-[var(--faded)] font-sans text-[11px] tracking-[0.3em] uppercase py-3 hover:text-[var(--bone)] hover:border-[var(--whisper)]/50 transition-all duration-500 cursor-pointer"
              >
                No thanks
              </button>
            </motion.div>
          ) : (
            <motion.p
              key="confirmed"
              className="font-sans text-[10px] tracking-[0.4em] text-[var(--bone)] uppercase"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ✦ You'll be the first to know
            </motion.p>
          )}
        </AnimatePresence>

        <div className="w-8 h-[1px] bg-[var(--whisper)] opacity-40" />
      </motion.div>
    </motion.div>
  );
}

export default function ProductView({ product, onClose }: ProductViewProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSmsPrompt, setShowSmsPrompt] = useState(false);
  const { addToCart, goToShopifyCheckout, shopifyEnabled } = useCart();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Check if user has already opted into SMS
  const hasOptedIntoSms = typeof window !== 'undefined' && localStorage.getItem('sms_opted_in') === 'true';

  useEffect(() => {
    if (window.innerWidth >= 768) {
      document.body.style.overflow = 'hidden';
    }
    document.body.classList.add('overlay-open');
    setSelectedImageIdx(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setShowSizeGuide(false);
    return () => {};
  }, [product]);

  const handleClose = () => {
    setIsExiting(true);
    document.body.style.overflow = '';
    document.body.classList.remove('overlay-open');
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleAcquire = async () => {
    if (needsSelection || isSoldOut || isCheckingOut) return;

    // Add to cart with the selected variant
    addToCart({ ...product, shopifyVariantId: selectedVariant?.id });

    if (shopifyEnabled) {
      setIsCheckingOut(true);

      // Show SMS prompt first if they haven't opted in, then redirect
      if (!hasOptedIntoSms) {
        setShowSmsPrompt(true);
        // Wait briefly for them to see/dismiss the prompt, then redirect
        setTimeout(async () => {
          await goToShopifyCheckout();
        }, 800);
      } else {
        await goToShopifyCheckout();
      }
    } else {
      // Fallback: no Shopify config, close product and open cart overlay
      handleClose();
    }
  };

  const images: { url: string; altText: string }[] =
    product.images?.edges?.map((e: any) => e.node) ??
    (product.image ? [{ url: product.image, altText: product.name }] : []);

  const imageUrl = images[selectedImageIdx]?.url ?? product.image;
  const imageAlt = images[selectedImageIdx]?.altText || product.name || product.title;
  const productName = product.name || product.title;
  const productPrice = product.price;

  const variants = product.variants?.edges?.map((e: any) => e.node) ?? [];

  const colors: string[] = [];
  variants.forEach((v: any) => {
    const colorOption = v.selectedOptions?.find((o: any) => o.name === 'Color');
    if (colorOption && !colors.includes(colorOption.value)) {
      colors.push(colorOption.value);
    }
  });

  const sizes: string[] = [];
  variants.forEach((v: any) => {
    const colorOption = v.selectedOptions?.find((o: any) => o.name === 'Color');
    const sizeOption = v.selectedOptions?.find((o: any) => o.name === 'Size');
    if (sizeOption) {
      const colorMatches = !selectedColor || colorOption?.value === selectedColor;
      if (colorMatches && !sizes.includes(sizeOption.value)) {
        sizes.push(sizeOption.value);
      }
    }
  });

  const selectedVariant = variants.find((v: any) => {
    const colorOption = v.selectedOptions?.find((o: any) => o.name === 'Color');
    const sizeOption = v.selectedOptions?.find((o: any) => o.name === 'Size');
    const colorMatch = !selectedColor || colorOption?.value === selectedColor;
    const sizeMatch = !selectedSize || sizeOption?.value === selectedSize;
    return colorMatch && sizeMatch;
  }) ?? variants[0];

  const allVariantsForColor = selectedColor
    ? variants.filter((v: any) =>
        v.selectedOptions?.find((o: any) => o.name === 'Color')?.value === selectedColor
      )
    : variants;
  const availableCount = allVariantsForColor.filter((v: any) => v.availableForSale).length;
  const isLowStock = availableCount > 0 && availableCount <= 3;
  const isSoldOut = availableCount === 0;

  const needsSelection = (colors.length > 1 && !selectedColor) || (sizes.length > 0 && !selectedSize);

  const { mainText, sizeRows, htmlSizeTable } = parseDescription(product.descriptionHtml ?? product.description ?? '');
  const activeSizeTable = htmlSizeTable ?? sizeRows;

  return (
    <>
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            className="fixed inset-0 z-[10005] flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto pointer-events-auto bg-[var(--void)]/40 backdrop-blur-3xl"
            initial={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
          <div className="fixed inset-0 z-0 bg-gradient-to-t from-[var(--void)] via-[var(--void)]/60 to-[var(--void)]/40 pointer-events-none" />
          <div className="fixed inset-0 z-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')`, backgroundSize: 'cover' }} />

          {/* Close Button */}
          <div className="fixed top-4 left-4 md:top-10 md:left-10 z-[10010]">
            <MagneticWrapper strength={0.4}>
              <div
                className="cursor-pointer group p-3 md:p-4 border border-[var(--whisper)]/20 hover:bg-[var(--bone)] active:bg-[var(--bone)] transition-all duration-700"
                onClick={handleClose}
              >
                <div className="font-sans text-[14px] text-[var(--bone)] tracking-[0.2em] group-hover:text-[var(--void)] active:text-[var(--void)] transition-all duration-700 uppercase">
                  RETURN TO SCENE
                </div>
              </div>
            </MagneticWrapper>
          </div>

          {/* Ambient background text */}
          <div className="fixed inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
            <motion.h1 className="font-bebas text-[clamp(150px,40vw,600px)] text-stroke whitespace-nowrap -rotate-12">
              {String(product.id).padStart(3, '0')}
            </motion.h1>
          </div>

          <div className="relative z-10 w-full max-w-[1200px] flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center min-h-full py-16 md:py-20 pt-20 md:pt-20">

            {/* Left Side: Thumbnails + Main Image */}
            <div className="w-full md:w-1/2 h-[40vh] md:h-full flex flex-row items-center justify-center gap-3 flex-shrink-0">

              {images.length > 1 && (
                <motion.div
                  className="flex flex-col gap-2 flex-shrink-0"
                  initial="hidden" animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.4 } }
                  }}
                >
                  {images.map((img, i) => (
                    <motion.div
                      key={i}
                      variants={{
                        hidden: { opacity: 0, scale: 0.8, x: -10 },
                        show: { opacity: 1, scale: 1, x: 0, transition: { type: 'spring' } }
                      }}
                      onClick={() => setSelectedImageIdx(i)}
                      className={`w-10 h-10 border cursor-pointer overflow-hidden transition-all duration-300 flex-shrink-0 bg-[#1c1c1c] ${
                        i === selectedImageIdx
                          ? 'border-[var(--bone)] opacity-100 scale-110'
                          : 'border-[var(--whisper)]/30 opacity-40 hover:opacity-70 hover:scale-105'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.altText}
                        className="w-full h-full object-contain"
                        style={{ background: '#1c1c1c' }}
                      />
                    </motion.div>
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

                {isSoldOut && (
                  <div className="absolute top-3 right-3 bg-[var(--void)]/80 border border-[var(--whisper)]/30 px-2 py-1">
                    <span className="font-sans text-[10px] tracking-[0.2em] text-[var(--faded)] uppercase">Sold Out</span>
                  </div>
                )}
                {isLowStock && !isSoldOut && (
                  <div className="absolute top-3 right-3 bg-[var(--void)]/80 border border-[var(--blood)]/50 px-2 py-1">
                    <span className="font-sans text-[10px] tracking-[0.2em] text-[var(--blood)] uppercase">Low Stock</span>
                  </div>
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

              {activeSizeTable && (
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
                        <div className="overflow-x-auto mb-4">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-[var(--whisper)]/30">
                                <th className="font-sans text-[10px] tracking-[0.2em] text-[var(--faded)] uppercase py-2 pr-4 whitespace-nowrap">SIZE</th>
                                {activeSizeTable.headers.map((h, i) => (
                                  <th key={i} className="font-sans text-[10px] tracking-[0.2em] text-[var(--faded)] uppercase py-2 pr-4 whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {activeSizeTable.rows.map((row, i) => (
                                <tr
                                  key={i}
                                  className={`border-b border-[var(--whisper)]/10 transition-colors duration-150 ${
                                    selectedSize === row.size ? 'bg-[var(--bone)]/5' : 'hover:bg-[var(--whisper)]/5'
                                  }`}
                                >
                                  <td className={`font-sans text-[12px] tracking-[0.15em] py-2 pr-4 whitespace-nowrap ${selectedSize === row.size ? 'text-[var(--bone)]' : 'text-[var(--faded)]'}`}>
                                    {row.size}
                                  </td>
                                  {row.values.map((val, j) => (
                                    <td key={j} className="font-sans text-[12px] text-[var(--parchment)] py-2 pr-4 whitespace-nowrap">{val}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Color selector */}
              {colors.length > 1 && (
                <motion.div
                  className="mb-6 w-full"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                >
                  <div className="font-sans text-[11px] text-[var(--faded)] tracking-[0.2em] uppercase mb-3">
                    COLOR {selectedColor && `— ${selectedColor}`}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => {
                      const colorVariants = variants.filter((v: any) =>
                        v.selectedOptions?.find((o: any) => o.name === 'Color')?.value === color
                      );
                      const colorAvailable = colorVariants.some((v: any) => v.availableForSale);
                      return (
                        <button
                          key={color}
                          onClick={() => { setSelectedColor(color); setSelectedSize(null); }}
                          title={color}
                          disabled={!colorAvailable}
                          className={`relative w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                            selectedColor === color
                              ? 'border-[var(--bone)] scale-110'
                              : 'border-[var(--whisper)]/30 hover:border-[var(--whisper)]/80'
                          } ${!colorAvailable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                          style={{ backgroundColor: colorToCSS(color) }}
                        >
                          {!colorAvailable && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-[1px] bg-[var(--faded)] rotate-45" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Size selector */}
              {sizes.length > 0 && (
                <motion.div
                  className="mb-8 w-full"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                >
                  <div className="font-sans text-[11px] text-[var(--faded)] tracking-[0.2em] uppercase mb-3">
                    SELECT SIZE {selectedSize && `— ${selectedSize}`}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const sizeVariant = variants.find((v: any) => {
                        const c = v.selectedOptions?.find((o: any) => o.name === 'Color')?.value;
                        const s = v.selectedOptions?.find((o: any) => o.name === 'Size')?.value;
                        return s === size && (!selectedColor || c === selectedColor);
                      });
                      const sizeAvailable = sizeVariant?.availableForSale ?? true;
                      return (
                        <button
                          key={size}
                          onClick={() => sizeAvailable && setSelectedSize(size)}
                          disabled={!sizeAvailable}
                          className={`relative px-4 py-2 font-sans text-[12px] tracking-[0.15em] uppercase border transition-all duration-200 ${
                            selectedSize === size
                              ? 'bg-[var(--bone)] text-[var(--void)] border-[var(--bone)]'
                              : !sizeAvailable
                              ? 'border-[var(--whisper)]/20 text-[var(--faded)]/40 cursor-not-allowed line-through'
                              : 'bg-transparent text-[var(--bone)] border-[var(--whisper)]/40 hover:border-[var(--bone)]'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Price + CTA */}
              <motion.div
                className="flex items-center gap-8 w-full border-t border-[var(--whisper)] pt-8 mb-8"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              >
                <div className="flex flex-col gap-1">
                  <div className="font-sans text-[26px] text-[var(--bone)] tracking-[0.1em]">{productPrice}</div>
                  {isSoldOut && (
                    <div className="font-sans text-[10px] tracking-[0.2em] text-[var(--faded)] uppercase">Out of stock</div>
                  )}
                  {isLowStock && !isSoldOut && (
                    <div className="font-sans text-[10px] tracking-[0.2em] text-[var(--blood)] uppercase">Low stock — order soon</div>
                  )}
                </div>
                <button
                  onClick={handleAcquire}
                  disabled={needsSelection || isSoldOut || isCheckingOut}
                  className={`flex-1 font-sans text-[14px] font-bold tracking-[0.3em] py-4 uppercase transition-all duration-700 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] ${
                    isSoldOut
                      ? 'bg-transparent border border-[var(--whisper)]/20 text-[var(--faded)]/50 cursor-pointer hover:bg-[var(--whisper)]/10 hover:text-[var(--bone)]'
                      : needsSelection
                      ? 'bg-transparent border border-[var(--whisper)]/20 text-[var(--faded)] cursor-not-allowed'
                      : isCheckingOut
                      ? 'bg-[var(--bone)]/50 text-[var(--void)]/50 border border-transparent cursor-not-allowed'
                      : 'bg-[var(--bone)] text-[var(--void)] border border-transparent hover:bg-[var(--gold)]'
                  }`}
                >
                  {isSoldOut ? 'SOLD OUT' : needsSelection ? 'SELECT A SIZE' : isCheckingOut ? 'REDIRECTING...' : 'ACQUIRE'}
                </button>
              </motion.div>

            </div>{/* End Right Side */}

          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* SMS prompt overlay — shown after tapping ACQUIRE if not yet opted in */}
      <AnimatePresence>
        {showSmsPrompt && (
          <SmsPrompt
            onClose={() => {
              localStorage.setItem('sms_opted_in', 'true');
              setShowSmsPrompt(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
