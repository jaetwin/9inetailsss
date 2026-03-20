import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/CartContext';

export function Navbar() {
  const { lineCount, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const links = [
    { to: '/', label: 'HOME' },
    { to: '/shop', label: 'SHOP' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="font-fraktur text-2xl text-white tracking-wider hover:text-white/70 transition-colors"
        >
          9INETAILSS
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`font-cinzel text-xs tracking-[0.2em] transition-colors ${
                  pathname === to ? 'text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: cart + mobile menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={openCart}
            className="relative text-white/70 hover:text-white transition-colors"
            aria-label="Open cart"
          >
            <ShoppingBag size={22} />
            {lineCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {lineCount > 9 ? '9+' : lineCount}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-white/70 hover:text-white transition-colors"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95">
          <ul className="flex flex-col py-4">
            {links.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-6 py-3 font-cinzel text-xs tracking-[0.2em] transition-colors ${
                    pathname === to ? 'text-white' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
