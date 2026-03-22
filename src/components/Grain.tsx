import React from 'react';

// Detect touch/mobile device — grain animation is expensive on mobile
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export default function Grain() {
  // Skip rendering entirely on mobile — saves constant CPU/GPU usage
  if (isMobile) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] opacity-[0.06] mix-blend-overlay pointer-events-none animate-noise"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
      }}
    />
  );
}
