import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';

// ─── SMS Prompt ───────────────────────────────────────────────────────────────
function SmsPrompt({ onOptIn, onSkip }: { onOptIn: () => void; onSkip: () => void }) {
  const [sent, setSent] = useState(false);

  const handleSms = () => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isIOS) {
      window.open('sms:+18446621746&body=JOIN', '_blank');
    } else if (isAndroid) {
      window.open('sms:+18446621746?body=JOIN', '_blank');
    } else {
      if ((window as any).postscript) {
        (window as any).postscript.popups.open(833871, {
          activePopupBehavior: 'ALWAYS_DISMISS',
          respectPopupStatus: false,
        });
      }
    }
    setSent(true);
    setTimeout(onOptIn, 1800);
  };

  return (
    <motion.div
      key="sms"
      initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full items-center justify-center text-center relative z-10 gap-8"
    >
      <div className="flex flex-col gap-3">
        <p className="font-sans text-[10px] tracking-[0.5em] text-[var(--faded)] uppercase">
          Before you go
        </p>
        <h2 className="font-gothic text-[clamp(36px,5vw,60px)] text-[var(--bone)] tracking-normal leading-tight">
          Stay in the<br />Sanctuary
        </h2>
        <div className="w-8 h-[1px] bg-[var(--whisper)] opacity-40 mx-auto" />
        <p className="font-serif italic text-[var(--parchment)] text-[16px] leading-relaxed max-w-[380px] mx-auto">
          Get notified about drops, restocks, and early access via SMS.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="btns"
            className="flex flex-col gap-3 w-full max-w-[340px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <button
              onClick={handleSms}
              className="w-full bg-[var(--bone)] text-[var(--void)] font-sans font-bold text-[12px] tracking-[0.4em] uppercase py-5 hover:bg-[var(--gold)] transition-colors duration-500 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Notify Me via SMS
            </button>
            <button
              onClick={onSkip}
              className="w-full bg-transparent border border-[var(--whisper)]/20 text-[var(--faded)] font-sans text-[11px] tracking-[0.3em] uppercase py-4 hover:text-[var(--bone)] hover:border-[var(--whisper)]/50 transition-all duration-500 cursor-pointer"
            >
              No thanks
            </button>
          </motion.div>
        ) : (
          <motion.p
            key="confirmed"
            className="font-sans text-[11px] tracking-[0.4em] text-[var(--bone)] uppercase"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          >
            ✦ You'll be the first to know
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Checkout() {
  const {
    isCheckoutOpen, setIsCheckoutOpen,
    cartItems, cartTotal,
    removeFromCart, updateQuantity,
    clearCart, goToShopifyCheckout, shopifyEnabled,
  } = useCart();

  // step: 'cart' | 'sms' | 'done'
  const [step, setStep] = useState<'cart' | 'sms' | 'done'>('cart');
  const [redirecting, setRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const hasOptedIn = typeof window !== 'undefined' && localStorage.getItem('sms_opted_in') === 'true';

  useEffect(() => {
    if (isCheckoutOpen) {
      document.body.classList.add('overlay-open');
    } else {
      document.body.classList.remove('overlay-open');
    }
    return () => document.body.classList.remove('overlay-open');
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setTimeout(() => setStep('cart'), 800);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setRedirecting(true);
    setCheckoutError(null);

    // A failed checkout must never look like a completed sale: if Stripe can't
    // create the session, keep the cart and say so.
    const run = async () => {
      const error = await goToShopifyCheckout();
      if (error) {
        setCheckoutError(error);
        setRedirecting(false);
      }
    };

    if (!hasOptedIn) {
      setStep('sms');
      setTimeout(run, 1000);
    } else {
      await run();
    }
  };

  const handleSmsOptIn = () => {
    localStorage.setItem('sms_opted_in', 'true');
  };

  const handleSmsSkip = () => {
    localStorage.setItem('sms_opted_in', 'true');
    setStep('cart');
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20, filter: 'blur(5px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: -20, filter: 'blur(5px)' },
  };

  const renderCart = () => (
    <motion.div
      key="cart"
      variants={stepVariants} initial="initial" animate="animate" exit="exit"
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full"
    >
      <h2 className="font-gothic text-[clamp(36px,5vw,70px)] text-[var(--bone)] tracking-normal mb-6 md:mb-8 border-b border-[var(--whisper)]/30 pb-4 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        Cart Review
      </h2>

      <div className="flex-1 overflow-y-auto pr-1 md:pr-4 space-y-4 md:space-y-6 no-scrollbar relative z-10">
        {cartItems.length === 0 ? (
          <div className="text-[var(--faded)] font-sans text-[14px] tracking-[0.2em] italic uppercase">
            Your offering is empty.
          </div>
        ) : (
          cartItems.map((item, idx) => (
            <div key={`${item.id}-${item.shopifyVariantId ?? 'novariant'}`} className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center border border-[var(--whisper)]/20 p-4 md:p-6 bg-[var(--void)]/40 backdrop-blur-md group hover:border-[var(--bone)]/50 transition-colors duration-500 shadow-lg">
              <div>
                <div className="font-sans text-[10px] md:text-[12px] text-[var(--blood)] tracking-[0.3em] mb-1 md:mb-2 uppercase">
                  ITEM {String(item.displayIndex ?? idx + 1).padStart(3, '0')}
                </div>
                <div className="font-bebas text-[24px] md:text-[32px] tracking-[0.05em] text-[var(--bone)] group-hover:text-white transition-colors duration-500 uppercase leading-tight">
                  {item.name}
                </div>
                {item.variantLabel && (
                  <div className="font-sans text-[11px] md:text-[12px] text-[var(--faded)] tracking-[0.15em] uppercase mt-1">
                    {item.variantLabel}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 md:gap-8 flex-wrap">
                <div className="flex items-center gap-3 md:gap-4 font-sans text-[16px] md:text-[18px]">
                  <button onClick={() => updateQuantity(item.id, -1, item.shopifyVariantId)} className="text-[var(--faded)] hover:text-[var(--blood)] transition-colors duration-300 px-2 py-1 min-w-[36px] min-h-[36px] cursor-pointer">−</button>
                  <span className="text-[var(--bone)] min-w-[16px] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1, item.shopifyVariantId)} className="text-[var(--faded)] hover:text-[var(--gold)] transition-colors duration-300 px-2 py-1 min-w-[36px] min-h-[36px] cursor-pointer">+</button>
                </div>
                <div className="font-sans text-[16px] md:text-[20px] tracking-[0.1em] text-[var(--bone)] text-right">
                  ${item.price * item.quantity}
                </div>
                <button
                  onClick={() => removeFromCart(item.id, item.shopifyVariantId)}
                  className="text-[var(--faded)] hover:text-[var(--blood)] font-sans text-[10px] md:text-[11px] tracking-[0.2em] transition-colors duration-300 uppercase underline decoration-[var(--whisper)]/30 underline-offset-4 cursor-pointer"
                >
                  REMOVE
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {checkoutError && (
        <p className="mt-4 font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[var(--blood-bright)] relative z-10">
          {checkoutError}
        </p>
      )}

      <div className="mt-6 md:mt-8 pt-6 border-t border-[var(--whisper)]/30 flex justify-between items-end relative z-10">
        <div>
          <div className="font-sans text-[11px] md:text-[12px] text-[var(--faded)] tracking-[0.2em] mb-2 uppercase">SUBTOTAL</div>
          <div className="font-bebas text-[36px] md:text-[48px] text-[var(--bone)] tracking-[0.05em] leading-none">${cartTotal}</div>
        </div>
        <button
          disabled={cartItems.length === 0 || redirecting}
          onClick={handleCheckout}
          className="bg-[var(--bone)] text-[var(--void)] font-sans font-bold text-[12px] md:text-[14px] tracking-[0.3em] px-6 md:px-10 py-4 md:py-5 hover:bg-[var(--gold)] transition-colors duration-500 disabled:opacity-30 disabled:cursor-not-allowed uppercase shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] cursor-pointer"
        >
          {redirecting ? 'PREPARING...' : 'CHECKOUT'}
        </button>
      </div>
    </motion.div>
  );

  const renderDone = () => (
    <motion.div
      key="done"
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
        className="border border-[var(--whisper)]/40 text-[var(--bone)] font-sans text-[14px] tracking-[0.3em] px-12 py-5 hover:bg-[var(--bone)] hover:text-[var(--void)] transition-all duration-500 hover:tracking-[0.4em] uppercase cursor-pointer"
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
        <div className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-2xl" onClick={handleClose} />

        <div className="w-[95vw] max-w-[1000px] h-[85vh] md:h-[80vh] bg-[var(--abyss)] border border-[var(--iron)] p-5 md:p-14 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)]">

          {/* Marble texture */}
          <div
            className="absolute inset-0 z-0 opacity-[0.15] bg-cover bg-center mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')` }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--abyss)] via-transparent to-transparent opacity-80 pointer-events-none" />

          {/* Close button */}
          <div
            className="absolute top-5 right-5 md:top-8 md:right-8 z-[10030] cursor-pointer group p-3 md:p-4 border border-transparent hover:border-[var(--whisper)]/30 hover:bg-[var(--void)]/50 transition-all duration-500"
            onClick={handleClose}
          >
            <div className="font-sans text-[12px] md:text-[13px] text-[var(--bone)] tracking-[0.2em] group-hover:text-[var(--blood)] transition-colors uppercase">
              ABORT
            </div>
          </div>

          {/* Progress bar — only on cart step */}
          {step === 'cart' && (
            <div className="absolute top-0 left-0 w-full flex h-[2px] bg-[var(--void)] opacity-50 z-20">
              <div className="bg-[var(--bone)] w-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-[1200ms]" />
            </div>
          )}

          <div className="h-full relative">
            <AnimatePresence mode="wait">
              {step === 'cart' && renderCart()}
              {step === 'sms' && (
                <SmsPrompt
                  key="sms"
                  onOptIn={handleSmsOptIn}
                  onSkip={handleSmsSkip}
                />
              )}
              {step === 'done' && renderDone()}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
