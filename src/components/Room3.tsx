import React from 'react';
import { motion } from 'motion/react';

export default function Room3() {
  return (
    <div className="w-full min-h-[220vh] flex flex-col justify-start items-center pointer-events-none pt-[20vh] relative z-10">
      <div className="max-w-[800px] text-center px-6 relative pointer-events-auto">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[var(--bone)] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

        <motion.h2 
          className="font-sans text-[clamp(60px,12vw,160px)] text-glow leading-none tracking-[0.02em] text-[var(--bone)]"
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          whileInView={{ opacity: 0.9, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          ENDURE
        </motion.h2>
        
        <motion.div 
          className="glass-card mt-12 p-8 border border-[var(--whisper)] mx-auto max-w-[500px]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <p className="font-serif italic font-light text-[clamp(18px,2vw,24px)] text-[var(--parchment)] leading-[1.8]">
            We do not build for the applause of the world.<br/>
            We build for the reborn.
          </p>
        </motion.div>
      </div>

      <div className="w-[94%] max-w-[1400px] flex flex-col md:flex-row justify-between items-center md:items-start pointer-events-auto mt-[20vh] gap-12 px-[4vw]">
        {/* Left Graphic */}
        <motion.div 
          className="w-full md:w-[40%] lg:w-[30%] h-[70vh] relative"
          initial={{ opacity: 0, y: 50, rotate: -3 }}
          whileInView={{ opacity: 1, y: 0, rotate: -3 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="w-full h-full border-[1px] border-[var(--whisper)] p-2 glass-panel clip-diagonal group flex items-center justify-center overflow-hidden">
            <div className="w-full h-full clip-diagonal bg-[var(--void)] flex items-center justify-center relative">
              <div className="font-sans text-[clamp(100px,18vw,200px)] text-stroke opacity-30 group-hover:opacity-60 transition-opacity duration-1000 -rotate-90 select-none">
                001
              </div>
              <div className="absolute bottom-10 left-8 font-sans text-[12px] tracking-[0.4em] text-[var(--faded)] rotate-90 origin-bottom-left uppercase">
                ARCHIVE
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Right Graphic */}
        <motion.div 
          className="w-full md:w-[45%] lg:w-[40%] h-[80vh] md:mt-[20vh] relative"
          initial={{ opacity: 0, x: 50, rotate: 2 }}
          whileInView={{ opacity: 1, x: 0, rotate: 2 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-[var(--gold)] opacity-5 blur-[100px] pointer-events-none" />
          <div className="w-full h-full border-[1px] border-[var(--whisper)] p-2 glass-panel clip-diagonal group flex items-center justify-center overflow-hidden">
            <div className="w-full h-full clip-diagonal bg-gradient-to-tr from-[var(--void)] to-[var(--ash)] flex flex-col p-12 relative">
              <div className="font-sans text-[14px] text-[var(--whisper)] tracking-[0.3em] mb-auto uppercase">CHAPTER I</div>
              
              <div className="font-bebas text-[clamp(40px,7vw,90px)] leading-[0.85] tracking-[0.05em] text-stroke-hover cursor-crosshair text-right mt-auto mb-10 select-none whitespace-nowrap">
                SUFFER<br/>WELL
              </div>
              
              <div className="w-full h-[1px] bg-[var(--whisper)]" />
              <div className="flex justify-between items-center mt-6">
                 <div className="w-3 h-3 bg-[var(--faded)] rounded-full animate-pulse" />
                 <div className="font-sans text-[11px] tracking-[0.2em] text-[var(--bone)] uppercase">AESTHETIC DECAY</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="w-full max-w-[900px] flex flex-col items-center mt-[30vh] px-6 pointer-events-auto">
        <motion.div 
          className="text-center bg-[var(--void)]/50 backdrop-blur-lg p-12 border border-[rgba(255,255,255,0.03)]"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="font-serif font-light text-[clamp(24px,4vw,52px)] leading-[1.5] text-[var(--bone)]">
            "And let us not grow weary of doing good, for in due season we will reap, if we do not give up."
          </div>
          <div className="font-sans text-[13px] text-[var(--faded)] tracking-[0.3em] mt-10 uppercase">
            — Galatians 6:9
          </div>
        </motion.div>
      </div>
    </div>
  );
}
