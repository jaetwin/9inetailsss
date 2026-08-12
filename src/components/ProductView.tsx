import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';

// ─── Magnetic Micro-Interaction (desktop only) ───────────────────────────────
function MagneticWrapper({ children, strength = 0.3 }: { children: React.ReactNode, strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    setPosition({ x: (clientX - (left + width / 2)) * strength, y: (clientY - (top + height / 2)) * strength });
  };
  const reset = () => setPosition({ x: 0, y: 0 });
  return (
    <motion.div ref={ref} onMouseMove={handleMouse} onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >{children}</motion.div>
  );
}

interface ProductViewProps { product: any; onClose: () => void; }

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
      if (rowIdx === 0) { headers = cells.slice(1).filter(Boolean); return; }
      const sizeLabel = cells[0];
      if (!sizeLabel) return;
      tableRows.push({ size: sizeLabel, values: cells.slice(1) });
    });
    return { mainText, sizeRows: null, htmlSizeTable: tableRows.length > 0 ? { headers, rows: tableRows } : null };
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
  return { mainText, sizeRows: sizeRows.length > 0 ? { headers, rows: sizeRows } : null, htmlSizeTable: null };
}

function colorToCSS(colorName: string): string {
  const map: Record<string, string> = {
    black: '#1a1a1a', white: '#f0ece4', grey: '#888888', gray: '#888888',
    red: '#8b1a1a', navy: '#1a2340', cream: '#f5f0e8', tan: '#c4a882',
    brown: '#5c3d2e', green: '#2d4a2d', blue: '#1a3a5c',
  };
  return map[colorName.toLowerCase()] ?? '#888888';
}

