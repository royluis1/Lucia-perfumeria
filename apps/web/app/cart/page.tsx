'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '../../lib/auth';

type CartItem = {
  productId: string;
  quantity: number;
  product: { name: string; brand: string; price: string; slug: string };
  subtotal: string;
};

type Cart = { items: CartItem[]; subtotal: string };

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Iniciá sesión para ver tu carrito.');
      return;
    }
    fetch(`${apiUrl}/cart`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo cargar el carrito');
        return response.json() as Promise<Cart>;
      })
      .then(setCart)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el carrito'));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
        <a className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Seguir comprando</a>
      </div>
      <h1 className="mt-20 font-display text-6xl font-bold uppercase">Tu carrito</h1>
      {error && <p className="mt-8 border border-black/10 bg-white p-6 text-black/65">{error} <a className="font-bold underline" href="/login">Ingresar</a></p>}
      {cart && (
        <div className="mt-10 space-y-4">
          {cart.items.length === 0 && <p className="text-black/60">Todavía no agregaste productos.</p>}
          {cart.items.map((item) => (
            <div className="flex justify-between border-b border-black/10 py-5" key={item.productId}>
              <div><h2 className="font-semibold">{item.product.name}</h2><p className="text-sm text-black/55">{item.product.brand} · Cantidad: {item.quantity}</p></div>
              <p className="font-semibold">${item.subtotal}</p>
            </div>
          ))}
          <div className="flex justify-between pt-6 text-lg font-semibold"><span>Subtotal</span><span>${cart.subtotal}</span></div>
          <a className="mt-6 block w-full border border-black bg-black px-8 py-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-gold hover:text-black" href="/checkout">Continuar al checkout</a>
          <a className="mt-4 block text-center text-xs uppercase tracking-[0.16em] underline" href="/account/orders">Ver mis pedidos</a>
        </div>
      )}
    </main>
  );
}
