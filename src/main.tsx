import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import gsap from 'gsap';
import {CartProvider} from './CartContext';
import {ToastProvider} from './components/Toast';
import ShopPage from './shop/ShopPage';
import AdminPage from './shop/AdminPage';
import OrderConfirmed from './shop/OrderConfirmed';

// Respect prefers-reduced-motion
const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: reduce)', () => {
  gsap.globalTimeline.timeScale(1000); // effectively skip animations
});

// The 3D sanctuary supplies its own providers inside App, so the flat pages get
// their own. Both carts hydrate from the same localStorage key, so a cart built
// in the shop is the cart the checkout sees.
function ShopProviders({children}: {children: React.ReactNode}) {
  return (
    <ToastProvider>
      <CartProvider>{children}</CartProvider>
    </ToastProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/shop" element={<ShopProviders><ShopPage /></ShopProviders>} />
        <Route path="/admin" element={<ShopProviders><AdminPage /></ShopProviders>} />
        <Route path="/order/confirmed" element={<ShopProviders><OrderConfirmed /></ShopProviders>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
