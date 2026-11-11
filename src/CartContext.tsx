import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createCheckoutSession } from './shop/api';
export interface CartItem {
  id: string | number;
  displayIndex?: number;
  name: string;
  price: number;
  quantity: number;
  shopifyVariantId?: string; // populated when product comes from Shopify
  variantLabel?: string; // e.g. "Black / Medium" — shown alongside name so lines are distinguishable
}
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string | number, shopifyVariantId?: string) => void;
  updateQuantity: (id: string | number, delta: number, shopifyVariantId?: string) => void;
  cartTotal: number;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (val: boolean) => void;
  clearCart: () => void;
  goToShopifyCheckout: () => Promise<boolean>;
  shopifyEnabled: boolean;
}
const CartContext = createContext<CartContextType | undefined>(undefined);

// A cart "line" is uniquely identified by product id + variant id together —
// this is what was missing before, causing different variants of the same
// product to be merged into a single line.
function sameLine(item: CartItem, id: string | number, shopifyVariantId?: string) {
  return item.id === id && (item.shopifyVariantId ?? null) === (shopifyVariantId ?? null);
}

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
      const existing = prev.find(item => sameLine(item, product.id, product.shopifyVariantId));
      if (existing) {
        return prev.map(item =>
          sameLine(item, product.id, product.shopifyVariantId)
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      let numericPrice = 0;
      if (typeof product.price === 'string') {
        numericPrice = parseInt(product.price.replace(/[^0-9]/g, ''), 10);
      } else {
        numericPrice = product.price;
      }
      let variantLabel: string | undefined;
      if (product.selectedOptionsLabel) {
        variantLabel = product.selectedOptionsLabel;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: numericPrice,
          quantity: 1,
          shopifyVariantId: product.shopifyVariantId,
          variantLabel,
        },
      ];
    });
  };
  const removeFromCart = (id: string | number, shopifyVariantId?: string) => {
    setCartItems(prev => prev.filter(item => !sameLine(item, id, shopifyVariantId)));
  };
  const updateQuantity = (id: string | number, delta: number, shopifyVariantId?: string) => {
    setCartItems(prev =>
      prev.map(item => {
        if (sameLine(item, id, shopifyVariantId)) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      }),
    );
  };
  const clearCart = () => setCartItems([]);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Lines carry `${slug}::${size}` from the catalogue mapper, so the checkout
  // request can be rebuilt without asking Shopify anything.
  const goToShopifyCheckout = async () => {
    const items = cartItems.map(item => {
      const [, option] = String(item.shopifyVariantId ?? '').split('::');
      return { slug: String(item.id), option: option || undefined, quantity: item.quantity };
    });
    if (items.length === 0) return false;
    const checkoutUrl = await createCheckoutSession(items);
    if (!checkoutUrl) return false;
    window.location.href = checkoutUrl;
    return true;
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
        shopifyEnabled: true,
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
