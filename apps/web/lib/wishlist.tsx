'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { apiFetch, AUTH_CHANGE_EVENT, getAccessToken } from './auth';
import type { ProductSummary } from './api';

type WishlistItem = {
  product: ProductSummary;
  addedAt: string;
};

type WishlistContextType = {
  items: WishlistItem[];
  count: number;
  isSaved: (productId: string) => boolean;
  toggle: (product: ProductSummary) => Promise<boolean>;
  remove: (productId: string) => Promise<void>;
};

const PENDING_WISHLIST_KEY = 'lucia_pending_wishlist';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

function mergeItems(...lists: WishlistItem[][]): WishlistItem[] {
  const items = new Map<string, WishlistItem>();
  for (const list of lists) {
    for (const item of list) {
      if (!items.has(item.product.id)) items.set(item.product.id, item);
    }
  }
  return [...items.values()];
}

function readPendingItems(): WishlistItem[] {
  const stored = window.localStorage.getItem(PENDING_WISHLIST_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Invalid pending wishlist data');
    return parsed.filter((item): item is WishlistItem =>
      typeof item === 'object' &&
      item !== null &&
      'product' in item &&
      typeof item.product === 'object' &&
      item.product !== null &&
      'id' in item.product &&
      typeof item.product.id === 'string',
    );
  } catch {
    window.localStorage.removeItem(PENDING_WISHLIST_KEY);
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [remoteItems, setRemoteItems] = useState<WishlistItem[]>([]);
  const [pendingItems, setPendingItems] = useState<WishlistItem[]>([]);
  const [pendingReady, setPendingReady] = useState(false);
  const pendingRef = useRef<WishlistItem[]>([]);
  const syncingRef = useRef(false);
  const syncAgainRef = useRef(false);
  const items = mergeItems(remoteItems, pendingItems);

  useEffect(() => {
    const stored = readPendingItems();
    pendingRef.current = stored;
    setPendingItems(stored);
    setPendingReady(true);
  }, []);

  function persistPending(next: WishlistItem[]) {
    pendingRef.current = next;
    setPendingItems(next);
    if (next.length === 0) {
      window.localStorage.removeItem(PENDING_WISHLIST_KEY);
    } else {
      window.localStorage.setItem(PENDING_WISHLIST_KEY, JSON.stringify(next));
    }
  }

  useEffect(() => {
    if (!pendingReady) return;
    let active = true;

    async function syncWishlist() {
      if (!getAccessToken()) {
        setRemoteItems([]);
        return;
      }
      if (syncingRef.current) {
        syncAgainRef.current = true;
        return;
      }

      syncingRef.current = true;
      try {
        do {
          syncAgainRef.current = false;
          if (!getAccessToken()) break;

          const response = await apiFetch('/wishlist', {}, { redirectOnExpired: false });
          if (response.status === 401) break;
          if (!response.ok) {
            console.error('No se pudo cargar la lista de favoritos de la cuenta.');
            break;
          }

          let remote = (await response.json()) as WishlistItem[];
          if (active) setRemoteItems(remote);
          let pending = pendingRef.current;

          for (const item of pending) {
            if (!active || !getAccessToken()) break;
            if (remote.some((saved) => saved.product.id === item.product.id)) {
              pending = pending.filter((queued) => queued.product.id !== item.product.id);
              persistPending(pending);
              continue;
            }

            const addResponse = await apiFetch(`/wishlist/${encodeURIComponent(item.product.id)}`, {
              method: 'POST',
            }, { redirectOnExpired: false });
            if (addResponse.status === 401) break;
            if (!addResponse.ok && addResponse.status !== 409) {
              console.error(`No se pudo guardar el favorito ${item.product.id} en la cuenta.`);
              break;
            }

            remote = [item, ...remote];
            if (active) setRemoteItems(remote);
            pending = pending.filter((queued) => queued.product.id !== item.product.id);
            persistPending(pending);
          }
        } while (active && syncAgainRef.current && getAccessToken());
      } catch (error) {
        if (getAccessToken()) {
          console.error('No se pudieron sincronizar los favoritos guardados en este dispositivo.', error);
        }
      } finally {
        syncingRef.current = false;
      }
    }

    window.addEventListener(AUTH_CHANGE_EVENT, syncWishlist);
    if (getAccessToken()) void syncWishlist();
    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, syncWishlist);
    };
  }, [pendingReady]);

  const isSaved = (productId: string) =>
    items.some((item) => item.product.id === productId);

  const toggle = async (product: ProductSummary): Promise<boolean> => {
    const token = getAccessToken();
    const pending = pendingRef.current.find((item) => item.product.id === product.id);

    if (!token) {
      if (pending) {
        persistPending(pendingRef.current.filter((item) => item.product.id !== product.id));
      } else {
        persistPending([
          ...pendingRef.current,
          { product, addedAt: new Date().toISOString() },
        ]);
      }
      return false;
    }

    if (pending && !remoteItems.some((item) => item.product.id === product.id)) {
      persistPending(pendingRef.current.filter((item) => item.product.id !== product.id));
      return true;
    }

    const saved = remoteItems.some((item) => item.product.id === product.id);
    const response = await apiFetch(`/wishlist/${encodeURIComponent(product.id)}`, {
      method: saved ? 'DELETE' : 'POST',
    }, { redirectOnExpired: false });

    if (response.status === 401 && !getAccessToken()) return false;
    if (!response.ok && !(response.status === 409 && !saved)) {
      throw new Error('No se pudo actualizar la lista de favoritos.');
    }

    setRemoteItems((current) =>
      saved
        ? current.filter((item) => item.product.id !== product.id)
        : mergeItems([{ product, addedAt: new Date().toISOString() }], current),
    );
    return true;
  };

  const remove = async (productId: string) => {
    if (!getAccessToken()) return;

    const response = await apiFetch(`/wishlist/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    }, { redirectOnExpired: false });
    if (response.status === 401 && !getAccessToken()) return;
    if (!response.ok && response.status !== 404) {
      throw new Error('No se pudo quitar el favorito.');
    }

    setRemoteItems((current) => current.filter((item) => item.product.id !== productId));
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
