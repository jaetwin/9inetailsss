import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';

export default function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
  const { cartItems, setIsCheckoutOpen } = useCart();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setOverlayMessage(null);
  };

  const menuItems = [
    'COLLECTION',
    'LOOKBOOK',
    'SCRIPTURE',
    'PRAY WITH ME',
    'MISSION',
    'ARCHIVE',
  ];

  const prayers = [
    "Our Father in heaven.",
    "Hallowed be your name.",
    "Your kingdom come.",
    "Your kingdom come.",
    "On earth as it is in heaven.",
    "Give us this day our daily bread.",
    "And forgive us our debts.",
    "As we also have forgiven our debtors.",
    "And lead us not into temptation.",
    "But deliver us from evil."
  ];

  const [activePrayerIndex, setActivePrayerIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (overlayMessage === 'PRAY WITH ME') {
      interval = setInterval(() => {
        setActivePrayerIndex((prev) => (prev + 1) % prayers.length);
      }, 5000); // 7 seconds per prayer
    }
    return () => clearInterval(interval);
  }, [overlayMessage, prayers.length]);

  const renderMenuContent = () => {
    if (!overlayMessage) return null;

    switch(overlayMessage) {
      case 'COLLECTION':
        return (
          <div className="flex flex-wrap gap-12 justify-center items-center max-w-6xl w-full mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-6 group">
                <div className="w-[320px] h-[440px] bg-[var(--whisper)]/5 border border-[var(--whisper)]/20 overflow-hidden relative transition-transform duration-700 group-hover:-translate-y-4">
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--void)]/70 to-transparent z-10" />
                  <div className="absolute inset-0 flex items-center justify-center font-sans text-[12px] text-[var(--bone)]/30 tracking-[0.2em] uppercase">FILE_NOT_FOUND</div>
                </div>
                <div>
                  <div className="font-bebas text-[36px] tracking-[0.05em] text-[var(--bone)] group-hover:text-[var(--blood)] transition-colors duration-500">
                    GARMENT {String(i).padStart(3, '0')}
                  </div>
                  <div className="font-sans text-[13px] text-[var(--faded)] tracking-[0.2em] mt-1">$120.00 USD</div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'MISSION':
        return (
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-gothic text-[clamp(60px,8vw,100px)] text-[var(--bone)] mb-12 tracking-normal leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">The Reborn</h2>
            <div className="font-serif text-[clamp(24px,3vw,32px)] tracking-wide text-[var(--parchment)] leading-relaxed space-y-10 italic">
              <p className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">We carry the weight of our own crosses; The Lord carried the weight of our sin.</p>
              <p className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">These garments are not artifacts of the past, but statements for the reborn who walk the narrow path in absolute defiance of a fallen world.</p>
              <p className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Built to remember the one who suffered the most for us.</p>
            </div>
          </div>
        );
      case 'LOOKBOOK':
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-6xl mx-auto gap-12">
            <h2 className="font-gothic text-[clamp(50px,6vw,80px)] text-[var(--bone)] tracking-normal mb-8 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">Glorifying Garments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/5] bg-[var(--whisper)]/5 border border-[var(--whisper)]/20 overflow-hidden relative group cursor-pointer">
                  <div className="absolute inset-0 bg-[var(--void)]/50 group-hover:bg-transparent transition-colors duration-700" />
                  <div className="absolute bottom-6 left-6 font-sans text-[12px] text-[var(--bone)]/50 tracking-[0.2em] uppercase transition-opacity duration-500 group-hover:opacity-100">{`VISUAL 00${i}`}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'SCRIPTURE':
        return (
          <div className="max-w-4xl mx-auto text-center pb-20 mt-12">
             <h2 className="font-gothic text-[clamp(50px,7vw,90px)] text-[var(--bone)] mb-20 tracking-normal leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">The Word Of The LORD</h2>
             <div className="font-serif text-[clamp(24px,3vw,32px)] tracking-wide text-[var(--bone)] leading-relaxed space-y-16">
                
                <div className="flex flex-col items-center">
                  <div className="overflow-hidden">
                    <motion.p initial={{ y: "100%" }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">"And let us not grow weary of doing good, for in due season we will reap, if we do not give up."</motion.p>
                  </div>
                  <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }} className="text-[14px] text-[var(--faded)] tracking-[0.3em] uppercase mt-6 font-sans not-italic drop-shadow-none">– Galatians 6:9</motion.p>
                </div>
                
                <div className="w-[1px] h-[60px] bg-[var(--whisper)]/40 mx-auto" />
                
                <div className="flex flex-col items-center">
                  <div className="overflow-hidden">
                    <motion.p initial={{ y: "100%" }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">"For God gave us a spirit not of fear but of power and love and self-control."</motion.p>
                  </div>
                  <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }} className="text-[14px] text-[var(--faded)] tracking-[0.3em] uppercase mt-6 font-sans not-italic drop-shadow-none">– 2 Timothy 1:7</motion.p>
                </div>
                
                <div className="w-[1px] h-[60px] bg-[var(--whisper)]/40 mx-auto" />
                
                <div className="flex flex-col items-center">
                  <div className="overflow-hidden">
                    <motion.p initial={{ y: "100%" }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">"I have said these things to you, that in me you may have peace. In the world you will have tribulation. But take heart; I have overcome the world."</motion.p>
                  </div>
                  <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }} className="text-[14px] text-[var(--faded)] tracking-[0.3em] uppercase mt-6 font-sans not-italic drop-shadow-none">– John 16:33</motion.p>
                </div>
                
                <div className="w-[1px] h-[60px] bg-[var(--whisper)]/40 mx-auto" />
                
                <div className="flex flex-col items-center">
                  <div className="overflow-hidden">
                    <motion.p initial={{ y: "100%" }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">"Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me."</motion.p>
                  </div>
                  <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }} className="text-[14px] text-[var(--faded)] tracking-[0.3em] uppercase mt-6 font-sans not-italic drop-shadow-none">– Psalm 23:4</motion.p>
                </div>
                
                <div className="w-[1px] h-[60px] bg-[var(--whisper)]/40 mx-auto" />
                
                <div className="flex flex-col items-center">
                  <div className="overflow-hidden">
                    <motion.p initial={{ y: "100%" }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">"Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand."</motion.p>
                  </div>
                  <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }} className="text-[14px] text-[var(--faded)] tracking-[0.3em] uppercase mt-6 font-sans not-italic drop-shadow-none">– Isaiah 41:10</motion.p>
                </div>
                
             </div>
          </div>
        );
      case 'PRAY WITH ME':
        return (
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center min-h-[50vh]">
             <h2 className="font-gothic text-[clamp(40px,6vw,80px)] text-[var(--bone)] mb-16 tracking-normal leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">The Lords Prayer.</h2>
             
             <div className="relative w-full h-[200px] flex items-center justify-center">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activePrayerIndex}
                   initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                   animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                   exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                   transition={{ duration: .5, ease: 'easeInOut' }}
                   className="absolute inset-0 flex items-center justify-center"
                 >
                   <p className="font-serif italic text-[clamp(20px,3vw,30px)] text-[var(--parchment)] leading-[1.8] drop-shadow-[0_4px_10px_rgba(0,0,0,1)]">
                     "{prayers[activePrayerIndex]}"
                   </p>
                 </motion.div>
               </AnimatePresence>
             </div>

             <div className="mt-16 flex gap-3">
               {prayers.map((_, idx) => (
                 <div 
                   key={idx} 
                   className={`h-[2px] transition-all duration-1000 ${idx === activePrayerIndex ? 'w-8 bg-[var(--bone)] shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-2 bg-[var(--whisper)]/30'}`}
                 />
               ))}
             </div>
          </div>
        );
      case 'ARCHIVE':
        return (
          <div className="max-w-5xl mx-auto w-full">
             <h2 className="font-gothic text-[clamp(50px,6vw,80px)] text-[var(--bone)] mb-20 tracking-normal border-b border-[var(--whisper)]/20 pb-10 text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">Past Relics</h2>
             <div className="flex flex-col gap-10">
               {[
                 { year: 'MMXXIV', title: 'THE FALL', status: 'UNAVAILABLE' },
                 { year: 'MMXXIII', title: 'GENESIS', status: 'UNAVAILABLE' },
                 { year: 'MMXXII', title: 'PRE-EMPTIVE', status: 'RESTRICTED' }
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center py-8 border-b border-[var(--whisper)]/10 group cursor-pointer hover:border-[var(--bone)] transition-colors duration-500">
                    <div className="font-sans text-[16px] text-[var(--faded)] tracking-[0.2em] w-32 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{item.year}</div>
                    <div className="font-bebas text-[clamp(30px,4vw,44px)] text-[var(--bone)] tracking-[0.05em] flex-1 opacity-50 group-hover:opacity-100 transition-opacity duration-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{item.title}</div>
                    <div className="font-sans text-[13px] text-[var(--blood)] tracking-[0.3em] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{item.status}</div>
                 </div>
               ))}
             </div>
          </div>
        );
    }
  };

  return (
    <>
      <button
        className="fixed top-7 right-8 z-[10001] w-5 h-5 focus:outline-none"
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
            className="fixed top-0 right-0 w-[min(380px,90vw)] h-screen border-l border-[var(--iron)] pt-24 px-12 pb-12 z-[10000] overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.8)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Marble Texture Background */}
            <div 
              className="absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-overlay"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')` }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--abyss)] via-[var(--abyss)]/95 to-[var(--abyss)]/90 backdrop-blur-md" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex flex-col gap-6">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: 'easeOut' }}
                    onClick={() => {
                      setOverlayMessage(item);
                      setTimeout(() => setIsOpen(false), 400); // Wait for transition
                    }}
                    className="group relative cursor-pointer font-sans text-[30px] tracking-[0.1em] text-[var(--bone)] opacity-50 hover:opacity-100 transition-all duration-500 uppercase pb-2"
                  >
                    {item}
                    <div className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--bone)] group-hover:w-full transition-all duration-500 ease-out" />
                  </motion.div>
                ))}

                <motion.hr 
                  className="menu-divider"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                />

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
                  onClick={() => {
                    setIsOpen(false);
                    setTimeout(() => setIsCheckoutOpen(true), 100);
                  }}
                  className="group relative cursor-pointer font-sans text-[30px] tracking-[0.1em] text-[var(--bone)] opacity-35 hover:opacity-100 transition-all duration-500 flex items-center justify-between pb-2 uppercase"
                >
                  CART
                  <span className="font-sans text-[16px] text-[var(--faded)] tracking-[0.1em] mt-2">({cartItems.length})</span>
                  <div className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--bone)] group-hover:w-full transition-all duration-500 ease-out" />
                </motion.div>
              </div>

              <motion.div 
                className="mt-auto flex flex-col gap-2 font-sans text-[11px] tracking-[0.4em] text-[var(--whisper)] opacity-60 uppercase"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              >
                <span>9INETAILSS</span>
                <span>EST. MMXXVI</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {overlayMessage && (
          <motion.div 
            className="fixed inset-0 z-[99999] flex flex-col justify-between p-12 pointer-events-auto overflow-hidden"
            initial={{ opacity: 0, filter: 'blur(20px)', scale: 1.05 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)', scale: 0.95 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Dark Marble Cathedral Background Layer */}
            <div 
              className="absolute inset-0 z-0 opacity-40 bg-cover bg-center mix-blend-overlay"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')` }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--void)] via-[var(--void)]/90 to-[var(--void)]/80 backdrop-blur-xl" />
            
            <div className="relative z-20 flex justify-start w-full">
               <div 
                  className="cursor-pointer group p-4 border border-[var(--whisper)]/20 hover:bg-[var(--bone)] transition-colors duration-500" 
                  onClick={() => setOverlayMessage(null)}
                >
                  <div className="font-sans text-[14px] text-[var(--bone)] tracking-[0.2em] group-hover:text-[var(--void)] transition-colors uppercase">
                    RETURN TO SANCTUARY
                  </div>
                </div>
            </div>
            
            {/* Rendered Layout Content */}
            <div className="relative z-10 flex-1 flex flex-col w-full mt-12 mb-4 overflow-y-auto overflow-x-hidden no-scrollbar">
              <motion.div 
                className="w-full m-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderMenuContent()}
              </motion.div>
            </div>
            
            <div className="relative z-20 w-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
