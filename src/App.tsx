import React, { useState, useEffect, ErrorInfo, Component, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll } from '@react-three/drei';
import Cursor from './components/Cursor';
import Grain from './components/Grain';
import Menu from './components/Menu';
import Room1 from './components/Room1';
import Room2 from './components/Room2';
import Room3 from './components/Room3';
import Room4 from './components/Room4';
import Room5 from './components/Room5';
import Scene3D from './components/Scene3D';
import ProductView from './components/ProductView';
import { CartProvider } from './CartContext';
import Checkout from './components/Checkout';
import EmailSignup from './components/EmailSignup';
import { ToastProvider } from './components/Toast';
import MaintenancePage from './components/MaintenancePage';

// Error Boundary Interface
interface ErrorBoundaryProps { children: React.ReactNode; fallback: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("ErrorBoundary caught an error:", error, errorInfo); }
  render() { if (this.state.hasError) { return this.props.fallback; } return this.props.children; }
}

// Detect mobile once at module level
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE === 'true';

export default function App() {
  const [showRoom2, setShowRoom2] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(!isMaintenanceMode);
  
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('muted') === 'true';
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const moveWidget = () => {
      const iframe = document.querySelector('iframe[title="Marketing Popup"]') as HTMLElement;
      if (iframe) {
        iframe.style.left = 'auto';
        iframe.style.right = '0px';
        iframe.style.inset = 'auto 0px 0px auto';
      }
    };

    const interval = setInterval(moveWidget, 10);
    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);
    localStorage.setItem('muted', String(nextMuteState));
    if (audioRef.current) {
      audioRef.current.muted = nextMuteState;
    }
  };

  const startMusic = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.muted = isMuted; 
      audioRef.current.play().catch(err => console.log("Audio play blocked:", err));
    }
  };

  // Show maintenance page if in maintenance mode and not unlocked
  if (isMaintenanceMode && !isUnlocked) {
    return (
      <>
        <Cursor />
        <MaintenancePage onUnlock={() => setIsUnlocked(true)} />
      </>
    );
  }

  return (
    <ToastProvider>
    <CartProvider>
      <div
        className="relative w-[100vw] h-[100vh] bg-[var(--void)] cursor-none"
        style={{ overflow: selectedProduct ? 'auto' : 'hidden' }}
      >
        
        <audio ref={audioRef} src="/song.mp3" loop />

        <Cursor />
        <Grain />
        <Menu onProductClick={(p: any) => setSelectedProduct(p)} />
        
        <div className="fixed inset-4 border border-[var(--whisper)] pointer-events-none z-[9990] opacity-30 mix-blend-overlay shadow-[inset_0_0_50px_rgba(255,238,221,0.05)]" />
        <div className="fixed inset-0 pointer-events-none z-[9980] bg-[radial-gradient(ellipse_at_center,_transparent_40%,_var(--void)_120%)] opacity-80" />

        <main className="relative w-full h-full z-10">
          <AnimatePresence mode="wait">
            {!showRoom2 && (
              <Room1 
                onEnter={() => setShowRoom2(true)} 
                onPlayMusic={startMusic}
                isMuted={isMuted}
                onToggleMute={toggleMute}
              />
            )}
          </AnimatePresence>

          {showRoom2 && !selectedProduct && (
            <div className="fixed bottom-8 left-8 z-[9999] pointer-events-auto">
              <button 
                onClick={toggleMute} 
                className="text-[var(--faded)] hover:text-[var(--bone)] text-[11px] tracking-[0.2em] uppercase cursor-pointer transition-colors duration-300"
              >
                {isMuted ? "[ Unmute ]" : "[ Mute ]"}
              </button>
            </div>
          )}

          <div id="main-scene" className="w-full h-full bg-[var(--void)] absolute inset-0 pointer-events-none">
            <ErrorBoundary fallback={<div className="p-8 text-[var(--blood)]">Failed to load 3D application.</div>}>
              <Canvas
                camera={{ position: [0, 0, 14], fov: 45 }}
                shadows={!isMobile}
                gl={{
                  antialias: !isMobile,
                  powerPreference: isMobile ? 'low-power' : 'high-performance',
                }}
                dpr={isMobile ? [1, 1.5] : [1, 2]}
              >
                <ambientLight intensity={0.10} color="#ffffff" />
                <ScrollControls
                  pages={9.5}
                  damping={isMobile ? 0.3 : 0.15}
                  distance={1.2}
                  enabled={showRoom2}
                >
                  <Scene3D />
                  <Scroll html style={{ width: '100vw' }}>
                    <div className="flex flex-col w-full html-scroll-container">
                      <Room2 isVisible={true} onProductClick={(p: any) => setSelectedProduct(p)} />
                      <Room3 />
                      <Room4 />
                      <Room5 
                        isMobile={isMobile} 
                        setEmailOpen={setIsEmailOpen} 
                        isOverlayOpen={isEmailOpen || !!selectedProduct}
                      />
                    </div>
                  </Scroll>
                </ScrollControls>
              </Canvas>
            </ErrorBoundary>
            
            <AnimatePresence mode="wait">
              {selectedProduct && (
                <ProductView key="product-view" product={selectedProduct} onClose={() => setSelectedProduct(null)} />
              )}
            </AnimatePresence>
          </div>
        </main>
        
        <Checkout />
        <EmailSignup isOpen={isEmailOpen} onClose={() => setIsEmailOpen(false)} />
      </div>
    </CartProvider>
    </ToastProvider>
  );
}
