'use client';

import { useState } from 'react';
import { getAccessToken } from '../lib/auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export function AddToCartButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const [message, setMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  async function addToCart() {
    const token = getAccessToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setIsAdding(true);
    setMessage('');
    try {
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
        throw new Error(body?.message ?? 'No se pudo agregar el producto');
      }
      setMessage('Agregado al carrito');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo agregar el producto');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div>
      <button
        className="mt-8 border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled || isAdding}
        onClick={addToCart}
        type="button"
      >
        {isAdding ? 'Agregando...' : 'Agregar al carrito'}
      </button>
      {message && <p className="mt-3 text-sm text-black/65" role="status">{message}</p>}
    </div>
  );
}
