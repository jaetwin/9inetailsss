import React from 'react';
import { motion } from 'motion/react';

export default function Room4() {
  return (
    <div className="w-full relative min-h-[150vh] flex flex-col justify-center pt-[12vh] md:pt-[20vh] pb-[20vh] md:pb-[40vh] pointer-events-none">

      <div className="cross-mark" />

      {/* ─── Manifesto ───────────────────────────────────────────────── */}
      <div className="w-full mb-[10vh] md:mb-[20vh] relative z-10 px-6 md:pl-[8vw] md:pr-[4vw]">
        <motion.h2
          className="font-sans text-[clamp(36px,8vw,120px)] text-[var(--bone)] leading-[0.9] tracking-[0.02em]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>WE BUILD FOR THE REBORN.</div>
          <div className="text-[var(--faded)]">NOT THE WORLD.</div>
        </motion.h2>

        <motion.div
          className="font-serif italic text-[clamp(15px,1.5vw,22px)] text-[var(--parchment)] leading-[2] max-w-[520px] mt-8 md:mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          Faith is not aesthetic. But it can be worn.<br/>
          9inetailss exists at the intersection of ultimate love and craft.<br/>
          Every piece tells a story.
        </motion.div>
      </div>

      {/* ─── Three Pillars ───────────────────────────────────────────── */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-[4vw] relative z-10 pointer-events-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

          {[
            {
              quote: '"Be strong and courageous."',
              body: 'Not a promise of safety, but a command for war. Courage is not the absence of fear, but the brutal decision that obedience is more important than comfort. Do not mistake this for passive inspiration; it is a battle cry for the reborn stepping into hostility.',
              ref: '— JOSHUA 1:9',
              label: 'CONTEXT // 01',
              accent: 'linear-gradient(90deg, var(--blood), rgba(107,20,20,0.8), transparent)',
              hover: 'from-[var(--blood)]/5',
              labelColor: 'text-[var(--blood)]',
              delay: 0,
              mdOffset: '',
            },
            {
              quote: '"I can do all things through Christ."',
              body: 'This does not mean you can sin through Christ. It does not mean He is a tool for your earthly ambition. It means you can endure starvation, persecution, and absolute ruin without breaking, because the Spirit sustains the reborn when the flesh fails.',
              ref: '— PHILIPPIANS 4:13',
              label: 'CONTEXT // 02',
              accent: 'linear-gradient(90deg, var(--gold), rgba(180,140,60,0.5), transparent)',
              hover: 'from-[var(--gold)]/5',
              labelColor: 'text-[var(--gold)]',
              delay: 0.15,
              mdOffset: 'md:mt-24',
            },
            {
              quote: '"Walk worthy of the calling."',
              body: 'Stop tearing verses out of context to justify a lukewarm, compromised existence. You are called to be holy, set apart, and entirely unconcerned with the applause of a decaying culture. If your life does not look radically different from the crowd, you are walking entirely unworthy.',
              ref: '— EPHESIANS 4:1',
              label: 'CONTEXT // 03',
              accent: 'linear-gradient(90deg, rgba(232,226,214,0.5), rgba(232,226,214,0.1), transparent)',
              hover: 'from-[var(--bone)]/5',
              labelColor: 'text-[var(--bone)]',
              delay: 0.3,
              mdOffset: 'md:mt-8',
            },
          ].map(({ quote, body, ref, label, accent, hover, labelColor, delay, mdOffset }) => (
            <motion.blockquote
              key={ref}
              className={`glass-panel p-8 md:p-12 flex flex-col justify-between min-h-[320px] md:min-h-[380px] border border-[var(--whisper)] group hover:-translate-y-2 md:hover:-translate-y-4 transition-transform duration-500 relative overflow-hidden ${mdOffset}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay, ease: "easeOut" }}
            >
              <div className="scripture-accent-bar" style={{ background: accent }} />
              <div className={`absolute inset-0 bg-gradient-to-br ${hover} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

              <div className="flex-1 flex flex-col justify-start relative z-10">
                <p className="font-serif italic text-[18px] md:text-[22px] text-[var(--bone)] leading-[1.6] m-0 mb-5 md:mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  {quote}
                </p>
                <p className="font-sans text-[12px] text-[var(--parchment)] leading-[1.8] tracking-[0.05em] drop-shadow-lg opacity-80 border-l border-[var(--whisper)]/50 pl-4">
                  {body}
                </p>
              </div>

              <footer className={`font-mono flex items-center justify-between text-[10px] text-[var(--faded)] tracking-[0.3em] mt-6 md:mt-8 relative z-10 border-t border-[rgba(255,255,255,0.1)] pt-4 uppercase`}>
                <span>{ref}</span>
                <span className={labelColor}>{label}</span>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </div>
  );
}
