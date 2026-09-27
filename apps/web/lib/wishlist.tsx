'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAccessToken } from './auth';
import type { Product } from './api';

type WishlistItem = {
  product: Product;
  addedAt: string;
};

type WishlistContextType = {
  items: WishlistItem[];
  count: number;
  isSaved: (productId: string) => boolean;
  toggle: (product: Product) => Promise<void>;
  remove: (productId: string) => Promise<void>;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    let cancelled = false;

    fetch(`${apiUrl}/wishlist`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar la lista');
        return response.json() as Promise<WishlistItem[]>;
      })
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const isSaved = (productId: string) =>
    items.some((item) => item.product.id === productId);

  const toggle = async (product: Product) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Necesitás iniciar sesión');
    }

    const saved = isSaved(product.id);
    const response = await fetch(`${apiUrl}/wishlist/${product.id}`, {
      method: saved ? 'DELETE' : 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('No se pudo actualizar la lista');
    }

    setItems((prev) =>
      saved
        ? prev.filter((item) => item.product.id !== product.id)
        : [...prev, { product, addedAt: new Date().toISOString() }]
    );
  };

  const remove = async (productId: string) => {
    const token = getAccessToken();
    if (!token) return;

    await fetch(`${apiUrl}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  return (
    <WishlistContext.Provider
      value={{ items, count: items.length, isSaved, toggle, remove }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}