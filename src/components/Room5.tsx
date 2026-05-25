import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const DROP_DATE = new Date('2026-09-01T00:00:00Z');

function toRoman(n: number): string {
  if (n <= 0) return 'I';
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

function useCountdown() {
  const [diff, setDiff] = useState(Math.max(0, DROP_DATE.getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, DROP_DATE.getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, []);
  const total = Math.floor(diff / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s, expired: diff === 0 };
}

function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? scrolled / total : 0);
    };
    const container = document.querySelector('[data-scroll-container]') as HTMLElement | null;
    window.addEventListener('scroll', onScroll, { passive: true });
    container?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      container?.removeEventListener('scroll', onScroll);
    };
  }, []);
  return (
    <div className="fixed top-0 left-0 w-full h-[2px] z-[10060] pointer-events-none">
      <motion.div
        className="h-full bg-[var(--gold)] origin-left"
        style={{ scaleX: progress, transformOrigin: 'left' }}
        initial={false}
        transition={{ ease: 'linear', duration: 0 }}
      />
    </div>
  );
}

interface Room5Props {
  isMobile: boolean;
  setEmailOpen: (v: boolean) => void;
  isOverlayOpen: boolean;
}

export default function Room5({ isMobile, setEmailOpen, isOverlayOpen }: Room5Props) {
  const { d, h, m, s, expired } = useCountdown();

  return (
    <>
      <ScrollProgress />

      <div className="w-full bg-transparent relative min-h-screen flex flex-col items-center justify-center pt-[6vh] pb-[6vh] pointer-events-none px-3 md:px-0">

        <motion.div
          className="sanctuary-card relative flex flex-col items-center justify-center px-5 py-12 md:px-16 md:py-24 w-full max-w-[1400px] bg-[#080808] border border-[var(--whisper)]/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-sm pointer-events-auto overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          whileInView={!isOverlayOpen ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : undefined}
          animate={isOverlayOpen ? {
            opacity: 0.3,
            scale: 0.98,
            filter: 'blur(8px)',
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
          } : undefined}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80')] bg-cover" />

          {/* Heading */}
          <div className="text-center">
            <h2 className="font-sans text-[clamp(38px,9vw,140px)] text-[var(--bone)] leading-none tracking-[0.05em] text-glow">
              THE SANCTUARY
            </h2>
            <div className="font-mono text-[11px] md:text-[13px] tracking-[0.4em] text-[var(--faded)] mt-5 md:mt-8">
              FALL / WINTER MMXXVI
            </div>
          </div>

          {/* Countdown */}
          {!expired && (
            <motion.div
              className="mt-10 md:mt-12 flex items-center gap-4 sm:gap-8 md:gap-10 pointer-events-auto flex-wrap justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              {[
                { label: 'DAYS',    val: d },
                { label: 'HRS',     val: h },
                { label: 'MIN',     val: m },
                { label: 'SEC',     val: s },
              ].map(({ label, val }, i) => (
                <div key={label} className="flex items-center gap-4 sm:gap-8 md:gap-10">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-mono text-[clamp(18px,4vw,36px)] text-[var(--bone)] tracking-[0.05em] tabular-nums">
                      {toRoman(val)}
                    </span>
                    <span className="font-mono text-[8px] md:text-[9px] tracking-[0.3em] text-[var(--faded)] uppercase">{label}</span>
                  </div>
                  {i < 3 && <span className="font-mono text-[var(--whisper)] text-[16px] md:text-[20px] mb-4">·</span>}
                </div>
              ))}
            </motion.div>
          )}
          {expired && (
            <motion.div
              className="mt-10 font-mono text-[11px] tracking-[0.4em] text-[var(--gold)] uppercase"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              The drop has arrived.
            </motion.div>
          )}

          {/* Cross ornament */}
          <motion.div
            className="mt-10 md:mt-14 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className="relative w-8 h-8 md:w-10 md:h-10 opacity-25 pointer-events-none">
              <div className="absolute left-1/2 top-0 w-[1px] h-full bg-[var(--bone)] -translate-x-1/2" />
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[var(--bone)] -translate-y-1/2" />
            </div>
          </motion.div>

          {/* Email CTA */}
          <motion.div
            className="mt-8 md:mt-10 pointer-events-auto flex flex-col items-center gap-4 w-full px-2 md:px-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <button
              onClick={() => setEmailOpen(true)}
              className="group relative w-full max-w-[320px] md:w-auto px-8 md:px-10 py-4 bg-[var(--whisper)]/10 border border-[var(--whisper)]/30 font-mono text-[11px] tracking-[0.2em] text-[var(--bone)] hover:border-[var(--bone)] hover:bg-[var(--bone)] hover:text-[var(--void)] hover:shadow-[0_0_40px_rgba(232,226,214,0.3)] transition-all duration-700 focus:outline-none cursor-pointer"
              aria-label="Subscribe to email list"
            >
              RECEIVE THE TRANSMISSION
            </button>
            <p className="font-mono text-[9px] tracking-[0.2em] text-[var(--faded)]/50 uppercase mt-2 text-center">
              Drops · Scripture · Dispatches from the remnant
            </p>
          </motion.div>

          {/* Archive teaser */}
          <motion.div
            className="mt-10 md:mt-14 pointer-events-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 1 }}
          >
            <div className="flex items-center gap-3 md:gap-4 font-mono text-[9px] md:text-[10px] tracking-[0.35em] text-[var(--whisper)]/30 uppercase select-none">
              <div className="w-6 md:w-8 h-[1px] bg-[var(--whisper)]/20" />
              [ ARCHIVE — RESTRICTED ]
              <div className="w-6 md:w-8 h-[1px] bg-[var(--whisper)]/20" />
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Verse */}
        <motion.div
          className="w-full flex flex-col items-center mt-[30px] md:mt-[40px] px-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 1 }}
        >
          <div className="font-serif italic text-[14px] md:text-[16px] text-[var(--whisper)] opacity-50 text-center">
            "The former things have passed away."
          </div>
          <div className="font-mono text-[10px] text-[var(--whisper)] opacity-40 tracking-[0.3em] mt-3 md:mt-4">
            — Revelation 21:4
          </div>
        </motion.div>
      </div>
    </>
  );
}
