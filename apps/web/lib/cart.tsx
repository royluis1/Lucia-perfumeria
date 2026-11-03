'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { apiFetch, AUTH_CHANGE_EVENT, getAccessToken } from './auth';

type CartItem = {
  id: string;
  productId: string;
  name: string;
  brand: string;
  price: number;
  image?: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const itemsRef = useRef(items);
  const syncingRef = useRef(false);
  const syncAgainRef = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const stored = localStorage.getItem('lucia_cart');
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        localStorage.removeItem('lucia_cart');
      }
    }
    setCartReady(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('lucia_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!cartReady) return;
    let active = true;

    async function syncCart() {
      if (!getAccessToken()) return;
      if (syncingRef.current) {
        syncAgainRef.current = true;
        return;
      }

      syncingRef.current = true;
      try {
        do {
          syncAgainRef.current = false;
          if (!getAccessToken()) break;

          const response = await apiFetch('/cart', {}, { redirectOnExpired: false });
          if (!response.ok) {
            if (response.status !== 401 && getAccessToken()) {
              console.error('No se pudo cargar el carrito para fusionarlo con la cuenta.');
            }
            break;
          }

          const remoteCart = (await response.json()) as {
            items: Array<{ productId: string; quantity: number }>;
          };
          const remoteItems = new Map(remoteCart.items.map((item) => [item.productId, item.quantity]));

          for (const localItem of itemsRef.current) {
            if (!active || !getAccessToken()) break;
            const remoteQuantity = remoteItems.get(localItem.productId) ?? 0;
            const quantity = Math.min(99, Math.max(remoteQuantity, localItem.quantity));
            if (quantity === remoteQuantity) continue;

            const isExisting = remoteItems.has(localItem.productId);
            const updateResponse = await apiFetch(
              isExisting ? `/cart/items/${encodeURIComponent(localItem.productId)}` : '/cart/items',
              {
                method: isExisting ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                  isExisting
                    ? { quantity }
                    : { productId: localItem.productId, quantity },
                ),
              },
              { redirectOnExpired: false },
            );
            if (updateResponse.status === 401) break;
            if (!updateResponse.ok) {
              console.error(`No se pudo fusionar el producto ${localItem.productId} con el carrito de la cuenta.`);
              continue;
            }
            remoteItems.set(localItem.productId, quantity);
          }
        } while (active && syncAgainRef.current && getAccessToken());
      } catch (error) {
        if (getAccessToken()) {
          console.error('No se pudo fusionar el carrito de esta sesión con la cuenta.', error);
        }
      } finally {
        syncingRef.current = false;
      }
    }

    window.addEventListener(AUTH_CHANGE_EVENT, syncCart);
    if (getAccessToken()) void syncCart();
    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, syncCart);
    };
  }, [cartReady]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantity = Math.min(99, Math.max(1, Math.floor(item.quantity ?? 1)));
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        toggleCart: () => setIsOpen((prev) => !prev),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}