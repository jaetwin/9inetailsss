import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  shopifyClient,
  CART_CREATE,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
  formatPrice,
} from '@/lib/shopify';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    product: {
      title: string;
      images: { edges: { node: { url: string; altText: string | null } }[] };
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
  cost: {
    totalAmount: { amount: string; currencyCode: string };
    subtotalAmount: { amount: string; currencyCode: string };
  };
}

interface CartContextType {
  cart: ShopifyCart | null;
  cartOpen: boolean;
  loading: boolean;
  lineCount: number;
  formattedTotal: string;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  goToCheckout: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | undefined>(undefined);

function normalizeCart(raw: unknown): ShopifyCart {
  const r = raw as {
    id: string;
    checkoutUrl: string;
    lines: { edges: { node: CartLine }[] };
    cost: ShopifyCart['cost'];
  };
  return {
    id: r.id,
    checkoutUrl: r.checkoutUrl,
    lines: r.lines.edges.map(e => e.node),
    cost: r.cost,
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      setLoading(true);
      try {
        if (!cart) {
          const { data } = await shopifyClient.request(CART_CREATE, {
            variables: { input: { lines: [{ merchandiseId: variantId, quantity }] } },
          });
          setCart(normalizeCart(data.cartCreate.cart));
        } else {
          const { data } = await shopifyClient.request(CART_LINES_ADD, {
            variables: { cartId: cart.id, lines: [{ merchandiseId: variantId, quantity }] },
          });
          setCart(normalizeCart(data.cartLinesAdd.cart));
        }
        setCartOpen(true);
      } catch (err) {
        console.error('addToCart error:', err);
      } finally {
        setLoading(false);
      }
    },
    [cart],
  );

  const removeFromCart = useCallback(
    async (lineId: string) => {
      if (!cart) return;
      setLoading(true);
      try {
        const { data } = await shopifyClient.request(CART_LINES_REMOVE, {
          variables: { cartId: cart.id, lineIds: [lineId] },
        });
        setCart(normalizeCart(data.cartLinesRemove.cart));
      } catch (err) {
        console.error('removeFromCart error:', err);
      } finally {
        setLoading(false);
      }
    },
    [cart],
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) return;
      setLoading(true);
      try {
        const { data } = await shopifyClient.request(CART_LINES_UPDATE, {
          variables: { cartId: cart.id, lines: [{ id: lineId, quantity }] },
        });
        setCart(normalizeCart(data.cartLinesUpdate.cart));
      } catch (err) {
        console.error('updateQuantity error:', err);
      } finally {
        setLoading(false);
      }
    },
    [cart],
  );

  const goToCheckout = useCallback(() => {
    if (cart?.checkoutUrl) window.location.href = cart.checkoutUrl;
  }, [cart]);

  const lineCount = cart?.lines.reduce((sum, l) => sum + l.quantity, 0) ?? 0;
  const formattedTotal = cart
    ? formatPrice(cart.cost.totalAmount.amount, cart.cost.totalAmount.currencyCode)
    : '$0.00';

  return (
    <CartContext.Provider
      value={{
        cart,
        cartOpen,
        loading,
        lineCount,
        formattedTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        openCart: () => setCartOpen(true),
        closeCart: () => setCartOpen(false),
        goToCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
