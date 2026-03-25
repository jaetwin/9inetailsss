import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ───────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  }, []);

  const dismiss = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const colorMap: Record<ToastType, string> = {
    success: 'var(--bone)',
    error:   'var(--blood)',
    info:    'var(--gold)',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast stack — bottom right */}
      <div className="fixed bottom-8 right-8 z-[10050] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.92 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{    opacity: 0, x: 40, scale: 0.92 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-center gap-4 bg-[var(--abyss)] border border-[var(--iron)] px-5 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.7)] cursor-pointer"
              onClick={() => dismiss(t.id)}
            >
              {/* color accent */}
              <div
                className="w-[2px] h-6 flex-shrink-0 rounded-full"
                style={{ backgroundColor: colorMap[t.type] }}
              />
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--bone)]">
                {t.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
