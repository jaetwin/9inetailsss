import React from 'react';
import { motion } from 'motion/react';

export default function Room4() {
  return (
    <div className="w-full relative min-h-[150vh] flex flex-col justify-center pt-[20vh] pb-[40vh] pointer-events-none">
      
      {/* Section C — The Cross Mark (Background) */}
      <div className="cross-mark" />

      {/* Section A — The Manifesto */}
      <div className="w-full mb-[20vh] relative z-10 pl-[8vw]">
        <motion.h2 
          className="font-sans text-[clamp(48px,9vw,120px)] text-[var(--bone)] leading-[0.9] tracking-[0.02em]"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>WE BUILD FOR THE REBORN.</div>
          <div className="text-[var(--faded)]">NOT THE WORLD.</div>
        </motion.h2>
        
        <motion.div 
          className="font-serif italic text-[clamp(16px,1.5vw,22px)] text-[var(--parchment)] leading-[2] max-w-[520px] mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          Faith is not aesthetic. But it can be worn.<br/>
          9inetailss exists at the intersection of ultimate love and craft.<br/>
          Every piece tells a story.
        </motion.div>
      </div>

      {/* Section B — Three Pillars */}
      <div className="w-full max-w-[1400px] mx-auto px-[4vw] relative z-10 pointer-events-auto mt-[10vh]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <motion.blockquote 
            className="glass-panel clip-diagonal p-12 flex flex-col justify-between min-h-[380px] border border-[var(--whisper)] group hover:-translate-y-4 transition-transform duration-500 relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--blood)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="flex-1 flex flex-col justify-start relative z-10">
              <p className="font-serif italic text-[18px] lg:text-[22px] text-[var(--bone)] leading-[1.6] m-0 mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                "Be strong and courageous."
              </p>
              <p className="font-sans text-[12px] text-[var(--parchment)] leading-[1.8] tracking-[0.05em] drop-shadow-lg opacity-80 border-l border-[var(--whisper)]/50 pl-4">
                Not a promise of safety, but a command for war. Courage is not the absence of fear, but the brutal decision that obedience is more important than comfort. Do not mistake this for passive inspiration; it is a battle cry for the reborn stepping into hostility.
              </p>
            </div>

            <footer className="font-mono flex items-center justify-between text-[10px] text-[var(--faded)] tracking-[0.3em] mt-8 relative z-10 border-t border-[rgba(255,255,255,0.1)] pt-4 uppercase">
              <span>— JOSHUA 1:9</span>
              <span className="text-[var(--blood)]">CONTEXT // 01</span>
            </footer>
          </motion.blockquote>

          <motion.blockquote 
            className="glass-panel clip-diagonal p-12 flex flex-col justify-between min-h-[380px] border border-[var(--whisper)] group hover:-translate-y-4 transition-transform duration-500 relative overflow-hidden mt-0 md:mt-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="flex-1 flex flex-col justify-start relative z-10">
              <p className="font-serif italic text-[18px] lg:text-[22px] text-[var(--bone)] leading-[1.6] m-0 mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                "I can do all things through Christ."
              </p>
              <p className="font-sans text-[12px] text-[var(--parchment)] leading-[1.8] tracking-[0.05em] drop-shadow-lg opacity-80 border-l border-[var(--whisper)]/50 pl-4">
                This does not mean you can sin through Christ. It does not mean He is a tool for your earthly ambition. It means you can endure starvation, persecution, and absolute ruin without breaking, because the Spirit sustains the reborn when the flesh fails.
              </p>
            </div>

            <footer className="font-mono flex items-center justify-between text-[10px] text-[var(--faded)] tracking-[0.3em] mt-8 relative z-10 border-t border-[rgba(255,255,255,0.1)] pt-4 uppercase">
              <span>— PHILIPPIANS 4:13</span>
              <span className="text-[var(--gold)]">CONTEXT // 02</span>
            </footer>
          </motion.blockquote>

          <motion.blockquote 
            className="glass-panel clip-diagonal p-12 flex flex-col justify-between min-h-[380px] border border-[var(--whisper)] group hover:-translate-y-4 transition-transform duration-500 relative overflow-hidden mt-0 md:-mt-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--bone)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="flex-1 flex flex-col justify-start relative z-10">
              <p className="font-serif italic text-[18px] lg:text-[22px] text-[var(--bone)] leading-[1.6] m-0 mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                "Walk worthy of the calling."
              </p>
              <p className="font-sans text-[12px] text-[var(--parchment)] leading-[1.8] tracking-[0.05em] drop-shadow-lg opacity-80 border-l border-[var(--whisper)]/50 pl-4">
                Stop tearing verses out of context to justify a lukewarm, compromised existence. You are called to be holy, set apart, and entirely unconcerned with the applause of a decaying culture. If your life does not look radically different from the crowd, you are walking entirely unworthy.
              </p>
            </div>

            <footer className="font-mono flex items-center justify-between text-[10px] text-[var(--faded)] tracking-[0.3em] mt-8 relative z-10 border-t border-[rgba(255,255,255,0.1)] pt-4 uppercase">
              <span>— EPHESIANS 4:1</span>
              <span className="text-[var(--bone)]">CONTEXT // 03</span>
            </footer>
          </motion.blockquote>

        </div>
      </div>

    </div>
  );
}
