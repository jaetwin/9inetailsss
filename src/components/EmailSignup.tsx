import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

// ─── Email validation ─────────────────────────────────────────────────────────
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface EmailSignupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailSignup({ isOpen, onClose }: EmailSignupProps) {
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [status, setStatus]   = useState<Status>('idle');
  const { toast }             = useToast();

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Reset and cinematic push on open
  useEffect(() => {
    if (isOpen) {
      setEmail(''); setName(''); setStatus('idle');
      document.body.classList.add('overlay-open');
    } else {
      document.body.classList.remove('overlay-open');
    }
    return () => document.body.classList.remove('overlay-open');
  }, [isOpen]);

  const handleClose = () => {
    setStatus('idle');
    setEmail('');
    setName('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      toast('enter a valid email', 'error');
      return;
    }
    setStatus('submitting');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.result === 'success') {
        setStatus('success');
        toast('transmission received', 'success');
      } else {
        setStatus('error');
        toast(data.error ?? 'transmission failed — try again', 'error');
      }
    } catch {
      setStatus('error');
      toast('network error — check connection', 'error');
    }
  };

  const canSubmit = isValidEmail(email) && status !== 'submitting';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10010] flex items-center justify-center p-4 sm:p-8 pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[var(--void)]/60 backdrop-blur-3xl"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-[580px] bg-[var(--abyss)] border border-[var(--whisper)]/30 shadow-[0_30px_80px_rgba(0,0,0,0.9)] overflow-hidden"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top accent line */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--bone)]/30 to-transparent" />

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 font-mono text-[10px] text-[var(--faded)] tracking-[0.25em] uppercase hover:text-[var(--bone)] transition-colors duration-200 z-20"
            >
              [ CLOSE ]
            </button>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                /* ── Success State ── */
                <motion.div
                  key="success"
                  className="flex flex-col items-center justify-center py-16 px-10 text-center gap-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Cross ornament */}
                  <div className="relative w-12 h-12 opacity-40 mb-2">
                    <div className="absolute left-1/2 top-0 w-[1px] h-full bg-[var(--bone)] -translate-x-1/2" />
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[var(--bone)] -translate-y-1/2" />
                  </div>

                  <div className="font-mono text-[10px] text-[var(--gold)] tracking-[0.4em] uppercase">
                    Transmission Received
                  </div>
                  <h3 className="font-sans text-[clamp(36px,7vw,60px)] text-[var(--bone)] leading-none tracking-[0.05em] uppercase">
                    You Are<br />Inscribed
                  </h3>
                  <p className="font-serif italic text-[15px] text-[var(--parchment)] leading-relaxed max-w-[320px]">
                    "I will write my law upon their hearts." — Jeremiah 31:33
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-4 font-mono text-[11px] tracking-[0.25em] uppercase text-[var(--faded)] hover:text-[var(--bone)] transition-colors duration-200"
                  >
                    Return to Sanctuary
                  </button>
                </motion.div>
              ) : (
                /* ── Form State ── */
                <motion.div
                  key="form"
                  className="flex flex-col gap-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Header section */}
                  <div className="px-10 pt-12 pb-8 border-b border-[var(--whisper)]/15">
                    <div className="font-mono text-[10px] text-[var(--gold)] tracking-[0.4em] uppercase mb-4">
                      The Transmission
                    </div>
                    <h3 className="font-sans text-[clamp(28px,5vw,46px)] text-[var(--bone)] leading-[1] tracking-[0.05em] uppercase mb-4">
                      Receive The<br />Transmission
                    </h3>
                    <p className="font-serif italic text-[14px] text-[var(--faded)] leading-relaxed max-w-[400px]">
                      New drops, scripture, and dispatches from the remnant — delivered to those who endure.
                    </p>
                  </div>

                  {/* Form fields */}
                  <div className="px-10 py-8 flex flex-col gap-6">

                    {/* Name */}
                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[10px] tracking-[0.25em] text-[var(--faded)] uppercase">
                        Name <span className="opacity-40">— optional</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-transparent border border-[var(--whisper)]/20 text-[var(--bone)] font-sans text-[14px] tracking-[0.05em] px-4 py-3 placeholder:text-[var(--faded)]/30 focus:outline-none focus:border-[var(--whisper)]/60 transition-colors duration-300"
                      />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[10px] tracking-[0.25em] text-[var(--faded)] uppercase">
                        Email <span className="text-[var(--blood)]">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && canSubmit) handleSubmit(); }}
                        placeholder="your@email.com"
                        className="w-full bg-transparent border border-[var(--whisper)]/20 text-[var(--bone)] font-sans text-[14px] tracking-[0.05em] px-4 py-3 placeholder:text-[var(--faded)]/30 focus:outline-none focus:border-[var(--bone)]/60 transition-colors duration-300"
                      />
                    </div>

                    {status === 'error' && (
                      <p className="font-mono text-[11px] text-[var(--blood)] tracking-[0.1em]">
                        Transmission failed. Check your signal and try again.
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className={`w-full font-mono text-[12px] font-bold tracking-[0.35em] py-5 uppercase transition-all duration-500 ${
                        !canSubmit
                          ? 'bg-[var(--whisper)]/8 text-[var(--faded)]/50 cursor-not-allowed border border-[var(--whisper)]/10'
                          : 'bg-[var(--bone)] text-[var(--void)] hover:bg-[var(--gold)] hover:tracking-[0.45em] border border-transparent shadow-[0_0_30px_rgba(232,226,214,0.15)] hover:shadow-[0_0_50px_rgba(232,226,214,0.25)]'
                      }`}
                    >
                      {status === 'submitting' ? 'Transmitting...' : 'Receive The Transmission'}
                    </button>

                    <p className="font-mono text-[9px] text-[var(--faded)]/40 tracking-[0.15em] text-center uppercase">
                      No noise. Only what matters. Unsubscribe at any time.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom accent line */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--whisper)]/20 to-transparent" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
