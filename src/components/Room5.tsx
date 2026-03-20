import React from 'react';
import { motion } from 'motion/react';

export default function Room5() {
  return (
    <div className="w-full bg-transparent relative min-h-screen flex flex-col pt-[10vh] pointer-events-none">
      
      <div className="flex-grow flex flex-col justify-center items-center px-6">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
           className="text-center"
        >
          <h2 className="font-sans text-[clamp(50px,10vw,140px)] text-[var(--bone)] leading-none tracking-[0.05em] text-glow">
            THE SANCTUARY
          </h2>
          <div className="font-mono text-[13px] tracking-[0.4em] text-[var(--faded)] mt-8">
            FALL / WINTER MMXXV
          </div>
        </motion.div>

        <motion.div 
          className="mt-[16vh] pointer-events-auto"
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-50px" }}
           transition={{ duration: 1, delay: 0.5 }}
        >
          <button className="px-10 py-4 bg-transparent border border-[var(--whisper)] font-mono text-[11px] tracking-[0.2em] text-[var(--bone)] hover:border-[var(--bone)] hover:bg-[var(--bone)] hover:text-[var(--void)] transition-all duration-300 focus:outline-none">
            JOIN THE CONGREGATION
          </button>
        </motion.div>
      </div>

      {/* Bottom Verse */}
      <motion.div 
        className="w-full flex flex-col items-center mt-[80px] mb-[120px]"
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
  );
}
