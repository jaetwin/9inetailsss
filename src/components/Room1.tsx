import React, { useState } from 'react'; 
import { motion } from 'motion/react';
import { useProgress } from '@react-three/drei';
import tailLogo from './9tailsslogo.png';


interface Room1Props {
  onEnter: () => void;
  onPlayMusic: () => void;
  isMuted: boolean;          // Added
  onToggleMute: () => void;  // Added
}

export default function Room1({ onEnter, onPlayMusic, isMuted, onToggleMute }: Room1Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { progress, active } = useProgress();
  
  const handleEnter = () => {
    if (isOpen) return;

    // Trigger the music function that lives in App.tsx
    onPlayMusic();

    setIsOpen(true);
    
    setTimeout(() => {
      onEnter();
    }, 1800);
  };

  // ... existing logic ...

 

  return (
    <div className="fixed inset-0 w-full h-screen z-[9990] pointer-events-none flex overflow-hidden">
      {/* Audio tag is REMOVED from here */}
  
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
        <div className="absolute inset-0 pointer-events-none" />
        <img 
          src={tailLogo} 
          alt="9ineTailss" 
          className="absolute top-[42%] right-[-3%] translate-x-1/2 -translate-y-1/2 w-[clamp(300px,50vw,700px)] max-w-none h-auto object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.25)] pointer-events-none z-10" 
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
        <div className="absolute inset-0 pointer-events-none" />
        <img 
          src={tailLogo} 
          alt="9ineTailss" 
          className="absolute top-[42%] left-[3%] -translate-x-1/2 -translate-y-1/2 w-[clamp(300px,50vw,700px)] max-w-none h-auto object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.25)] pointer-events-none z-10" 
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

      <motion.div 
        className="absolute top-[75%] left-1/2 -translate-x-1/2 pointer-events-none z-[9995]"
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 1.1 : 1 }}
        transition={{ duration: 0.6 }}
      >
        {active || progress < 100 ? (
          <div className="font-sans text-[13px] tracking-[0.4em] text-[var(--faded)] px-12 py-5 uppercase animate-pulse">
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
            className="pointer-events-auto bg-[var(--void)] border border-[var(--whisper)]/40 font-sans text-[13px] tracking-[0.4em] uppercase px-12 py-5 hover:bg-[var(--bone)] hover:!text-[var(--void)] hover:!shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all duration-700 cursor-pointer hover:tracking-[0.5em]"
          >
            ENTER SANCTUARY
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
