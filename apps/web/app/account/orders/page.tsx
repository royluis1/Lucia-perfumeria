'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '../../../lib/auth';

type Order = {
  id: string;
  total: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{ quantity: number; product: { name: string; brand: string } }>;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setMessage('Iniciá sesión para consultar tus pedidos.');
      return;
    }
    fetch(`${apiUrl}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudieron cargar tus pedidos');
        return response.json() as Promise<Order[]>;
      })
      .then(setOrders)
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'No se pudieron cargar tus pedidos'));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
        <a className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Seguir comprando</a>
      </div>
      <h1 className="mt-20 font-display text-6xl font-bold uppercase">Mis pedidos</h1>
      {message && <p className="mt-8 border border-black/10 bg-white p-6 text-black/65">{message}</p>}
      <div className="mt-10 space-y-4">
        {orders.map((order) => (
          <article className="border border-black/10 bg-white p-6" key={order.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.15em]">Pedido {order.id.slice(0, 8)}</p>
              <p className="text-sm font-semibold">${order.total}</p>
            </div>
            <p className="mt-3 text-sm text-black/60">{new Date(order.createdAt).toLocaleDateString('es-AR')} · {order.status} · Pago {order.paymentStatus}</p>
            <ul className="mt-4 space-y-1 text-sm">
              {order.items.map((item, index) => <li key={`${order.id}-${index}`}>{item.quantity} × {item.product.name} ({item.product.brand})</li>)}
            </ul>
          </article>
        ))}
        {!message && orders.length === 0 && <p className="text-black/60">Todavía no tenés pedidos.</p>}
      </div>
    </main>
  );
}
