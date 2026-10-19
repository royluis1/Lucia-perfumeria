'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '../../../lib/auth';
import { API_URL } from '../../../lib/config';

type Order = {
  id: string;
  total: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{ quantity: number; product: { name: string; brand: string } }>;
};

const apiUrl = API_URL;

const PAYMENT_BANNERS: Record<string, string> = {
  success: '¡Pago exitoso! Estamos confirmando la acreditación con Mercado Pago; el estado del pedido se actualiza automáticamente.',
  failure: 'El pago no se completó. Podés reintentarlo con el botón "Pagar ahora" de tu pedido.',
  pending: 'Tu pago quedó pendiente de acreditación (por ejemplo, en efectivo o transferencia). Se actualiza cuando Mercado Pago lo confirme.',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Acreditado',
  REJECTED: 'Rechazado',
  IN_PROCESS: 'En proceso',
  REFUNDED: 'Reembolsado',
  CHARGED_BACK: 'Contracargo',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [banner, setBanner] = useState('');
  const [payingOrderId, setPayingOrderId] = useState('');
  const [checkoutConfigured, setCheckoutConfigured] = useState(false);

  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get('payment');
    if (payment && PAYMENT_BANNERS[payment]) setBanner(PAYMENT_BANNERS[payment]);

    const token = getAccessToken();
    if (!token) {
      setMessage('Iniciá sesión para consultar tus pedidos.');
      return;
    }
    fetch(`${apiUrl}/payments/status`)
      .then(async (response) => (response.ok ? ((await response.json()) as { configured?: boolean }) : null))
      .then((status) => setCheckoutConfigured(Boolean(status?.configured)))
      .catch(() => setCheckoutConfigured(false));
    fetch(`${apiUrl}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudieron cargar tus pedidos');
        return response.json() as Promise<Order[]>;
      })
      .then(setOrders)
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'No se pudieron cargar tus pedidos'));
  }, []);

  async function payNow(orderId: string) {
    const token = getAccessToken();
    if (!token) {
      setMessage('Iniciá sesión para pagar tus pedidos.');
      return;
    }
    setPayingOrderId(orderId);
    setMessage('');
    try {
      const response = await fetch(`${apiUrl}/payments/preference`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const payment = (await response.json().catch(() => null)) as { checkoutUrl?: string; message?: string } | null;
      if (!response.ok || !payment?.checkoutUrl) {
        throw new Error(payment?.message ?? 'No se pudo iniciar el pago');
      }
      window.location.assign(payment.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar el pago');
      setPayingOrderId('');
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
        <a className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Seguir comprando</a>
      </div>
      <h1 className="mt-20 font-display text-6xl font-black uppercase tracking-[-0.02em]">Mis pedidos</h1>
      {banner && <p className="mt-8 border border-line bg-gold-soft px-6 py-4 text-sm" role="status">{banner}</p>}
      {message && <p className="mt-8 border border-line bg-white p-6 text-muted" role="status">{message}</p>}
      <div className="mt-10 space-y-4">
        {orders.map((order) => {
          const canPay = checkoutConfigured && order.paymentStatus === 'PENDING' && order.status === 'PENDING';
          return (
            <article className="border border-line bg-white p-6" key={order.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.15em]">Pedido {order.id.slice(0, 8)}</p>
                <p className="text-sm font-semibold">${order.total}</p>
              </div>
              <p className="mt-3 text-sm text-muted">
                {new Date(order.createdAt).toLocaleDateString('es-AR')} · {ORDER_STATUS_LABELS[order.status] ?? order.status} · Pago {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
              </p>
              <ul className="mt-4 space-y-1 text-sm">
                {order.items.map((item, index) => <li key={`${order.id}-${index}`}>{item.quantity} × {item.product.name} ({item.product.brand})</li>)}
              </ul>
              {canPay && (
                <button
                  className="mt-5 border border-black bg-black px-6 py-3 text-xs font-extrabold uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black disabled:opacity-50"
                  disabled={payingOrderId === order.id}
                  onClick={() => payNow(order.id)}
                  type="button"
                >
                  {payingOrderId === order.id ? 'Iniciando pago...' : 'Pagar ahora'}
                </button>
              )}
            </article>
          );
        })}
        {!message && orders.length === 0 && <p className="text-muted">Todavía no tenés pedidos.</p>}
      </div>
    </main>
  );
}
