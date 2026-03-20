import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import gsap from 'gsap';

// Respect prefers-reduced-motion
const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: reduce)', () => {
  gsap.globalTimeline.timeScale(1000); // effectively skip animations
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
