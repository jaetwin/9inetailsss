import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PrayerRequestProps {
  isOpen: boolean;
  onClose: () => void;
}

const FORM_ID = '1FAIpQLSdX4sVqgB20EdNvgTv9tRys6D2fNbFKB7Jza37LdD3nkGdhuw';
const ENTRY_NAME = 'entry.1044088558';
const ENTRY_PRAYER = 'entry.1266948236';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function PrayerRequest({ isOpen, onClose }: PrayerRequestProps) {
  const [name, setName] = useState('');
  const [prayer, setPrayer] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = async () => {
    if (!prayer.trim()) return;
    setStatus('submitting');

    try {
      const body = new FormData();
      body.append(ENTRY_NAME, name.trim());
      body.append(ENTRY_PRAYER, prayer.trim());

      await fetch(
        `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`,
        { method: 'POST', body, mode: 'no-cors' }
      );

      // no-cors means we can't read the response, but if no error thrown it worked
      setStatus('success');
      setName('');
      setPrayer('');
    } catch {
      setStatus('error');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setName('');
    setPrayer('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10006] flex items-center justify-center p-8 pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-md"
            onClick={handleClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-[540px] border border-[var(--whisper)]/30 bg-[var(--void)]/95 p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 font-sans text-[11px] text-[var(--faded)] tracking-[0.2em] uppercase hover:text-[var(--bone)] transition-colors duration-200"
            >
              CLOSE
            </button>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  className="flex flex-col items-center justify-center py-12 text-center gap-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="font-sans text-[11px] text-[var(--blood)] tracking-[0.3em] uppercase">
                    PRAYER RECEIVED
                  </div>
                  <h3 className="font-bebas text-[48px] text-[var(--bone)] leading-none tracking-wide">
                    WE WILL PRAY
                  </h3>
                  <p className="font-serif italic text-[16px] text-[var(--parchment)] leading-relaxed max-w-[340px]">
                    "The prayer of a righteous person is powerful and effective." — James 5:16
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-4 font-sans text-[12px] tracking-[0.2em] uppercase text-[var(--faded)] hover:text-[var(--bone)] transition-colors duration-200"
                  >
                    RETURN TO SCENE
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6"
                >
                  {/* Header */}
                  <div className="mb-2">
                    <div className="font-sans text-[11px] text-[var(--blood)] tracking-[0.3em] uppercase mb-3">
                      LIFT YOUR BURDEN
                    </div>
                    <h3 className="font-bebas text-[52px] text-[var(--bone)] leading-none tracking-wide uppercase">
                      Prayer Request
                    </h3>
                    <div className="w-8 h-[1px] bg-[var(--whisper)] mt-4" />
                  </div>

                  <p className="font-serif italic text-[14px] text-[var(--faded)] leading-relaxed">
                    Share your request and we will carry it before the LORD. You may remain anonymous.
                  </p>

                  {/* Name field */}
                  <div className="flex flex-col gap-2">
                    <label className="font-sans text-[10px] tracking-[0.25em] text-[var(--faded)] uppercase">
                      Name <span className="opacity-50">— optional</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name or leave blank"
                      className="bg-transparent border border-[var(--whisper)]/20 text-[var(--bone)] font-sans text-[14px] px-4 py-3 placeholder:text-[var(--faded)]/40 focus:outline-none focus:border-[var(--whisper)]/60 transition-colors duration-200"
                    />
                  </div>

                  {/* Prayer field */}
                  <div className="flex flex-col gap-2">
                    <label className="font-sans text-[10px] tracking-[0.25em] text-[var(--faded)] uppercase">
                      Prayer Request <span className="text-[var(--blood)]">*</span>
                    </label>
                    <textarea
                      value={prayer}
                      onChange={e => setPrayer(e.target.value)}
                      placeholder="Share what's on your heart..."
                      rows={5}
                      className="bg-transparent border border-[var(--whisper)]/20 text-[var(--bone)] font-sans text-[14px] px-4 py-3 placeholder:text-[var(--faded)]/40 focus:outline-none focus:border-[var(--whisper)]/60 transition-colors duration-200 resize-none"
                    />
                  </div>

                  {status === 'error' && (
                    <p className="font-sans text-[11px] text-[var(--blood)] tracking-[0.1em]">
                      Something went wrong. Please try again.
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!prayer.trim() || status === 'submitting'}
                    className={`w-full font-sans text-[13px] font-bold tracking-[0.3em] py-4 uppercase transition-all duration-300 ${
                      !prayer.trim() || status === 'submitting'
                        ? 'bg-[var(--whisper)]/10 text-[var(--faded)] cursor-not-allowed'
                        : 'bg-[var(--bone)] text-[var(--void)] hover:bg-[var(--gold)]'
                    }`}
                  >
                    {status === 'submitting' ? 'SENDING...' : 'SUBMIT PRAYER'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