export default function ProductView({ product, onClose }: ProductViewProps) {
  const [isExiting, setIsExiting] = useState(false);
  const { addToCart, setIsCheckoutOpen } = useCart();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (!isMobile) document.body.style.overflow = 'hidden';
    document.body.classList.add('overlay-open');
    setSelectedImageIdx(0); setSelectedSize(null); setSelectedColor(null); setShowSizeGuide(false);
    return () => {};
  }, [product]);

  const handleClose = () => {
    setIsExiting(true);
    document.body.style.overflow = '';
    document.body.classList.remove('overlay-open');
    setTimeout(() => onClose(), 700);
  };

  const handleAcquire = () => {
    if (needsSelection || isSoldOut) return;
    addToCart({ ...product, shopifyVariantId: selectedVariant?.id });
    handleClose();
    setTimeout(() => setIsCheckoutOpen(true), 400);
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
    const o = v.selectedOptions?.find((o: any) => o.name === 'Color');
    if (o && !colors.includes(o.value)) colors.push(o.value);
  });

  const sizes: string[] = [];
  variants.forEach((v: any) => {
    const co = v.selectedOptions?.find((o: any) => o.name === 'Color');
    const so = v.selectedOptions?.find((o: any) => o.name === 'Size');
    if (so && (!selectedColor || co?.value === selectedColor) && !sizes.includes(so.value)) sizes.push(so.value);
  });

  const selectedVariant = variants.find((v: any) => {
    const co = v.selectedOptions?.find((o: any) => o.name === 'Color');
    const so = v.selectedOptions?.find((o: any) => o.name === 'Size');
    return (!selectedColor || co?.value === selectedColor) && (!selectedSize || so?.value === selectedSize);
  }) ?? variants[0];

  const allVariantsForColor = selectedColor
    ? variants.filter((v: any) => v.selectedOptions?.find((o: any) => o.name === 'Color')?.value === selectedColor)
    : variants;
  const availableCount = allVariantsForColor.filter((v: any) => v.availableForSale).length;
  const isLowStock = availableCount > 0 && availableCount <= 3;
  const isSoldOut = availableCount === 0;
  const needsSelection = (colors.length > 1 && !selectedColor) || (sizes.length > 0 && !selectedSize);

  const { mainText, sizeRows, htmlSizeTable } = parseDescription(product.descriptionHtml ?? product.description ?? '');
  const activeSizeTable = htmlSizeTable ?? sizeRows;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-[10005] pointer-events-auto bg-[#0a0a0a]"
          initial={{ opacity: 0, filter: 'blur(20px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(20px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle bg texture */}
          <div className="absolute inset-0 z-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')`, backgroundSize: 'cover' }} />

          {/* ── MOBILE LAYOUT: stacked, fits 100dvh ── */}
          <div className="flex flex-col h-[100dvh] md:hidden relative z-10">

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
              <button onClick={handleClose}
                className="border border-[var(--whisper)]/20 px-3 py-2 font-sans text-[11px] text-[var(--bone)] tracking-[0.2em] uppercase active:bg-[var(--bone)] active:text-[var(--void)] transition-all duration-300">
                ← RETURN
              </button>
              <div className="font-sans text-[11px] text-[var(--blood)] tracking-[0.2em] uppercase">
                ITEM // {String(product.displayIndex).padStart(3, '0')}
              </div>
              {(isSoldOut || isLowStock) && (
                <div className={`font-sans text-[9px] tracking-[0.15em] uppercase px-2 py-1 border ${isSoldOut ? 'border-[var(--whisper)]/30 text-[var(--faded)]' : 'border-[var(--blood)]/50 text-[var(--blood)]'}`}>
                  {isSoldOut ? 'SOLD OUT' : 'LOW STOCK'}
                </div>
              )}
            </div>

            {/* Image area — fixed height */}
            <div className="relative flex-shrink-0 h-[38vh] flex flex-row gap-2 px-4">
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-col gap-1.5 flex-shrink-0 overflow-y-auto no-scrollbar">
                  {images.map((img, i) => (
                    <div key={i} onClick={() => setSelectedImageIdx(i)}
                      className={`w-9 h-9 flex-shrink-0 border overflow-hidden cursor-pointer transition-all duration-200 bg-[#111] ${i === selectedImageIdx ? 'border-[var(--bone)] opacity-100' : 'border-[var(--whisper)]/20 opacity-40'}`}>
                      <img src={img.url} alt={img.altText} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              )}
              {/* Main image */}
              <div className="flex-1 h-full bg-[#111] overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.img key={imageUrl} src={imageUrl} alt={imageAlt}
                    className="absolute inset-0 w-full h-full object-contain"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                </AnimatePresence>
              </div>
            </div>

            {/* Details — scrollable only if content overflows, but designed to fit */}
            <div className="flex-1 flex flex-col overflow-hidden px-4 pt-3">

              {/* Name + divider */}
              <h2 className="font-bebas text-[clamp(32px,9vw,52px)] text-[var(--bone)] leading-[0.9] tracking-[0.02em] uppercase">
                {productName}
              </h2>
              <div className="w-8 h-[1px] bg-[var(--whisper)] my-2 flex-shrink-0" />

              {/* Description — 2 lines max */}
              {mainText && (
                <p className="font-serif italic text-[12px] text-[var(--parchment)]/70 leading-[1.6] line-clamp-2 mb-2 flex-shrink-0">
                  {mainText}
                </p>
              )}

              {/* Size guide toggle */}
              {activeSizeTable && (
                <div className="flex-shrink-0 mb-2">
                  <button onClick={() => setShowSizeGuide(v => !v)}
                    className="font-sans text-[10px] text-[var(--faded)] tracking-[0.2em] uppercase flex items-center gap-1 py-1">
                    SIZE GUIDE <span className="text-[9px]">{showSizeGuide ? '▲' : '▼'}</span>
                  </button>
                  <AnimatePresence>
                    {showSizeGuide && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="overflow-x-auto pb-1">
                          <table className="text-left border-collapse w-full">
                            <thead>
                              <tr className="border-b border-[var(--whisper)]/20">
                                <th className="font-sans text-[9px] tracking-[0.15em] text-[var(--faded)] uppercase py-1 pr-3 whitespace-nowrap">SIZE</th>
                                {activeSizeTable.headers.map((h, i) => <th key={i} className="font-sans text-[9px] tracking-[0.15em] text-[var(--faded)] uppercase py-1 pr-3 whitespace-nowrap">{h}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {activeSizeTable.rows.map((row, i) => (
                                <tr key={i} className={`border-b border-[var(--whisper)]/10 ${selectedSize === row.size ? 'bg-[var(--bone)]/5' : ''}`}>
                                  <td className={`font-sans text-[11px] tracking-[0.1em] py-1 pr-3 whitespace-nowrap ${selectedSize === row.size ? 'text-[var(--bone)]' : 'text-[var(--faded)]'}`}>{row.size}</td>
                                  {row.values.map((val, j) => <td key={j} className="font-sans text-[11px] text-[var(--parchment)] py-1 pr-3 whitespace-nowrap">{val}</td>)}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Color selector */}
              {colors.length > 1 && (
                <div className="flex-shrink-0 mb-2">
                  <div className="font-sans text-[10px] text-[var(--faded)] tracking-[0.2em] uppercase mb-1.5">
                    COLOR {selectedColor && `— ${selectedColor}`}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => {
                      const avail = variants.filter((v: any) => v.selectedOptions?.find((o: any) => o.name === 'Color')?.value === color).some((v: any) => v.availableForSale);
                      return (
                        <button key={color} onClick={() => { setSelectedColor(color); setSelectedSize(null); }} disabled={!avail}
                          title={color}
                          className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 ${selectedColor === color ? 'border-[var(--bone)] scale-110' : 'border-[var(--whisper)]/30'} ${!avail ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                          style={{ backgroundColor: colorToCSS(color) }}>
                          {!avail && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-[1px] bg-[var(--faded)] rotate-45" /></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size selector */}
              {sizes.length > 0 && (
                <div className="flex-shrink-0 mb-2">
                  <div className="font-sans text-[10px] text-[var(--faded)] tracking-[0.2em] uppercase mb-1.5">
                    SIZE {selectedSize && `— ${selectedSize}`}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(size => {
                      const sv = variants.find((v: any) => v.selectedOptions?.find((o: any) => o.name === 'Size')?.value === size && (!selectedColor || v.selectedOptions?.find((o: any) => o.name === 'Color')?.value === selectedColor));
                      const avail = sv?.availableForSale ?? true;
                      return (
                        <button key={size} onClick={() => avail && setSelectedSize(size)} disabled={!avail}
                          className={`px-4 py-3 font-sans text-[11px] tracking-[0.1em] uppercase border transition-all duration-200 min-w-[48px] min-h-[44px] ${selectedSize === size ? 'bg-[var(--bone)] text-[var(--void)] border-[var(--bone)]' : !avail ? 'border-[var(--whisper)]/20 text-[var(--faded)]/40 cursor-not-allowed line-through' : 'bg-transparent text-[var(--bone)] border-[var(--whisper)]/40'}`}>
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Price + CTA — pinned to bottom */}
              <div className="flex items-center gap-4 border-t border-[var(--whisper)]/20 pt-3 pb-4 flex-shrink-0">
                <div className="flex flex-col">
                  <div className="font-sans text-[22px] text-[var(--bone)] tracking-[0.08em]">{productPrice}</div>
                  {isLowStock && !isSoldOut && <div className="font-sans text-[9px] tracking-[0.15em] text-[var(--blood)] uppercase">Low stock</div>}
                </div>
                <button onClick={handleAcquire} disabled={needsSelection || isSoldOut}
                  className={`flex-1 font-sans text-[13px] font-bold tracking-[0.3em] py-4 uppercase transition-all duration-500 ${
                    isSoldOut ? 'bg-transparent border border-[var(--whisper)]/20 text-[var(--faded)]/50 cursor-not-allowed'
                    : needsSelection ? 'bg-transparent border border-[var(--whisper)]/20 text-[var(--faded)] cursor-not-allowed'
                    : 'bg-[var(--bone)] text-[var(--void)] border border-transparent active:bg-[var(--gold)]'
                  }`}>
                  {isSoldOut ? 'SOLD OUT' : needsSelection ? 'SELECT SIZE' : 'ACQUIRE'}
                </button>
              </div>
            </div>
          </div>

          {/* ── DESKTOP LAYOUT (unchanged) ── */}
          <div className="hidden md:flex fixed inset-0 flex-col items-center justify-center p-8 overflow-y-auto z-10">
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[var(--void)] via-[var(--void)]/60 to-[var(--void)]/40 pointer-events-none" />

            {/* Close */}
            <div className="fixed top-10 left-10 z-[10010]">
              <MagneticWrapper strength={0.4}>
                <div className="cursor-pointer group p-4 border border-[var(--whisper)]/20 hover:bg-[var(--bone)] transition-all duration-700" onClick={handleClose}>
                  <div className="font-sans text-[14px] text-[var(--bone)] tracking-[0.2em] group-hover:text-[var(--void)] transition-all duration-700 uppercase">
                    RETURN TO SCENE
                  </div>
                </div>
              </MagneticWrapper>
            </div>

            <div className="relative z-10 w-full max-w-[1200px] flex flex-row gap-12 items-center py-20 pt-20">
              {/* Left: thumbnails + image */}
              <div className="w-1/2 h-full flex flex-row items-center justify-center gap-3 flex-shrink-0">
                {images.length > 1 && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {images.map((img, i) => (
                      <div key={i} onClick={() => setSelectedImageIdx(i)}
                        className={`w-10 h-10 border cursor-pointer overflow-hidden transition-all duration-300 flex-shrink-0 bg-[#1c1c1c] ${i === selectedImageIdx ? 'border-[var(--bone)] opacity-100 scale-110' : 'border-[var(--whisper)]/30 opacity-40 hover:opacity-70 hover:scale-105'}`}>
                        <img src={img.url} alt={img.altText} className="w-full h-full object-contain" style={{ background: '#1c1c1c' }} />
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex-1 aspect-[3/4] glass-panel clip-diagonal border border-[var(--whisper)] flex items-center justify-center relative overflow-hidden"
                  style={{ background: '#111111', transform: `rotate(${product.rot || 0}deg)` }}>
                  {imageUrl ? (
                    <AnimatePresence mode="wait">
                      <motion.img key={imageUrl} src={imageUrl} alt={imageAlt}
                        className="absolute inset-0 w-full h-full object-contain"
                        initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.3 }} />
                    </AnimatePresence>
                  ) : (
                    <div className="font-sans text-[12px] tracking-[0.3em] text-[var(--faded)] -rotate-90 uppercase">AESTHETIC DECAY</div>
                  )}
                  {isSoldOut && <div className="absolute top-3 right-3 bg-[var(--void)]/80 border border-[var(--whisper)]/30 px-2 py-1"><span className="font-sans text-[10px] tracking-[0.2em] text-[var(--faded)] uppercase">Sold Out</span></div>}
                  {isLowStock && !isSoldOut && <div className="absolute top-3 right-3 bg-[var(--void)]/80 border border-[var(--blood)]/50 px-2 py-1"><span className="font-sans text-[10px] tracking-[0.2em] text-[var(--blood)] uppercase">Low Stock</span></div>}
                </div>
              </div>

              {/* Right: details */}
              <div className="w-1/2 flex flex-col justify-center items-start text-left">
                <div className="font-sans text-[13px] text-[var(--blood)] tracking-[0.3em] mb-4 uppercase">ITEM // {String(product.displayIndex).padStart(3, '0')}</div>
                <h2 className="font-bebas text-[clamp(50px,6vw,100px)] text-[var(--bone)] leading-[0.85] tracking-[0.02em] uppercase mb-8">{productName}</h2>
                <div className="w-12 h-[1px] bg-[var(--whisper)] mb-8" />

                {mainText && (
                  <div className="font-serif italic font-light text-[14px] text-[var(--parchment)] leading-[1.8] max-w-[450px] mb-6 overflow-y-auto max-h-[100px] pr-2">
                    <span>{mainText}</span>
                  </div>
                )}

                {activeSizeTable && (
                  <div className="w-full mb-6">
                    <button onClick={() => setShowSizeGuide(v => !v)}
                      className="font-sans text-[11px] text-[var(--faded)] tracking-[0.2em] uppercase mb-3 hover:text-[var(--bone)] transition-colors duration-200 flex items-center gap-2">
                      SIZE GUIDE <span className="text-[10px]">{showSizeGuide ? '▲' : '▼'}</span>
                    </button>
                    <AnimatePresence>
                      {showSizeGuide && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                          <div className="overflow-x-auto mb-4">
                            <table className="w-full text-left border-collapse">
                              <thead><tr className="border-b border-[var(--whisper)]/30">
                                <th className="font-sans text-[10px] tracking-[0.2em] text-[var(--faded)] uppercase py-2 pr-4 whitespace-nowrap">SIZE</th>
                                {activeSizeTable.headers.map((h, i) => <th key={i} className="font-sans text-[10px] tracking-[0.2em] text-[var(--faded)] uppercase py-2 pr-4 whitespace-nowrap">{h}</th>)}
                              </tr></thead>
                              <tbody>
                                {activeSizeTable.rows.map((row, i) => (
                                  <tr key={i} className={`border-b border-[var(--whisper)]/10 ${selectedSize === row.size ? 'bg-[var(--bone)]/5' : 'hover:bg-[var(--whisper)]/5'}`}>
                                    <td className={`font-sans text-[12px] tracking-[0.15em] py-2 pr-4 whitespace-nowrap ${selectedSize === row.size ? 'text-[var(--bone)]' : 'text-[var(--faded)]'}`}>{row.size}</td>
                                    {row.values.map((val, j) => <td key={j} className="font-sans text-[12px] text-[var(--parchment)] py-2 pr-4 whitespace-nowrap">{val}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {colors.length > 1 && (
                  <div className="mb-6 w-full">
                    <div className="font-sans text-[11px] text-[var(--faded)] tracking-[0.2em] uppercase mb-3">COLOR {selectedColor && `— ${selectedColor}`}</div>
                    <div className="flex flex-wrap gap-3">
                      {colors.map(color => {
                        const avail = variants.filter((v: any) => v.selectedOptions?.find((o: any) => o.name === 'Color')?.value === color).some((v: any) => v.availableForSale);
                        return (
                          <button key={color} onClick={() => { setSelectedColor(color); setSelectedSize(null); }} title={color} disabled={!avail}
                            className={`relative w-8 h-8 rounded-full border-2 transition-all duration-200 ${selectedColor === color ? 'border-[var(--bone)] scale-110' : 'border-[var(--whisper)]/30 hover:border-[var(--whisper)]/80'} ${!avail ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            style={{ backgroundColor: colorToCSS(color) }}>
                            {!avail && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-[1px] bg-[var(--faded)] rotate-45" /></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sizes.length > 0 && (
                  <div className="mb-8 w-full">
                    <div className="font-sans text-[11px] text-[var(--faded)] tracking-[0.2em] uppercase mb-3">SELECT SIZE {selectedSize && `— ${selectedSize}`}</div>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map(size => {
                        const sv = variants.find((v: any) => v.selectedOptions?.find((o: any) => o.name === 'Size')?.value === size && (!selectedColor || v.selectedOptions?.find((o: any) => o.name === 'Color')?.value === selectedColor));
                        const avail = sv?.availableForSale ?? true;
                        return (
                          <button key={size} onClick={() => avail && setSelectedSize(size)} disabled={!avail}
                            className={`relative px-4 py-2 font-sans text-[12px] tracking-[0.15em] uppercase border transition-all duration-200 ${selectedSize === size ? 'bg-[var(--bone)] text-[var(--void)] border-[var(--bone)]' : !avail ? 'border-[var(--whisper)]/20 text-[var(--faded)]/40 cursor-not-allowed line-through' : 'bg-transparent text-[var(--bone)] border-[var(--whisper)]/40 hover:border-[var(--bone)]'}`}>
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-8 w-full border-t border-[var(--whisper)] pt-8 mb-8">
                  <div className="flex flex-col gap-1">
                    <div className="font-sans text-[26px] text-[var(--bone)] tracking-[0.1em]">{productPrice}</div>
                    {isSoldOut && <div className="font-sans text-[10px] tracking-[0.2em] text-[var(--faded)] uppercase">Out of stock</div>}
                    {isLowStock && !isSoldOut && <div className="font-sans text-[10px] tracking-[0.2em] text-[var(--blood)] uppercase">Low stock — order soon</div>}
                  </div>
                  <button onClick={handleAcquire} disabled={needsSelection || isSoldOut}
                    className={`flex-1 font-sans text-[14px] font-bold tracking-[0.3em] py-4 uppercase transition-all duration-700 ${isSoldOut ? 'bg-transparent border border-[var(--whisper)]/20 text-[var(--faded)]/50 cursor-not-allowed' : needsSelection ? 'bg-transparent border border-[var(--whisper)]/20 text-[var(--faded)] cursor-not-allowed' : 'bg-[var(--bone)] text-[var(--void)] border border-transparent hover:bg-[var(--gold)] cursor-pointer'}`}>
                    {isSoldOut ? 'SOLD OUT' : needsSelection ? 'SELECT A SIZE' : 'ACQUIRE'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
