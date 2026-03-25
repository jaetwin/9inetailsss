import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from '@/CartContext';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/Cart';
import { Home } from '@/pages/Home';
import { Shop } from '@/pages/Shop';
import { ProductDetail } from '@/pages/ProductDetail';

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        {/* Navbar is always visible */}
        <Navbar />
        {/* Cart slides in from the right */}
        <CartDrawer />
        {/* Page routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:handle" element={<ProductDetail />} />
          {/* Fallback */}
          <Route path="*" element={<Shop />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
