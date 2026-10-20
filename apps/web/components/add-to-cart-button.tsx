'use client';

import { useState } from 'react';
import { getAccessToken } from '../lib/auth';
import { useCart } from '../lib/cart';
import { API_URL } from '../lib/config';

const apiUrl = API_URL;

export function AddToCartButton({
  productId,
  productName,
  productBrand,
  productPrice,
  disabled,
  overlay = false,
}: {
  productId: string;
  productName: string;
  productBrand: string;
  productPrice: number;
  disabled?: boolean;
  overlay?: boolean;
}) {
  const [message, setMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  async function handleAddToCart() {
    setIsAdding(true);
    setMessage('');
    try {
      addItem({
        id: productId,
        productId,
        name: productName,
        brand: productBrand,
        price: productPrice,
      });

      const token = getAccessToken();
      if (token) {
        const response = await fetch(`${apiUrl}/cart/items`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, quantity: 1 }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? 'No se pudo sincronizar con el servidor');
        }
      }

      setMessage('Agregado al carrito');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error al agregar');
    } finally {
      setIsAdding(false);
    }
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
        className="btn-primary mt-8 w-full"
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
