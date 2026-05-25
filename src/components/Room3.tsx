import React from 'react';
import { motion } from 'motion/react';

export default function Room3() {
  return (
    <div className="w-full min-h-[200vh] flex flex-col justify-start items-center pointer-events-none pt-[15vh] relative z-10">
      
      {/* ─── Hero Word ──────────────────────────────────────────────── */}
      <div className="max-w-[800px] text-center px-6 relative pointer-events-auto">
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

      {/* ─── Brand Story + Craft Cards ─────────────────────────────── */}
      <div className="w-[94%] max-w-[1300px] grid grid-cols-1 md:grid-cols-2 gap-8 mt-[18vh] px-[4vw] pointer-events-auto">

        {/* Left — Who We Are */}
        <motion.div
          className="flex flex-col bg-[var(--void)] border border-[var(--whisper)]/20 p-10 md:p-14 relative"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Blood accent bar */}
          <div className="scripture-accent-bar" style={{ background: 'linear-gradient(90deg, var(--blood), rgba(107,20,20,0.4), transparent)' }} />
          
          <div className="font-mono text-[10px] tracking-[0.4em] text-[var(--faded)] uppercase mb-8">
            Who We Are
          </div>
          
          <h3 className="font-sans text-[clamp(28px,4vw,48px)] text-[var(--bone)] leading-[1.1] tracking-[0.02em] mb-8">
            FAITH.<br/>
            <span className="text-[var(--faded)]">WORN.</span>
          </h3>
          
          <p className="font-serif text-[15px] md:text-[17px] text-[var(--parchment)]/80 leading-[1.9] mb-8">
            9inetailss was born from a conviction that faith should be worn, not just felt.
            Every piece carries the weight of scripture — built for those who walk differently, 
            who endure what others won't, and who refuse to let belief stay invisible.
          </p>
          
          <p className="font-serif text-[15px] md:text-[17px] text-[var(--parchment)]/80 leading-[1.9]">
            This is not streetwear inspired by faith. This is faith expressed through craft. 
            There is a difference. We honor it in every stitch.
          </p>

          <div className="mt-auto pt-10 flex items-center gap-4">
            <div className="w-8 h-[1px] bg-[var(--whisper)]/30" />
            <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--faded)] uppercase">
              Est. MMXXV · Georgia
            </div>
          </div>
        </motion.div>

        {/* Right — What We Make */}
        <motion.div
          className="flex flex-col bg-[var(--void)] border border-[var(--whisper)]/20 p-10 md:p-14 relative md:mt-16"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="scripture-accent-bar" style={{ background: 'linear-gradient(90deg, var(--gold), rgba(180,140,60,0.3), transparent)' }} />

          <div className="font-mono text-[10px] tracking-[0.4em] text-[var(--faded)] uppercase mb-8">
            What We Make
          </div>

          <h3 className="font-sans text-[clamp(28px,4vw,48px)] text-[var(--bone)] leading-[1.1] tracking-[0.02em] mb-10">
            THE<br/>
            <span className="text-[var(--faded)]">STANDARD.</span>
          </h3>

          <div className="flex flex-col gap-8">
            {[
              {
                num: '01',
                title: 'Built Heavy',
                body: 'Heavyweight construction across every piece. No fast fashion. No thin fabric. Built to last longer than the season it drops in.',
              },
              {
                num: '02',
                title: 'Scripture-Sourced',
                body: 'Every graphic is rooted in Scripture — not trends, not aesthetics for aesthetics\' sake. The Word on your back should mean something.',
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="flex gap-6 group">
                <div className="font-mono text-[11px] tracking-[0.2em] text-[var(--blood)] pt-1 shrink-0">{num}</div>
                <div>
                  <div className="font-sans text-[13px] tracking-[0.2em] text-[var(--bone)] uppercase mb-2 group-hover:text-[var(--gold)] transition-colors duration-300">{title}</div>
                  <div className="font-serif text-[14px] md:text-[15px] text-[var(--parchment)]/70 leading-[1.8]">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Bottom Scripture Anchor ────────────────────────────────── */}
      <motion.div
        className="w-full flex flex-col items-center mt-[20vh] px-6 pointer-events-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2, delay: 0.5 }}
      >
        <div className="text-center bg-[var(--void)]/50 backdrop-blur-lg p-12 border border-[rgba(255,255,255,0.03)] max-w-[900px]">
          <div className="font-serif font-light text-[clamp(20px,3.5vw,44px)] leading-[1.6] text-[var(--bone)]">
            "And let us not grow weary of doing good, for in due season we will reap, if we do not give up."
          </div>
          <div className="font-sans text-[13px] text-[var(--faded)] tracking-[0.3em] mt-10 uppercase">
            — Galatians 6:9
          </div>
        </div>
      </motion.div>
    </div>
  );
}
