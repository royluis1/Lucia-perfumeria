'use client';

import { useState } from 'react';
import { apiFetch, getAccessToken } from '../lib/auth';
import { useCart } from '../lib/cart';

export function AddToCartButton({
  productId,
  productName,
  productBrand,
  productPrice,
  quantity = 1,
  disabled,
  overlay = false,
  compact = false,
}: {
  productId: string;
  productName: string;
  productBrand: string;
  productPrice: number;
  quantity?: number;
  disabled?: boolean;
  overlay?: boolean;
  compact?: boolean;
}) {
  const [message, setMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  async function handleAddToCart() {
    setIsAdding(true);
    setMessage('');
    addItem({
      id: productId,
      productId,
      name: productName,
      brand: productBrand,
      price: productPrice,
      quantity,
    });

    const token = getAccessToken();
    if (token) {
      try {
        const response = await apiFetch('/cart/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, quantity }),
        }, { redirectOnExpired: false });
        if (!response.ok && response.status !== 401) {
          console.error('No se pudo sincronizar el carrito de la cuenta; el carrito local se conservó.');
        }
      } catch (error) {
        console.error('No se pudo sincronizar el carrito de la cuenta; el carrito local se conservó.', error);
      }
    }
    setMessage('Agregado al carrito');
    setIsAdding(false);
  }

  if (overlay) {
    return (
      <div>
        <button
          className="w-full border border-black bg-black px-4 py-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || isAdding}
          onClick={handleAddToCart}
          type="button"
        >
          {isAdding ? 'Agregando…' : message || 'Agregar al carrito'}
        </button>
        {message && (
          <span className="sr-only" role="status">
            {message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        className={`btn-primary ${compact ? 'w-full' : 'mt-8 w-full'}`}
        disabled={disabled || isAdding}
        onClick={handleAddToCart}
        type="button"
      >
        {isAdding ? 'Agregando…' : 'Agregar al carrito'}
      </button>
      {message && <p className="mt-3 text-sm text-muted" role="status">{message}</p>}
    </div>
  );
}
