import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';
import PrayerRequest from './PrayerRequest';
import { fetchProducts } from '../lib/shopify';

export default function Menu({ onProductClick }: { onProductClick?: (product: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
  const [prayerRequestOpen, setPrayerRequestOpen] = useState(false);
  const [rekoeProduct, setRekoeProduct] = useState<any>(null);
  const { cartItems, setIsCheckoutOpen } = useCart();
  const { toast } = useToast();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setOverlayMessage(null);
  };

  useEffect(() => {
    fetchProducts(6).then(products => {
      const rekoe = products.find((p: any) => p.title.toUpperCase().includes('R.E.K.O.E'));
      if (rekoe) setRekoeProduct(rekoe);
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (overlayMessage) { setOverlayMessage(null); return; }
      if (isOpen) { setIsOpen(false); }
    };
    window.addEventListener('keydown', handler);
    if (isOpen) {
      document.body.classList.add('overlay-open');
    } else {
      document.body.classList.remove('overlay-open');
    }
    return () => { window.removeEventListener('keydown', handler); };
  }, [isOpen, overlayMessage]);

  const copyVerse = useCallback(async (text: string, ref: string) => {
    try {
      await navigator.clipboard.writeText(`${text} — ${ref}`);
      toast('verse copied', 'success');
    } catch {
      toast('copy failed', 'error');
    }
  }, [toast]);

  const menuItems = [
    'COLLECTION',
    'SCRIPTURE',
    'THE LORDS PRAYER',
    'PRAYER REQUEST',
    'MISSION',
    'THE ARCHITECTS',
  ];

  const prayers = [
    "Our Father in heaven.",
    "Hallowed be your name.",
    "Your kingdom come.",
    "Your will be done on earth as it is in heaven.",
    "Give us this day our daily bread.",
    "And forgive us our debts, as we also have forgiven our debtors.",
    "And lead us not into temptation.",
    "But deliver us from evil.",
    "For yours is the kingdom, and the power, and the glory forever.",
    "Amen."
  ];

  const [activePrayerIndex, setActivePrayerIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (overlayMessage === 'THE LORDS PRAYER') {
      interval = setInterval(() => {
        setActivePrayerIndex((prev) => (prev + 1) % prayers.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [overlayMessage, prayers.length]);

  const handleMenuItemClick = (item: string) => {
    if (item === 'PRAYER REQUEST') {
      setIsOpen(false);
      setTimeout(() => setPrayerRequestOpen(true), 400);
    } else {
      setOverlayMessage(item);
      setTimeout(() => setIsOpen(false), 400);
    }
  };

  const renderMenuContent = () => {
    if (!overlayMessage) return null;

    switch(overlayMessage) {
      case 'COLLECTION':
        return (
          <div className="flex flex-wrap gap-12 justify-center items-center max-w-6xl w-full mx-auto">
            {[1, 2, 3].map((i) => {
              const isRekoe = i === 1 && rekoeProduct;
              const imageUrl = isRekoe ? rekoeProduct.images.edges[0]?.node.url : null;
              return (
                <div
                  key={i}
                  className="flex flex-col gap-6 group cursor-pointer"
                  onClick={() => {
                    if (isRekoe && onProductClick) {
                      const variant = rekoeProduct.variants.edges[0]?.node;
                      const { amount, currencyCode } = rekoeProduct.priceRange.minVariantPrice;
                      const price = new Intl.NumberFormat('en-US', {
                        style: 'currency', currency: currencyCode, maximumFractionDigits: 0,
                      }).format(Number(amount));
                      onProductClick({
                        id: 1,
                        name: rekoeProduct.title.toUpperCase(),
                        price,
                        shopifyVariantId: variant?.id,
                        shopifyHandle: rekoeProduct.handle,
                        description: rekoeProduct.description ?? null,
                        image: imageUrl,
                        images: rekoeProduct.images,
                        variants: rekoeProduct.variants,
                      });
                      setOverlayMessage(null);
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="w-[320px] h-[440px] bg-[var(--whisper)]/5 border border-[var(--whisper)]/20 overflow-hidden relative transition-transform duration-700 group-hover:-translate-y-4">
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--void)]/70 to-transparent z-10" />
                    {imageUrl ? (
                      <img src={imageUrl} alt={rekoeProduct.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center font-sans text-[12px] text-[var(--bone)]/30 tracking-[0.2em] uppercase">FILE_NOT_FOUND</div>
                    )}
                  </div>
                  <div>
                    <div className="font-bebas text-[36px] tracking-[0.05em] text-[var(--bone)] group-hover:text-[var(--blood)] transition-colors duration-500">
                      {isRekoe ? rekoeProduct.title.toUpperCase() : `GARMENT ${String(i).padStart(3, '0')}`}
                    </div>
                    <div className="font-sans text-[13px] text-[var(--faded)] tracking-[0.2em] mt-1">
                      {isRekoe
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: rekoeProduct.priceRange.minVariantPrice.currencyCode,
                            maximumFractionDigits: 0,
                          }).format(Number(rekoeProduct.priceRange.minVariantPrice.amount)) + ' USD'
                        : '$120.00 USD'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'MISSION':
        return (
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="font-gothic text-[clamp(40px,8vw,100px)] text-[var(--bone)] mb-12 tracking-normal leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">The Reborn</h2>
            <div className="font-serif text-[clamp(18px,3vw,32px)] tracking-wide text-[var(--parchment)] leading-relaxed space-y-10 italic">
              <p className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">We carry the weight of our own crosses; The Lord carried the weight of our sin.</p>
              <p className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">These garments are not artifacts of the past, but statements for the reborn who walk the narrow path in absolute defiance of a fallen world.</p>
              <p className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Built to remember the one who suffered the most for us.</p>
            </div>
          </div>
        );
      case 'THE ARCHITECTS': {
        const architects = [
          {
            name: 'Jaetwin',
            role: 'Founder',
            instagram: 'jaetwin330',
            avatar: '/architects/jaetwin.jpg',
            verse: 'Proverbs 16:3',
          },
          {
            name: 'Sh0kr / Germanized',
            role: 'Co-Founder · Web Architect',
            instagram: 'purelybasedgod',
            avatar: '/architects/shokr.jpg',
            verse: 'Colossians 3:23',
          },
          {
            name: 'Jwill',
            role: 'Co-Founder',
            instagram: '5jwill5',
            avatar: '/architects/jwill.jpg',
            verse: 'Romans 8:28',
          },
        ];
        return (
          <div className="max-w-5xl mx-auto text-center px-4 py-4">
            <div className="mb-12">
              <div className="font-mono text-[10px] tracking-[0.4em] text-[var(--gold)] uppercase mb-4">
                Those who build for the reborn
              </div>
              <h2 className="font-sans text-[clamp(36px,7vw,90px)] text-[var(--bone)] tracking-[0.05em] leading-none">
                THE ARCHITECTS
              </h2>
              <div className="w-16 h-[1px] bg-[var(--whisper)]/40 mx-auto mt-8" />
            </div>
            <div className="flex flex-col md:flex-row gap-10 md:gap-6 justify-center items-center md:items-start">
              {architects.map((a, i) => (
                <motion.div
                  key={a.instagram}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-5 group w-full md:w-[280px]"
                >
                  <a
                    href={`https://www.instagram.com/${a.instagram}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block"
                    aria-label={`${a.name} on Instagram`}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--bone)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 scale-110" />
                    <div className="relative w-[140px] h-[140px] rounded-full p-[2px] bg-gradient-to-br from-[var(--whisper)]/60 via-[var(--bone)]/10 to-[var(--whisper)]/20 group-hover:from-[var(--bone)]/80 group-hover:via-[var(--gold)]/30 transition-all duration-700">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[var(--ash)]">
                        <img
                          src={a.avatar}
                          alt={a.name}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[var(--void)] border border-[var(--whisper)]/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="font-mono text-[9px] text-[var(--gold)]">IG</span>
                    </div>
                  </a>
                  <div className="flex flex-col items-center gap-2">
                    <div className="font-sans text-[clamp(20px,3vw,28px)] text-[var(--bone)] tracking-[0.08em] leading-none uppercase">{a.name}</div>
                    <div className="font-mono text-[10px] tracking-[0.25em] text-[var(--faded)] uppercase">{a.role}</div>
                    <div className="w-4 h-[1px] bg-[var(--whisper)]/30" />
                    <a
                      href={`https://www.instagram.com/${a.instagram}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] tracking-[0.2em] text-[var(--whisper)]/50 hover:text-[var(--gold)] transition-colors duration-300 uppercase"
                    >
                      @{a.instagram}
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}
              className="mt-16 flex flex-col items-center gap-3"
            >
              <div className="font-serif italic text-[15px] text-[var(--parchment)]/60 max-w-[500px] leading-relaxed">
                &quot;For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.&quot;
              </div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--faded)]/50 uppercase">— Ephesians 2:10</div>
            </motion.div>
          </div>
        );
      }

      case 'SCRIPTURE': {
        const verses = [
          { text: 'And let us not grow weary of doing good, for in due season we will reap, if we do not give up.', ref: 'Galatians 6:9' },
          { text: 'For God gave us a spirit not of fear but of power and love and self-control.', ref: '2 Timothy 1:7' },
          { text: 'I have said these things to you, that in me you may have peace. In the world you will have tribulation. But take heart; I have overcome the world.', ref: 'John 16:33' },
          { text: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me.', ref: 'Psalm 23:4' },
          { text: 'Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you.', ref: 'Isaiah 41:10' },
        ];
        return (
          <div className="max-w-4xl mx-auto text-center pb-20 mt-12 px-4">
            <h2 className="font-gothic text-[clamp(36px,7vw,90px)] text-[var(--bone)] mb-12 tracking-normal leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">The Word Of The LORD</h2>
            <div className="font-serif text-[clamp(18px,3vw,32px)] tracking-wide text-[var(--bone)] leading-relaxed space-y-12">
              {verses.map((v, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="w-[1px] h-[40px] bg-[var(--whisper)]/40 mx-auto" />}
                  <div className="flex flex-col items-center group">
                    <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
                      className="italic drop-shadow-[0_2px_8px_rgba(0,0,0,1)]"
                    >
                      &quot;{v.text}&quot;
                    </motion.p>
                    <div className="flex items-center gap-4 mt-4">
                      <p className="text-[13px] text-[var(--faded)] tracking-[0.3em] uppercase font-sans not-italic drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">– {v.ref}</p>
                      <button
                        onClick={() => copyVerse(`"${v.text}"`, v.ref)}
                        className="font-mono text-[9px] tracking-[0.2em] text-[var(--whisper)]/30 hover:text-[var(--gold)] transition-colors duration-200 uppercase opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Copy verse"
                      >
                        [ copy ]
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      }

      case 'THE LORDS PRAYER':
        return (
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center min-h-[50vh] px-4">
            <h2 className="font-gothic text-[clamp(32px,6vw,80px)] text-[var(--bone)] mb-12 tracking-normal leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">The Lords Prayer.</h2>
            <div className="relative w-full h-[200px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePrayerIndex}
                  initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                  transition={{ duration: .5, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center px-4"
                >
                  <p className="font-serif italic text-[clamp(18px,3vw,30px)] text-[var(--parchment)] leading-[1.8] drop-shadow-[0_4px_10px_rgba(0,0,0,1)]">
                    "{prayers[activePrayerIndex]}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-12 flex gap-3 flex-wrap justify-center">
              {prayers.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-[2px] transition-all duration-1000 ${idx === activePrayerIndex ? 'w-8 bg-[var(--bone)] shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-2 bg-[var(--whisper)]/30'}`}
                />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <button
        className="fixed top-7 right-8 z-[10001] w-5 h-5 focus:outline-none pointer-events-auto"
        onClick={toggleMenu}
        aria-label="Toggle Menu"
      >
        <div className={`menu-icon ${isOpen ? 'open' : ''}`}>
          <span />
          <span />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 right-0 w-[min(380px,90vw)] h-screen border-l border-[var(--iron)] pt-20 px-8 md:px-12 pb-12 z-[10000] overflow-y-auto shadow-[-20px_0_50px_rgba(0,0,0,0.8)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div
              className="absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-overlay"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')` }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--void)] via-[var(--void)]/95 to-[var(--void)]/80 backdrop-blur-3xl" />
            <div className="relative z-10 flex flex-col min-h-full">
              <div className="flex flex-col gap-4 md:gap-6 items-start">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: 'easeOut' }}
                    onClick={() => handleMenuItemClick(item)}
                    className="group relative inline-block cursor-pointer font-sans text-[24px] md:text-[30px] tracking-[0.1em] text-[var(--bone)] opacity-50 active:opacity-100 hover:opacity-100 transition-all duration-300 uppercase pb-2 pointer-events-auto"
                  >
                    {item}
                    {item === 'PRAYER REQUEST' && (
                      <span className="ml-3 font-sans text-[10px] md:text-[14px] text-[var(--blood)] tracking-[0.2em] relative top-[-4px]">✝</span>
                    )}
                    <div className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--bone)] group-hover:w-full transition-all duration-500 ease-out" />
                  </motion.div>
                ))}
                <motion.hr
                  className="w-full border-[var(--whisper)]/20 my-2"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                />
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
                  onClick={() => { setIsOpen(false); setTimeout(() => setIsCheckoutOpen(true), 100); }}
                  className="group relative cursor-pointer font-sans text-[24px] md:text-[30px] tracking-[0.1em] text-[var(--bone)] opacity-35 active:opacity-100 hover:opacity-100 transition-all duration-300 flex items-center justify-between pb-2 uppercase pointer-events-auto w-full"
                >
                  CART
                  <span className="font-sans text-[14px] md:text-[16px] text-[var(--faded)] tracking-[0.1em] mt-2">({cartItems.length})</span>
                  <div className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--bone)] group-hover:w-full transition-all duration-500 ease-out" />
                </motion.div>
              </div>
              <motion.div
                className="mt-auto pt-8 flex flex-col gap-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              >
                <div className="flex flex-col gap-1 font-mono text-[10px] tracking-[0.35em] text-[var(--whisper)]/50 uppercase">
                  <span>9INETAILSS</span>
                  <span>EST. MMXXVI</span>
                </div>
                <div className="flex items-center gap-5">
                  <a href="https://www.instagram.com/9inetailsss/" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] tracking-[0.25em] text-[var(--whisper)]/40 hover:text-[var(--bone)] transition-colors duration-300 uppercase" aria-label="Instagram">INSTAGRAM</a>
                  <div className="w-[1px] h-3 bg-[var(--whisper)]/20" />
                  <a href="https://www.tiktok.com/@9inetailss" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] tracking-[0.25em] text-[var(--whisper)]/40 hover:text-[var(--bone)] transition-colors duration-300 uppercase" aria-label="TikTok">TIKTOK</a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {overlayMessage && (
          <motion.div
            className="fixed inset-0 z-[99999] flex flex-col p-6 md:p-12 pointer-events-auto overflow-y-auto"
            initial={{ opacity: 0, filter: 'blur(20px)', scale: 1.05 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)', scale: 0.95 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Background image */}
            <div
              className="fixed inset-0 z-0 opacity-40 bg-cover bg-center mix-blend-overlay"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')` }}
            />
            {/* Full covering dark overlay — fixed so it covers while scrolling */}
   <div className="fixed inset-0 z-0 bg-[var(--void)] backdrop-blur-xl" />

            <div className="relative z-20 flex justify-start w-full mb-8 flex-shrink-0">
              <div
                className="cursor-pointer group p-3 md:p-4 border border-[var(--whisper)]/20 hover:bg-[var(--bone)] active:bg-[var(--bone)] transition-colors duration-300 pointer-events-auto"
                onClick={() => setOverlayMessage(null)}
              >
                <div className="font-sans text-[12px] md:text-[14px] text-[var(--bone)] tracking-[0.2em] group-hover:text-[var(--void)] active:text-[var(--void)] transition-colors uppercase">
                  RETURN TO SANCTUARY
                </div>
              </div>
            </div>

            <div className="relative z-10 flex-1 w-full">
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderMenuContent()}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PrayerRequest
        isOpen={prayerRequestOpen}
        onClose={() => setPrayerRequestOpen(false)}
      />
    </>
  );
}
