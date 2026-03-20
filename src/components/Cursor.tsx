import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isProductHover, setIsProductHover] = useState(false);

  useEffect(() => {
    const isTouchDevice = !window.matchMedia('(pointer: fine)').matches;
    if (isTouchDevice) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const setX = gsap.quickSetter(cursor, "x", "px");
    const setY = gsap.quickSetter(cursor, "y", "px");

    const onMouseMove = (e: MouseEvent) => {
      setX(e.clientX);
      setY(e.clientY);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if hovering over a clickable element
      const isClickable = target.closest('a, button, [role="button"], input, select, textarea');
      const isProduct = target.closest('.product-block');

      if (isProduct) {
        setIsProductHover(true);
        setIsHovering(false);
      } else if (isClickable) {
        setIsHovering(true);
        setIsProductHover(false);
      } else {
        setIsHovering(false);
        setIsProductHover(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
    };
  }, []);

  // Hide cursor on touch devices
  if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      id="cursor"
      className="fixed top-0 left-0 pointer-events-none z-[999999] flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
    >
      <div className="relative flex items-center justify-center">
        {/* Default Simple Cross */}
        <div
          className={`absolute flex items-center justify-center transition-all duration-300 ease-out ${
            isHovering || isProductHover ? 'opacity-0 scale-50 rotate-45' : 'opacity-100 scale-100 rotate-0'
          }`}
        >
          <div className="absolute w-[14px] h-[1px] bg-[var(--whisper)]" />
          <div className="absolute w-[1px] h-[14px] bg-[var(--whisper)]" />
        </div>

        {/* Hover State: Gothic Cross */}
        <div
          className={`absolute flex items-center justify-center text-[var(--bone)] transition-all duration-400 ease-[var(--ease-out-expo)] ${
            isHovering || isProductHover ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'
          }`}
        >
          <svg width="40" height="52" viewBox="0 0 40 52" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            <path d="M16 0h8v16h16v8H24v28h-8V24H0v-8h16V0z" />
          </svg>
        </div>
      </div>

      {/* Product Hover Context Label */}
      <div
        className={`absolute mt-16 font-mono text-[9px] tracking-[0.3em] text-[var(--bone)] transition-all duration-300 ease-out ${
          isProductHover ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        [ VIEW ]
      </div>
    </div>
  );
}
