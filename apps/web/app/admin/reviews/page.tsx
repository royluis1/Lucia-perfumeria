'use client';

import { useEffect, useState } from 'react';
import { listPendingReviews, approveReview, deleteReview } from '../../../lib/admin';
import type { PendingReview } from '../../../lib/admin';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setReviews(await listPendingReviews());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las reseñas.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleApprove(id: string) {
    try {
      await approveReview(id);
      await load();
      setMessage('Reseña aprobada y publicada.');
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'No se pudo aprobar la reseña');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta reseña definitivamente?')) return;
    try {
      await deleteReview(id);
      await load();
      setMessage('Reseña eliminada.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la reseña');
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex justify-between">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/admin">LUCÍA</a>
        <a className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Tienda</a>
      </div>
      <a className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-black/55 transition hover:text-black" href="/admin"><span aria-hidden="true">←</span>Volver al panel</a>
      <h1 className="mt-5 font-display text-6xl font-bold uppercase">Reseñas pendientes</h1>
      {message && <p className="mt-6 text-sm text-green-900" role="status">{message}</p>}
      {error && <p className="mt-6 text-sm text-red-700" role="alert">{error}</p>}

      <div className="mt-10 space-y-4">
        {reviews.length === 0 && <p className="border border-black/10 bg-white p-8 text-black/60">No hay reseñas pendientes de moderación.</p>}
        {reviews.map((review) => (
          <article className="border border-black/10 bg-white p-6" key={review.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{review.user.name ?? 'Cliente'}</p>
                <p className="text-xs text-black/50">{review.product.name} · {review.isVerifiedPurchase ? 'Compra verificada' : 'Sin verificar'} · {new Date(review.createdAt).toLocaleDateString('es-AR')}</p>
                <p className="mt-2 text-sm text-black/70">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                <p className="mt-2 text-sm leading-6 text-black/70">{review.comment}</p>
              </div>
              <div className="flex gap-2">
                <button className="border border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-gold hover:text-black" onClick={() => void handleApprove(review.id)} type="button">Aprobar</button>
                <button className="border border-red-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50" onClick={() => void handleDelete(review.id)} type="button">Eliminar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}