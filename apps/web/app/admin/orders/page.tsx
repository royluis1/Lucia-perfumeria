'use client';

import { useEffect, useState } from 'react';
import { listAdminOrders, updateAdminOrder } from '../../../lib/admin';
import type { AdminOrder } from '../../../lib/admin';
import { Logo } from '../../../components/logo';
import { StatusBadge } from '../../../components/status-badge';

const orderStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const paymentStatuses = ['PENDING', 'PAID', 'REJECTED', 'REFUNDED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load(pageNumber: number) {
    try {
      const result = await listAdminOrders(pageNumber);
      setOrders(result.data);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los pedidos.');
    }
  }

  useEffect(() => {
    void load(1);
  }, []);

  async function handleUpdate(order: AdminOrder, field: 'status' | 'paymentStatus', value: string) {
    setError('');
    setMessage('');
    try {
      await updateAdminOrder(order.id, { [field]: value });
      setMessage(`Pedido ${order.id.slice(0, 8)} actualizado.`);
      await load(page);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el pedido');
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a className="font-display text-xl" href="/admin" aria-label="Panel admin"><Logo className="text-xl" /></a>
        <a className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/shop">Tienda</a>
      </div>
      <a className="mt-10 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-muted transition-colors hover:text-black" href="/admin"><span aria-hidden="true">←</span>Volver al panel</a>
      <h1 className="mt-5 font-display text-6xl font-black uppercase tracking-[-0.02em]">Pedidos</h1>
      {message && <p className="mt-6 border border-line bg-white px-4 py-3 text-sm" role="status">{message}</p>}
      {error && <p className="mt-6 border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      <div className="mt-10 space-y-4">
        {orders.length === 0 && <p className="border border-line bg-white p-8 text-muted">Todavía no hay pedidos.</p>}
        {orders.map((order) => (
          <article className="border border-line bg-white p-6" key={order.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Pedido {order.id.slice(0, 8)}</p>
                  <StatusBadge value={order.status} />
                  <StatusBadge kind="payment" value={order.paymentStatus} />
                </div>
                <p className="mt-2 text-sm text-muted">{order.user.name ?? order.user.email} · {new Date(order.createdAt).toLocaleDateString('es-AR')}</p>
                <ul className="mt-3 space-y-1 text-sm text-black/70">
                  {order.items.map((item, index) => <li key={`${order.id}-${index}`}>{item.quantity} × {item.product.name} · {item.quantity}×{item.product.sku}</li>)}
                </ul>
              </div>
              <div className="w-64 space-y-3">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                  Estado
                  <select className="mt-1 w-full border-b border-black/30 bg-transparent py-2 outline-none transition-colors focus:border-black" value={order.status} onChange={(event) => void handleUpdate(order, 'status', event.target.value)}>
                    {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                  Pago
                  <select className="mt-1 w-full border-b border-black/30 bg-transparent py-2 outline-none transition-colors focus:border-black" value={order.paymentStatus} onChange={(event) => void handleUpdate(order, 'paymentStatus', event.target.value)}>
                    {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              </div>
              <p className="text-lg font-semibold">${order.total}</p>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center gap-3 text-xs uppercase tracking-[0.14em]">
          <button className="border border-black px-4 py-2 transition-colors hover:bg-black hover:text-white disabled:opacity-30" disabled={page <= 1} onClick={() => void load(page - 1)} type="button">← Anterior</button>
          <span className="text-muted">Página {page} de {totalPages}</span>
          <button className="border border-black px-4 py-2 transition-colors hover:bg-black hover:text-white disabled:opacity-30" disabled={page >= totalPages} onClick={() => void load(page + 1)} type="button">Siguiente →</button>
        </div>
      )}
    </main>
  );
}