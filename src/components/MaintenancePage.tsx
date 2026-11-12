import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import tailLogo from './9tailsslogo.png';

// The password is checked by the server (MAINTENANCE_PASSWORD), never shipped
// to the browser. A correct one sets a signed cookie that unlocks every page.
export default function MaintenancePage({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/maintenance/unlock', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (response?.ok) {
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

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isIOS) {
      window.location.href = 'sms:+18446621746&body=CHRIST';
    } else if (isAndroid) {
      window.location.href = 'sms:+18446621746?body=CHRIST';
    } else {
      // Desktop: use Postscript popup
      if (window.postscript) {
        window.postscript.popups.open(833871, {
          activePopupBehavior: 'ALWAYS_DISMISS',
          respectPopupStatus: false,
        });
      }
    }

    setSmsSent(true);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[var(--void)] z-[99999] overflow-y-auto">

      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{ backgroundImage: 'url(/grain.png)', backgroundRepeat: 'repeat' }} />

      {/* Gothic Church Windows SVG Background */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.08]">
        <div style={{ width: '600px', maxWidth: '90vw' }}>
          <svg width="100%" viewBox="0 0 680 520" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <style>{`
              .tracery { fill: none; stroke: #ffeedd; stroke-width: 1.2; }
              .tracery-bold { fill: none; stroke: #ffeedd; stroke-width: 2; }
              .pane { fill: #ffeedd; opacity: 0.08; }
            `}</style>
            <path d="M90,480 L90,200 Q90,110 170,110 Q250,110 250,200 L250,480 Z" className="tracery-bold"/>
            <line x1="170" y1="480" y2="300" x2="170" className="tracery"/>
            <path d="M100,480 L100,230 Q100,160 135,160 Q170,160 170,230 L170,480" className="tracery"/>
            <path d="M100,350 L100,230 Q100,160 135,160 Q170,160 170,230 L170,350 Z" className="pane"/>
            <path d="M170,480 L170,230 Q170,160 205,160 Q240,160 240,230 L240,480" className="tracery"/>
            <path d="M170,350 L170,230 Q170,160 205,160 Q240,160 240,350 Z" className="pane"/>
            <circle cx="170" cy="155" r="28" className="tracery"/>
            <circle cx="170" cy="155" r="14" className="pane"/>
            <circle cx="170" cy="155" r="6" className="tracery"/>
            <line x1="143" y1="155" x2="197" y2="155" className="tracery"/>
            <line x1="170" y1="128" x2="170" y2="182" className="tracery"/>
            <line x1="150" y1="135" x2="190" y2="175" className="tracery"/>
            <line x1="190" y1="135" x2="150" y2="175" className="tracery"/>
            <line x1="100" y1="350" x2="240" y2="350" className="tracery"/>
            <circle cx="135" cy="270" r="16" className="tracery"/>
            <circle cx="205" cy="270" r="16" className="tracery"/>
            <path d="M255,480 L255,170 Q255,60 340,60 Q425,60 425,170 L425,480 Z" className="tracery-bold"/>
            <line x1="305" y1="480" y2="310" x2="305" className="tracery"/>
            <line x1="340" y1="480" y2="280" x2="340" className="tracery"/>
            <line x1="375" y1="480" y2="310" x2="375" className="tracery"/>
            <path d="M265,480 L265,220 Q265,145 285,130 Q305,115 305,190 L305,480" className="tracery"/>
            <path d="M265,340 L265,220 Q265,145 285,130 Q305,115 305,190 L305,340 Z" className="pane"/>
            <path d="M305,480 L305,190 Q305,110 340,100 Q375,110 375,190 L375,480" className="tracery"/>
            <path d="M305,310 L305,190 Q305,110 340,100 Q375,110 375,190 L375,310 Z" className="pane"/>
            <path d="M375,480 L375,190 Q375,115 395,130 Q415,145 415,220 L415,480" className="tracery"/>
            <path d="M375,340 L375,190 Q375,115 395,130 Q415,145 415,340 Z" className="pane"/>
            <circle cx="340" cy="110" r="42" className="tracery-bold"/>
            <circle cx="340" cy="110" r="28" className="pane"/>
            <circle cx="340" cy="110" r="14" className="tracery"/>
            <circle cx="340" cy="110" r="5" className="tracery"/>
            <circle cx="340" cy="82" r="10" className="tracery"/>
            <circle cx="340" cy="138" r="10" className="tracery"/>
            <circle cx="312" cy="110" r="10" className="tracery"/>
            <circle cx="368" cy="110" r="10" className="tracery"/>
            <circle cx="321" cy="91" r="10" className="tracery"/>
            <circle cx="359" cy="91" r="10" className="tracery"/>
            <circle cx="321" cy="129" r="10" className="tracery"/>
            <circle cx="359" cy="129" r="10" className="tracery"/>
            <line x1="265" y1="340" x2="415" y2="340" className="tracery"/>
            <line x1="265" y1="310" x2="415" y2="310" className="tracery"/>
            <circle cx="285" cy="255" r="14" className="tracery"/>
            <circle cx="340" cy="235" r="14" className="tracery"/>
            <circle cx="395" cy="255" r="14" className="tracery"/>
            <path d="M430,480 L430,200 Q430,110 510,110 Q590,110 590,200 L590,480 Z" className="tracery-bold"/>
            <line x1="510" y1="480" y2="300" x2="510" className="tracery"/>
            <path d="M440,480 L440,230 Q440,160 475,160 Q510,160 510,230 L510,480" className="tracery"/>
            <path d="M440,350 L440,230 Q440,160 475,160 Q510,160 510,230 L510,350 Z" className="pane"/>
            <path d="M510,480 L510,230 Q510,160 545,160 Q580,160 580,230 L580,480" className="tracery"/>
            <path d="M510,350 L510,230 Q510,160 545,160 Q580,160 545,230 L510,350 Z" className="pane"/>
            <circle cx="510" cy="155" r="28" className="tracery"/>
            <circle cx="510" cy="155" r="14" className="pane"/>
            <circle cx="510" cy="155" r="6" className="tracery"/>
            <line x1="483" y1="155" x2="537" y2="155" className="tracery"/>
            <line x1="510" y1="128" x2="510" y2="182" className="tracery"/>
            <line x1="490" y1="135" x2="530" y2="175" className="tracery"/>
            <line x1="530" y1="135" x2="490" y2="175" className="tracery"/>
            <line x1="440" y1="350" x2="580" y2="350" className="tracery"/>
            <circle cx="475" cy="270" r="16" className="tracery"/>
            <circle cx="545" cy="270" r="16" className="tracery"/>
          </svg>
        </div>
      </div>

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_var(--void)_120%)] opacity-80" />

      {/* Border */}
      <div className="fixed inset-4 border border-[var(--whisper)] pointer-events-none z-10 opacity-30 mix-blend-overlay" />

      {/* Scrollable content wrapper */}
      <div className="relative z-10 min-h-full flex flex-col items-center justify-center py-16 px-6">
        <motion.div
          className="flex flex-col items-center gap-10 w-full max-w-[420px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Logo */}
          <motion.img
            src={tailLogo}
            alt="9ineTailss"
            className="w-[clamp(100px,25vw,200px)] h-auto object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
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
            <h1 className="font-serif text-[clamp(20px,5vw,32px)] text-[var(--bone)] tracking-[0.15em] uppercase">
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
            animate={shaking ? { x: [-10, 10, -10, 10, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER KEY"
              className="w-full bg-transparent border border-[var(--whisper)]/30 text-[var(--bone)] placeholder-[var(--faded)] font-sans text-[11px] tracking-[0.4em] uppercase px-5 py-4 outline-none focus:border-[var(--whisper)]/70 transition-colors duration-300 text-center"
              style={{ caretColor: 'var(--bone)' }}
              autoFocus
            />
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
          <div className="w-full flex flex-col items-center gap-4 pb-4">
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
    </div>
  );
}
