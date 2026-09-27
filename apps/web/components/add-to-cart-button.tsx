'use client';

import { useState } from 'react';
import { getAccessToken } from '../lib/auth';
import { useCart } from '../lib/cart';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export function AddToCartButton({
  productId,
  productName,
  productBrand,
  productPrice,
  disabled,
}: {
  productId: string;
  productName: string;
  productBrand: string;
  productPrice: number;
  disabled?: boolean;
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

  return (
    <div>
      <button
        className="mt-8 w-full border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled || isAdding}
        onClick={handleAddToCart}
        type="button"
      >
        {isAdding ? 'Agregando...' : 'Agregar al carrito'}
      </button>
      {message && <p className="mt-3 text-sm text-black/65" role="status">{message}</p>}
    </div>
  );
}
