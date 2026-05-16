import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import tailLogo from './9tailsslogo.png';

const CORRECT_PASSWORD = import.meta.env.VITE_MAINTENANCE_PASSWORD || 'sanctuary';

export default function MaintenancePage({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [phone, setPhone] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Check if already unlocked in session
  useEffect(() => {
    if (sessionStorage.getItem('unlocked') === 'true') {
      onUnlock();
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem('unlocked', 'true');
      onUnlock();
    } else {
      setError(true);
      setShaking(true);
      setPassword('');
      setTimeout(() => setShaking(false), 600);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.postscript) {
      window.postscript.popups.open(833871, {
        activePopupBehavior: 'ALWAYS_DISMISS',
        respectPopupStatus: false,
      });
    }
    setSmsSent(true);
  };

  return (
    <div className="fixed inset-0 w-full h-screen bg-[var(--void)] flex flex-col items-center justify-center z-[99999] overflow-hidden cursor-none">

      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{ backgroundImage: 'url(/grain.png)', backgroundRepeat: 'repeat' }} />

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_var(--void)_120%)] opacity-80" />

      {/* Border */}
      <div className="fixed inset-4 border border-[var(--whisper)] pointer-events-none z-10 opacity-30 mix-blend-overlay" />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-10 w-full max-w-[420px] px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Logo */}
        <motion.img
          src={tailLogo}
          alt="9ineTailss"
          className="w-[clamp(120px,30vw,220px)] h-auto object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
          animate={{
            filter: [
              'drop-shadow(0 0 20px rgba(255,238,221,0.1))',
              'drop-shadow(0 0 40px rgba(255,238,221,0.3))',
              'drop-shadow(0 0 20px rgba(255,238,221,0.1))',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-sans text-[10px] tracking-[0.5em] text-[var(--faded)] uppercase">
            We'll be back soon
          </p>
          <h1 className="font-serif text-[clamp(22px,5vw,32px)] text-[var(--bone)] tracking-[0.15em] uppercase">
            Sanctuary Closed
          </h1>
          <div className="w-12 h-[1px] bg-[var(--whisper)] opacity-30" />
          <p className="font-sans text-[11px] text-[var(--faded)] tracking-[0.1em] leading-relaxed">
            We are tending to the grounds.<br />Enter your key to proceed.
          </p>
        </div>

        {/* Password Form */}
        <motion.form
          onSubmit={handlePasswordSubmit}
          className="w-full flex flex-col gap-3"
          animate={shaking ? {
            x: [-10, 10, -10, 10, -6, 6, -3, 3, 0],
          } : { x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER KEY"
              className="w-full bg-transparent border border-[var(--whisper)]/30 text-[var(--bone)] placeholder-[var(--faded)] font-sans text-[11px] tracking-[0.4em] uppercase px-5 py-4 outline-none focus:border-[var(--whisper)]/70 transition-colors duration-300 text-center"
              style={{ caretColor: 'var(--bone)' }}
              autoFocus
            />
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                className="text-center font-sans text-[10px] tracking-[0.3em] text-[var(--blood)] uppercase"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                Invalid Key
              </motion.p>
            )}
          </AnimatePresence>
          <motion.button
            type="submit"
            className="w-full bg-transparent border border-[var(--whisper)]/40 font-sans text-[11px] tracking-[0.4em] uppercase px-8 py-4 text-[var(--bone)] hover:bg-[var(--bone)] hover:text-[var(--void)] transition-all duration-700 cursor-pointer"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Unlock
          </motion.button>
        </motion.form>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 h-[1px] bg-[var(--whisper)] opacity-20" />
          <p className="font-sans text-[9px] tracking-[0.4em] text-[var(--faded)] uppercase">or</p>
          <div className="flex-1 h-[1px] bg-[var(--whisper)] opacity-20" />
        </div>

        {/* SMS Notify */}
        <div className="w-full flex flex-col items-center gap-4">
          <p className="font-sans text-[10px] tracking-[0.3em] text-[var(--faded)] uppercase text-center">
            Get notified when we go live
          </p>
          <AnimatePresence mode="wait">
            {!smsSent ? (
              <motion.button
                key="sms-btn"
                onClick={handleSmsSubmit}
                className="w-full bg-transparent border border-[var(--whisper)]/40 font-sans text-[11px] tracking-[0.4em] uppercase px-8 py-4 text-[var(--faded)] hover:text-[var(--bone)] hover:border-[var(--whisper)]/70 transition-all duration-700 cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Notify Me via SMS
              </motion.button>
            ) : (
              <motion.p
                key="sms-confirmed"
                className="font-sans text-[10px] tracking-[0.4em] text-[var(--bone)] uppercase text-center"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ✦ You'll be the first to know
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}
