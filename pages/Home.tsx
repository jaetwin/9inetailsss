import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import gsap from 'gsap';

function AngelModel() {
  const { scene } = useGLTF('/Angel2.glb');
  return <primitive object={scene} scale={1.5} position={[0, -1, 0]} />;
}

export function Home() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(headlineRef.current, { y: 60, opacity: 0, duration: 1.2 })
      .from(subRef.current, { y: 30, opacity: 0, duration: 0.8 }, '-=0.6')
      .from(ctaRef.current, { y: 20, opacity: 0, duration: 0.6 }, '-=0.4');
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* 3D Background */}
        <div className="absolute inset-0 opacity-60">
          <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
            <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8888ff" />
            <AngelModel />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.6}
            />
            <Environment preset="night" />
          </Canvas>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />

        {/* Hero text */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16">
          <h1
            ref={headlineRef}
            className="font-fraktur text-6xl md:text-8xl lg:text-9xl leading-none mb-6"
            style={{ textShadow: '0 0 60px rgba(255,255,255,0.1)' }}
          >
            9INETAILSS
          </h1>
          <p
            ref={subRef}
            className="font-garamond text-xl md:text-2xl text-white/60 italic mb-8 max-w-md"
          >
            A dark digital cathedral for those who carry the weight of faith.
          </p>
          <div ref={ctaRef} className="flex flex-wrap gap-4">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-cinzel text-sm tracking-[0.2em] hover:bg-white/90 active:scale-95 transition-all"
            >
              SHOP THE COLLECTION
            </Link>
            <a
              href="#story"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-cinzel text-sm tracking-[0.2em] hover:border-white hover:bg-white/5 transition-all"
            >
              OUR STORY
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-white/30 animate-pulse" />
          <span className="font-cinzel text-[9px] tracking-[0.3em]">SCROLL</span>
        </div>
      </section>

      {/* ── Story ────────────────────────────────────────────────────── */}
      <section id="story" className="py-32 px-6 max-w-4xl mx-auto text-center">
        <p className="font-cinzel text-xs tracking-[0.4em] text-white/30 mb-6">THE MISSION</p>
        <h2 className="font-fraktur text-5xl md:text-6xl mb-8 leading-tight">
          Wear Your Faith
        </h2>
        <p className="font-garamond text-xl text-white/60 italic leading-relaxed max-w-2xl mx-auto">
          Faith is not a whisper. It is armour. Every stitch is a prayer, every thread a testament.
          We build garments for those who are unashamed — who wear their belief like a breastplate
          into the noise of the world.
        </p>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────── */}
      <section className="border-t border-b border-white/10 py-20 px-6 text-center">
        <h3 className="font-cinzel text-3xl md:text-4xl tracking-widest mb-6">
          THE COLLECTION IS LIVE
        </h3>
        <Link
          to="/shop"
          className="inline-flex px-10 py-5 bg-white text-black font-cinzel text-sm tracking-[0.25em] hover:bg-white/90 transition-all"
        >
          ENTER THE SHOP
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 text-center border-t border-white/10">
        <p className="font-cinzel text-xs tracking-[0.3em] text-white/20">
          © {new Date().getFullYear()} 9INETAILSS — WEAR YOUR FAITH
        </p>
      </footer>
    </main>
  );
}
