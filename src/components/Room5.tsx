import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import EmailSignup from './EmailSignup';

// ─── Countdown to next drop ───────────────────────────────────────────────────
// Target: December 1, 2025 (edit this date for your actual drop)
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

// ─── Scroll Progress Bar ─────────────────────────────────────────────────────
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? scrolled / total : 0);
    };
    // Also listen on the drei Scroll canvas container
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

// ─── Room5 ───────────────────────────────────────────────────────────────────
export default function Room5({ isMobile, setEmailOpen }: { isMobile: boolean, setEmailOpen: (v: boolean) => void }) {
  const { d, h, m, s, expired } = useCountdown();

  return (
    <>
      <ScrollProgress />

      <div className="w-full bg-transparent relative min-h-screen flex flex-col items-center justify-center pt-[8vh] pb-[6vh] pointer-events-none">

        <motion.div 
          className="flex flex-col items-center justify-center px-6 py-16 md:px-16 md:py-24 w-[96vw] max-w-[1400px] bg-gradient-to-b from-[var(--void)]/90 to-[var(--void)]/70 backdrop-blur-md border border-[var(--whisper)]/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-sm pointer-events-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >

          {/* Main heading */}
          <div className="text-center">
            <h2 className="font-sans text-[clamp(50px,10vw,140px)] text-[var(--bone)] leading-none tracking-[0.05em] text-glow">
              THE SANCTUARY
            </h2>
            <div className="font-mono text-[13px] tracking-[0.4em] text-[var(--faded)] mt-8">
              FALL / WINTER MMXXVI
            </div>
          </div>

          {/* Countdown */}
          {!expired && (
            <motion.div
              className="mt-12 flex items-center gap-6 sm:gap-10 pointer-events-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              {[
                { label: 'DAYS',    val: d },
                { label: 'HOURS',   val: h },
                { label: 'MINUTES', val: m },
                { label: 'SECONDS', val: s },
              ].map(({ label, val }, i) => (
                <div key={label} className="flex items-center gap-6 sm:gap-10">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-mono text-[clamp(22px,4vw,36px)] text-[var(--bone)] tracking-[0.05em] tabular-nums">
                      {toRoman(val)}
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.3em] text-[var(--faded)] uppercase">{label}</span>
                  </div>
                  {i < 3 && <span className="font-mono text-[var(--whisper)] text-[20px] mb-4">·</span>}
                </div>
              ))}
            </motion.div>
          )}
          {expired && (
            <motion.div
              className="mt-12 font-mono text-[11px] tracking-[0.4em] text-[var(--gold)] uppercase"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              The drop has arrived.
            </motion.div>
          )}

          {/* Divider */}
          <motion.div
            className="mt-14 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {/* Decorative cross ornament */}
            <div className="relative w-10 h-10 opacity-25 pointer-events-none">
              <div className="absolute left-1/2 top-0 w-[1px] h-full bg-[var(--bone)] -translate-x-1/2" />
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[var(--bone)] -translate-y-1/2" />
            </div>
          </motion.div>

          {/* Email CTA */}
          <motion.div
            className="mt-10 pointer-events-auto flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <button
              onClick={() => setEmailOpen(true)}
              className="group relative px-10 py-4 bg-[var(--whisper)]/10 backdrop-blur-md border border-[var(--whisper)]/30 font-mono text-[11px] tracking-[0.2em] text-[var(--bone)] hover:border-[var(--bone)] hover:bg-[var(--bone)] hover:text-[var(--void)] hover:shadow-[0_0_40px_rgba(232,226,214,0.3)] transition-all duration-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--void)] cursor-pointer"
              aria-label="Subscribe to email list"
            >
              {/* Pulse glow on idle */}
              <span className="absolute inset-0 rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[0_0_30px_rgba(232,226,214,0.1)] pointer-events-none" />
              RECEIVE THE TRANSMISSION
            </button>
            <p className="font-mono text-[9px] tracking-[0.2em] text-[var(--faded)]/50 uppercase mt-4">
              Drops · Scripture · Dispatches from the remnant
            </p>
          </motion.div>

          {/* Archive teaser */}
          <motion.div
            className="mt-14 pointer-events-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 1 }}
          >
            <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.35em] text-[var(--whisper)]/30 uppercase select-none">
              <div className="w-8 h-[1px] bg-[var(--whisper)]/20" />
              [ ARCHIVE — RESTRICTED ]
              <div className="w-8 h-[1px] bg-[var(--whisper)]/20" />
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Verse */}
        <motion.div
          className="w-full flex flex-col items-center mt-[40px]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 1 }}
        >
          <div className="font-serif italic text-[16px] text-[var(--whisper)] opacity-50 text-center">
            "The former things have passed away."
          </div>
          <div className="font-mono text-[10px] text-[var(--whisper)] opacity-40 tracking-[0.3em] mt-4">
            — Revelation 21:4
          </div>
        </motion.div>
      </div>
    </>
  );
}

