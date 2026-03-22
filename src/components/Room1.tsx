import React, { useState } from 'react'; 
import { motion } from 'motion/react';
import { useProgress } from '@react-three/drei';
import tailLogo from './9tailsslogo.png';

interface Room1Props {
  onEnter: () => void;
  onPlayMusic: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

// ─── Daily Verse ─────────────────────────────────────────────────────────────
const VERSES = [
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "For God so loved the world that he gave his one and only Son.", ref: "John 3:16" },
  { text: "The LORD is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Trust in the LORD with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
  { text: "Fear not, for I am with you; be not dismayed, for I am your God.", ref: "Isaiah 41:10" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
  { text: "The joy of the LORD is your strength.", ref: "Nehemiah 8:10" },
  { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
  { text: "And we know that in all things God works for the good of those who love him.", ref: "Romans 8:28" },
  { text: "For I know the plans I have for you, declares the LORD, plans to prosper you.", ref: "Jeremiah 29:11" },
  { text: "The LORD is my light and my salvation — whom shall I fear?", ref: "Psalm 27:1" },
  { text: "Do not be anxious about anything, but in every situation, by prayer, present your requests to God.", ref: "Philippians 4:6" },
  { text: "But those who hope in the LORD will renew their strength.", ref: "Isaiah 40:31" },
  { text: "For it is by grace you have been saved, through faith.", ref: "Ephesians 2:8" },
  { text: "Love is patient, love is kind. It does not envy, it does not boast.", ref: "1 Corinthians 13:4" },
  { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
  { text: "Come to me, all you who are weary and burdened, and I will give you rest.", ref: "Matthew 11:28" },
  { text: "For the wages of sin is death, but the gift of God is eternal life.", ref: "Romans 6:23" },
  { text: "Create in me a pure heart, O God, and renew a steadfast spirit within me.", ref: "Psalm 51:10" },
  { text: "No weapon forged against you will prevail.", ref: "Isaiah 54:17" },
  { text: "I have been crucified with Christ and I no longer live, but Christ lives in me.", ref: "Galatians 2:20" },
  { text: "The earth is the LORD's, and everything in it.", ref: "Psalm 24:1" },
  { text: "Seek first his kingdom and his righteousness, and all these things will be given to you.", ref: "Matthew 6:33" },
  { text: "Even though I walk through the valley of the shadow of death, I will fear no evil.", ref: "Psalm 23:4" },
  { text: "He heals the brokenhearted and binds up their wounds.", ref: "Psalm 147:3" },
  { text: "The name of the LORD is a fortified tower; the righteous run to it and are safe.", ref: "Proverbs 18:10" },
  { text: "Greater is he that is in you, than he that is in the world.", ref: "1 John 4:4" },
  { text: "For I am not ashamed of the gospel, because it is the power of God.", ref: "Romans 1:16" },
  { text: "Delight yourself in the LORD, and he will give you the desires of your heart.", ref: "Psalm 37:4" },
  { text: "Reject every kind of evil.", ref: "1 Thessalonians 5:22" },
];

function getDailyVerse() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return VERSES[dayOfYear % VERSES.length];
}

export default function Room1({ onEnter, onPlayMusic, isMuted, onToggleMute }: Room1Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { progress, active } = useProgress();
  const verse = getDailyVerse();
  
  const handleEnter = () => {
    if (isOpen) return;
    onPlayMusic();
    setIsOpen(true);
    setTimeout(() => {
      onEnter();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 w-full h-screen z-[9990] pointer-events-none flex overflow-hidden">

      {/* Mute Button - Bottom Left */}
      <div className="absolute bottom-8 left-8 z-[9999] pointer-events-auto">
        <button 
          onClick={onToggleMute}
          className="text-[var(--faded)] hover:text-[var(--bone)] transition-colors duration-300 uppercase tracking-[0.2em] text-[11px] cursor-pointer"
        >
          {isMuted ? "[ Unmute ]" : "[ Mute ]"}
        </button>
      </div>

      {/* Left Gate */}
      <motion.div 
        className="w-1/2 h-full bg-[var(--void)] border-r border-[var(--whisper)]/30 flex items-center justify-end relative pointer-events-auto origin-left overflow-hidden"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isOpen ? -100 : 0 }}
        transition={{ duration: 2.2, ease: [0.76, 0, 0.24, 1] }}
        style={{ perspective: 1200 }}
      >
        <img 
          src={tailLogo} 
          alt="9ineTailss" 
          className="absolute top-[40%] right-[-3%] translate-x-1/2 -translate-y-1/2 w-[clamp(180px,40vw,700px)] max-w-none h-auto object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.25)] pointer-events-none z-10" 
        />
        <motion.div 
          className="absolute right-0 top-0 bottom-0 w-[1px] bg-[#ffeedd]"
          animate={{ 
            boxShadow: isOpen ? "0 0 100px 50px rgba(255,238,221,0)" : "0 0 60px 15px rgba(255,238,221,0.5)",
            opacity: isOpen ? 0 : 1
          }}
          transition={{ duration: 1.5 }}
        />
      </motion.div>

      {/* Right Gate */}
      <motion.div 
        className="w-1/2 h-full bg-[var(--void)] border-l border-[var(--whisper)]/30 flex items-center justify-start relative pointer-events-auto origin-right overflow-hidden"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isOpen ? 100 : 0 }}
        transition={{ duration: 2.2, ease: [0.76, 0, 0.24, 1] }}
        style={{ perspective: 1200 }}
      >
        <img 
          src={tailLogo} 
          alt="9ineTailss" 
          className="absolute top-[40%] left-[3%] -translate-x-1/2 -translate-y-1/2 w-[clamp(180px,40vw,700px)] max-w-none h-auto object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.25)] pointer-events-none z-10" 
        />
        <motion.div 
          className="absolute left-0 top-0 bottom-0 w-[1px] bg-[#ffeedd]"
          animate={{ 
            boxShadow: isOpen ? "0 0 100px 50px rgba(255,238,221,0)" : "0 0 60px 15px rgba(255,238,221,0.5)",
            opacity: isOpen ? 0 : 1
          }}
          transition={{ duration: 1.5 }}
        />
      </motion.div>

      {/* Daily Verse + Enter Button */}
      <motion.div 
        className="absolute top-[62%] sm:top-[68%] left-1/2 -translate-x-1/2 pointer-events-none z-[9995] flex flex-col items-center gap-4 w-full max-w-[500px] px-6"
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 1.1 : 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Enter Button */}
        {active || progress < 100 ? (
          <div className="font-sans text-[11px] sm:text-[13px] tracking-[0.4em] text-[var(--faded)] px-8 sm:px-12 py-4 sm:py-5 uppercase animate-pulse">
            FORMING COVENANT... {Math.round(progress)}%
          </div>
        ) : (
          <motion.button
            onClick={handleEnter}
            animate={{ 
              boxShadow: ["0 0 10px rgba(255,255,255,0.02)", "0 0 40px rgba(255,255,255,0.15)", "0 0 10px rgba(255,255,255,0.02)"],
              color: ["rgba(255,238,221,0.6)", "rgba(255,238,221,1)", "rgba(255,238,221,0.6)"]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-auto bg-[var(--void)] border border-[var(--whisper)]/40 font-sans text-[11px] sm:text-[13px] tracking-[0.3em] sm:tracking-[0.4em] uppercase px-8 sm:px-12 py-4 sm:py-5 hover:bg-[var(--bone)] hover:!text-[var(--void)] transition-all duration-700 cursor-pointer"
          >
            ENTER SANCTUARY
          </motion.button>
        )}

        {/* Divider */}
        <div className="w-[1px] h-4 bg-[var(--whisper)]/30" />

        {/* Daily Verse */}
        <motion.div
          className="text-center px-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        >
          <p className="font-serif italic text-[11px] sm:text-[13px] text-white/80 leading-relaxed mb-1">
            "{verse.text}"
          </p>
          <p className="font-sans text-[9px] sm:text-[10px] tracking-[0.3em] text-white/50 uppercase">
            — {verse.ref}
          </p>
        </motion.div>
      </motion.div>

    </div>
  );
}
