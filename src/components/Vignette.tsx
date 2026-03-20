import React from 'react';

export default function Vignette() {
  return (
    <>
      {/* Vignette removed to avoid color banding and concentric circles */}

      {/* Scanline Overlay */}
      <div
        className="fixed inset-0 z-[9997] pointer-events-none mix-blend-multiply"
        style={{
          background: `repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.06) 2px,
            rgba(0,0,0,0.06) 3px
          )`
        }}
      />
    </>
  );
}
