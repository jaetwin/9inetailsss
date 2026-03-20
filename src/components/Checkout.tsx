import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';

export default function Checkout() {
  const { isCheckoutOpen, setIsCheckoutOpen, cartItems, cartTotal, removeFromCart, updateQuantity, clearCart, goToShopifyCheckout, shopifyEnabled } = useCart();
  const [step, setStep] = useState(1);
  const [redirecting, setRedirecting] = useState(false);

  if (!isCheckoutOpen) return null;

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setTimeout(() => setStep(1), 800);
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20, filter: 'blur(5px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: -20, filter: 'blur(5px)' }
  };

  const renderStep1 = () => (
    <motion.div 
      key="step1"
      variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full"
    >
      <h2 className="font-gothic text-[clamp(40px,5vw,70px)] text-[var(--bone)] tracking-normal mb-8 border-b border-[var(--whisper)]/30 pb-4 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        Cart Review
      </h2>
      
      <div className="flex-1 overflow-y-auto pr-4 space-y-6 no-scrollbar relative z-10">
        {cartItems.length === 0 ? (
          <div className="text-[var(--faded)] font-sans text-[14px] tracking-[0.2em] italic uppercase">
            Your offering is empty.
          </div>
        ) : (
          cartItems.map(item => (
            <div key={item.id} className="flex justify-between items-center border border-[var(--whisper)]/20 p-6 bg-[var(--void)]/40 backdrop-blur-md group hover:border-[var(--bone)]/50 transition-colors duration-500 shadow-lg">
              <div>
                <div className="font-sans text-[12px] text-[var(--blood)] tracking-[0.3em] mb-2 uppercase">
                  ITEM 00{item.id}
                </div>
                <div className="font-bebas text-[32px] tracking-[0.05em] text-[var(--bone)] group-hover:text-white transition-colors duration-500 uppercase">
                  {item.name}
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-4 font-sans text-[18px]">
                  <button onClick={() => updateQuantity(item.id, -1)} className="text-[var(--faded)] hover:text-[var(--blood)] transition-colors duration-300 px-2 py-1">−</button>
                  <span className="text-[var(--bone)]">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="text-[var(--faded)] hover:text-[var(--gold)] transition-colors duration-300 px-2 py-1">+</button>
                </div>
                <div className="font-sans text-[20px] tracking-[0.1em] text-[var(--bone)] w-[100px] text-right">
                  ${item.price * item.quantity}
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-[var(--faded)] hover:text-[var(--blood)] font-sans text-[11px] tracking-[0.2em] transition-colors duration-300 uppercase underline decoration-[var(--whisper)]/30 underline-offset-4"
                >
                  REMOVE
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--whisper)]/30 flex justify-between items-end relative z-10">
        <div>
          <div className="font-sans text-[12px] text-[var(--faded)] tracking-[0.2em] mb-2 uppercase">SUBTOTAL</div>
          <div className="font-bebas text-[48px] text-[var(--bone)] tracking-[0.05em] leading-none">${cartTotal}</div>
        </div>
        
        <button 
          disabled={cartItems.length === 0}
          onClick={() => setStep(2)}
          className="bg-[var(--bone)] text-[var(--void)] font-sans font-bold text-[14px] tracking-[0.3em] px-10 py-5 hover:bg-[var(--gold)] transition-colors duration-500 disabled:opacity-30 disabled:cursor-not-allowed uppercase shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          PROCEED TO SHIPPING
        </button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div 
      key="step2"
      variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full"
    >
      <h2 className="font-gothic text-[clamp(40px,5vw,70px)] text-[var(--bone)] tracking-normal mb-8 border-b border-[var(--whisper)]/30 pb-4 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        Shipping Identity
      </h2>
      <div className="flex-1 overflow-y-auto space-y-8 relative z-10 pt-4">
        <input type="text" placeholder="FULL NAME" className="w-full bg-transparent border-b border-[var(--whisper)]/30 p-4 font-sans text-[16px] tracking-[0.1em] text-[var(--bone)] outline-none focus:border-[var(--bone)] placeholder:text-[var(--faded)] transition-colors duration-500" />
        <input type="email" placeholder="EMAIL ADDRESS" className="w-full bg-transparent border-b border-[var(--whisper)]/30 p-4 font-sans text-[16px] tracking-[0.1em] text-[var(--bone)] outline-none focus:border-[var(--bone)] placeholder:text-[var(--faded)] transition-colors duration-500" />
        <textarea placeholder="SHIPPING ADDRESS" rows={3} className="w-full bg-transparent border-b border-[var(--whisper)]/30 p-4 font-sans text-[16px] tracking-[0.1em] text-[var(--bone)] outline-none focus:border-[var(--bone)] placeholder:text-[var(--faded)] transition-colors duration-500 resize-none" />
      </div>
      <div className="mt-8 pt-6 border-t border-[var(--whisper)]/30 flex justify-between relative z-10">
        <button onClick={() => setStep(1)} className="text-[var(--faded)] hover:text-[var(--bone)] font-sans text-[13px] tracking-[0.2em] transition-colors duration-300 uppercase">
          ← RETURN
        </button>
        <button onClick={() => setStep(3)} className="bg-[var(--bone)] text-[var(--void)] font-sans font-bold text-[14px] tracking-[0.3em] px-10 py-5 hover:bg-[var(--gold)] transition-colors duration-500 uppercase shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
          CONTINUE TO PAYMENT
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full"
    >
      <h2 className="font-gothic text-[clamp(40px,5vw,70px)] text-[var(--bone)] tracking-normal mb-8 border-b border-[var(--whisper)]/30 pb-4 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        Secure Garments
      </h2>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10">
        <div className="font-bebas text-[clamp(48px,6vw,80px)] text-[var(--bone)] tracking-[0.05em] leading-none">
          TOTAL: ${cartTotal}
        </div>

        <div className="max-w-[500px] text-center space-y-4">
          <p className="font-serif italic text-[var(--parchment)] text-[18px] leading-relaxed">
            You will be taken to Shopify's secure checkout to complete your order.
          </p>
          <p className="font-sans text-[11px] text-[var(--faded)] tracking-[0.25em] uppercase">
            Payment · Shipping · Order Confirmation — all handled securely by Shopify
          </p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--whisper)]/30 flex justify-between items-center relative z-10">
        <button onClick={() => setStep(2)} className="text-[var(--faded)] hover:text-[var(--bone)] font-sans text-[13px] tracking-[0.2em] transition-colors duration-300 uppercase">
          ← RETURN
        </button>
        <button
          disabled={redirecting}
          onClick={async () => {
            if (shopifyEnabled) {
              setRedirecting(true);
              await goToShopifyCheckout();
              // If checkout URL was null (items have no variant IDs), fall back to confirmation
              setRedirecting(false);
              clearCart();
              setStep(4);
            } else {
              // Shopify not configured — show confirmation anyway (dev/demo mode)
              clearCart();
              setStep(4);
            }
          }}
          className="bg-[var(--bone)] text-[var(--void)] font-sans font-bold text-[14px] tracking-[0.3em] px-10 py-5 hover:bg-[var(--gold)] transition-colors duration-500 uppercase shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-50"
        >
          {redirecting ? 'PREPARING...' : 'SEAL THE GARMENTS'}
        </button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div 
      key="step4"
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full items-center justify-center text-center relative z-10"
    >
      <h2 className="font-gothic text-[clamp(60px,8vw,110px)] text-[var(--bone)] tracking-normal mb-8 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
        Garments Sealed
      </h2>
      <p className="font-serif italic text-[var(--parchment)] text-[24px] mb-16 max-w-[600px] leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        Your order has been accepted. The garments will be prepared soon.
      </p>
      <button 
        onClick={handleClose} 
        className="border border-[var(--whisper)]/40 text-[var(--bone)] font-sans text-[14px] tracking-[0.3em] px-12 py-5 hover:bg-[var(--bone)] hover:text-[var(--void)] transition-all duration-500 hover:tracking-[0.4em] uppercase"
      >
        RETURN TO SANCTUARY
      </button>
    </motion.div>
  );

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[10020] flex justify-center items-center pointer-events-auto overflow-hidden"
        initial={{ opacity: 0, filter: 'blur(20px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(20px)' }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Deep background blur / overlay directly behind the modal */}
        <div className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-2xl transition-all duration-1000" onClick={handleClose} />

        {/* Modal Container */}
        <div className="w-[95vw] max-w-[1000px] h-[85vh] md:h-[80vh] bg-[var(--abyss)] border border-[var(--iron)] p-8 md:p-14 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)]">
          
          {/* Marble Texture Background */}
          <div 
            className="absolute inset-0 z-0 opacity-[0.15] bg-cover bg-center mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')` }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--abyss)] via-transparent to-transparent opacity-80 pointer-events-none" />

          {/* Close Button */}
          <div className="absolute top-8 right-8 z-[10030] cursor-pointer group p-4 border border-transparent hover:border-[var(--whisper)]/30 hover:bg-[var(--void)]/50 transition-all duration-500" onClick={handleClose}>
            <div className="font-sans text-[13px] text-[var(--bone)] tracking-[0.2em] group-hover:text-[var(--blood)] transition-colors uppercase">
              ABORT
            </div>
          </div>

          {/* Step Indicator Line */}
          {step < 4 && (
            <div className="absolute top-0 left-0 w-full flex h-[2px] bg-[var(--void)] opacity-50 z-20">
              <div className="bg-[var(--bone)] transition-all duration-[1200ms] ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          )}

          {/* Render Active Step with AnimatePresence */}
          <div className="h-full relative">
             <AnimatePresence mode="wait">
               {step === 1 && renderStep1()}
               {step === 2 && renderStep2()}
               {step === 3 && renderStep3()}
               {step === 4 && renderStep4()}
             </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
