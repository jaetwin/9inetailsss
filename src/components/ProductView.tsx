import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';

interface ProductViewProps {
  product: any;
  onClose: () => void;
}

export default function ProductView({ product, onClose }: ProductViewProps) {
  const { addToCart, setIsCheckoutOpen } = useCart();

  useEffect(() => {
    // Lock body scroll when overlay is open to prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[10005] flex flex-col items-center justify-center p-8 overflow-hidden pointer-events-auto"
        initial={{ opacity: 0, filter: 'blur(20px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(20px)' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Dark Marble Cathedral Background Layer */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--void)] via-[var(--void)]/90 to-[var(--void)]/80 backdrop-blur-xl" />

        <div 
          className="absolute top-10 left-10 z-[10010] cursor-pointer group p-4 border border-[var(--whisper)]/20 hover:bg-[var(--bone)] transition-colors duration-300" 
          onClick={onClose}
        >
          <div className="font-sans text-[14px] text-[var(--bone)] tracking-[0.2em] group-hover:text-[var(--void)] transition-colors uppercase">
            RETURN TO SCENE
          </div>
        </div>

        {/* Ambient giant background text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
          <motion.h1 
            className="font-bebas text-[clamp(150px,40vw,600px)] text-stroke whitespace-nowrap -rotate-12"
          >
            {String(product.id).padStart(3, '0')}
          </motion.h1>
        </div>

        <div className="relative z-10 w-full max-w-[1200px] flex flex-col md:flex-row gap-12 items-center h-full py-20">
          
          {/* Left Side: Empty space or aesthetic graphic since no image */}
          <div className="w-full md:w-1/2 h-[50vh] md:h-full flex items-center justify-center relative">
             <motion.div 
               className="w-[80%] aspect-[3/4] glass-panel clip-diagonal border border-[var(--whisper)] flex items-center justify-center relative overflow-hidden group"
               initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
               animate={{ opacity: 1, scale: 1, rotate: product.rot || 0 }}
               transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
             >
               <div className="absolute inset-0 bg-gradient-to-tr from-[var(--void)] to-[var(--ash)] opacity-30" />
               <div className="font-sans text-[12px] tracking-[0.3em] text-[var(--faded)] -rotate-90 uppercase">
                 AESTHETIC DECAY
               </div>
             </motion.div>
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
              {product.name}
            </motion.h2>

            <motion.div 
              className="w-12 h-[1px] bg-[var(--whisper)] mb-8"
              initial={{ width: 0 }} animate={{ width: 48 }} transition={{ delay: 0.4 }}
            />

            {/* Staggered Line Reveal */}
            <div className="font-serif italic font-light text-[22px] text-[var(--parchment)] leading-[1.8] max-w-[450px] mb-12 flex flex-wrap overflow-hidden">
              <motion.span initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }} className="inline-block">Designed to honor the LORD in everything.</motion.span>
            </div>

            <motion.div 
              className="flex items-center gap-8 w-full border-t border-[var(--whisper)] pt-8"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            >
              <div className="font-sans text-[26px] text-[var(--bone)] tracking-[0.1em]">{product.price}</div>
              <button 
                onClick={() => {
                  addToCart(product);
                  onClose();
                  setIsCheckoutOpen(true);
                }}
                className="flex-1 bg-[var(--bone)] text-[var(--void)] font-sans text-[14px] font-bold tracking-[0.3em] py-4 uppercase hover:bg-[var(--gold)] transition-colors duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                ACQUIRE
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
