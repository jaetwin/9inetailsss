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

export default function App() {
  const [showRoom2, setShowRoom2] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // 1. Audio and Mute State
  const [isMuted, setIsMuted] = useState(false); 
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // 2. Toggle Function logic
  const toggleMute = () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);
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

  return (
    <CartProvider>
      <div className="relative w-[100vw] h-[100vh] bg-[var(--void)] overflow-hidden cursor-none">
        
        {/* Global Audio Tag */}
        <audio ref={audioRef} src="/song.mp3" loop />

        <Cursor />
        <Grain />
        <Menu />
        
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

          {/* 4. Persistent Mute Button (Visible after entering Sanctuary) */}
 {/* Persistent Mute Button - Bottom Left */}
{showRoom2 && (
  <div className="fixed bottom-8 left-8 z-[9999] pointer-events-auto">
    <button 
      onClick={toggleMute} 
      className="text-[var(--faded)] hover:text-[var(--bone)] text-[11px] tracking-[0.2em] uppercase cursor-pointer transition-colors duration-300"
    >
      {isMuted ? "[ Unmute ]" : "[ Mute ]"}
    </button>
  </div>
)}


          <div className="w-full h-full bg-[var(--void)] absolute inset-0 pointer-events-auto">
            <ErrorBoundary fallback={<div className="p-8 text-[var(--blood)]">Failed to load 3D application.</div>}>
              <Canvas camera={{ position: [0, 0, 14], fov: 45 }} shadows>
                <ambientLight intensity={0.10} color="#ffffff" />
                <ScrollControls pages={8.5} damping={0.15} distance={1.2} enabled={showRoom2}>
                  <Scene3D />
                  <Scroll html style={{ width: '100vw' }}>
                    <div className="flex flex-col w-full html-scroll-container">
                      <Room2 isVisible={true} onProductClick={(p: any) => setSelectedProduct(p)} />
                      <Room3 />
                      <Room4 />
                      <Room5 />
                    </div>
                  </Scroll>
                </ScrollControls>
              </Canvas>
            </ErrorBoundary>
            
            {selectedProduct && (
              <ProductView product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            )}
          </div>
        </main>
        
        <Checkout />
      </div>
    </CartProvider>
  );
}
