import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createShopifyCheckout, isShopifyConfigured } from './lib/shopify';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  shopifyVariantId?: string; // populated when product comes from Shopify
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  cartTotal: number;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (val: boolean) => void;
  clearCart: () => void;
  goToShopifyCheckout: () => Promise<void>;
  shopifyEnabled: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('9inetailss_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('9inetailss_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      let numericPrice = 0;
      if (typeof product.price === 'string') {
        numericPrice = parseInt(product.price.replace(/[^0-9]/g, ''), 10);
      } else {
        numericPrice = product.price;
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: numericPrice,
          quantity: 1,
          shopifyVariantId: product.shopifyVariantId,
        },
      ];
    });
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      }),
    );
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Creates a real Shopify cart from current items and redirects to checkout.
  // Falls back gracefully if Shopify is not configured or items lack variant IDs.
  const goToShopifyCheckout = async () => {
    const lines = cartItems
      .filter(item => item.shopifyVariantId)
      .map(item => ({ variantId: item.shopifyVariantId!, quantity: item.quantity }));

    if (lines.length === 0) return; // nothing to send to Shopify

    const checkoutUrl = await createShopifyCheckout(lines);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartTotal,
        isCheckoutOpen,
        setIsCheckoutOpen,
        clearCart,
        goToShopifyCheckout,
        shopifyEnabled: isShopifyConfigured,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
